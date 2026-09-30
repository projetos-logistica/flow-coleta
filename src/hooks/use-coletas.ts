import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  businessDaysSince,
  FIELD_LABELS,
  type EditableField,
  type EventoHistorico,
  type Pedido,
} from "@/lib/coletas";
import { comRetentativas } from "@/lib/rede";

const PEDIDOS_KEY = ["pedidos"];

type HistoricoInput = {
  numero_pedido: string;
  campo: string;
  valor_anterior: string;
  valor_novo: string;
};

/** Divide uma lista em lotes para evitar URLs/payloads grandes demais. */
export function emLotes<T>(itens: T[], tamanho: number): T[][] {
  const lotes: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) lotes.push(itens.slice(i, i + tamanho));
  return lotes;
}

export async function registrarHistorico(usuario: string, eventos: HistoricoInput[]) {
  if (eventos.length === 0) return;
  for (const lote of emLotes(eventos, 200)) {
    await comRetentativas(async () => {
      const { error } = await supabase.rpc("registrar_historico_bulk", {
        p_eventos: lote.map((e) => ({ ...e, usuario: usuario || "Anônimo" })) as unknown as never,
      });
      if (error) throw error;
    });
  }
}

/** Busca paginada: o Data API limita cada resposta a 1000 linhas. */
export async function fetchPedidos(): Promise<Pedido[]> {
  const PAGE = 1000;
  const todos: Pedido[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await comRetentativas(async () => await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: true })
      .order("numero_pedido", { ascending: true })
      .range(from, from + PAGE - 1));
    if (error) throw error;
    const lote = (data ?? []) as Pedido[];
    todos.push(...lote);
    if (lote.length < PAGE) break;
  }
  return todos;
}

/** Remove pedidos coletados há 2+ dias úteis, registrando no histórico. */
export async function limparColetadosExpirados(pedidos: Pedido[], usuario: string) {
  const now = new Date();
  const expirados = pedidos.filter(
    (p) =>
      p.status_coleta === "Coletado" &&
      p.coletado_at &&
      businessDaysSince(new Date(p.coletado_at), now) >= 2,
  );
  if (expirados.length === 0) return 0;
  for (const lote of emLotes(expirados.map((p) => p.numero_pedido), 200)) {
    const { error } = await supabase.from("pedidos").delete().in("numero_pedido", lote);
    if (error) throw error;
  }
  await registrarHistorico(
    usuario,
    expirados.map((p) => ({
      numero_pedido: p.numero_pedido,
      campo: "Registro",
      valor_anterior: "Coletado",
      valor_novo: "Excluído automaticamente (2 dias úteis coletado)",
    })),
  );
  return expirados.length;
}

/** Move para COBRAR MOVIMENTAÇÃO pedidos em AG. MOVIMENTAÇÃO há mais de 48h. */
export async function aplicarRegra48hMovimentacao(pedidos: Pedido[], usuario: string) {
  const limite = Date.now() - 48 * 60 * 60 * 1000;
  const alvos = pedidos.filter(
    (p) =>
      String(p.situacao ?? "").trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") ===
        "AG. MOVIMENTACAO" &&
      (p.data_alteracao_situacao || p.situacao_updated_at) &&
      new Date(p.data_alteracao_situacao || p.situacao_updated_at!).getTime() < limite,
  );
  if (alvos.length === 0) return 0;
  const agora = new Date().toISOString();
  for (const lote of emLotes(alvos.map((p) => p.numero_pedido), 200)) {
    const { error } = await supabase
      .from("pedidos")
      .update({
        situacao: "COBRAR MOVIMENTAÇÃO",
        situacao_updated_at: agora,
        data_alteracao_situacao: agora,
      })
      .in("numero_pedido", lote);
    if (error) throw error;
  }
  await registrarHistorico(
    usuario,
    alvos.map((p) => ({
      numero_pedido: p.numero_pedido,
      campo: FIELD_LABELS.situacao,
      valor_anterior: p.situacao,
      valor_novo: "COBRAR MOVIMENTAÇÃO (automático após 48h)",
    })),
  ).catch(() => undefined);
  return alvos.length;
}

export function usePedidos(usuario: string) {

  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PEDIDOS_KEY,
    queryFn: fetchPedidos,
    refetchInterval: 10000,
  });

  // Sincronização em tempo real entre todos os usuários do painel.
  useEffect(() => {
    const channel = supabase
      .channel("pedidos-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos" },
        () => queryClient.invalidateQueries({ queryKey: PEDIDOS_KEY }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Higiene automática da base.
  useEffect(() => {
    if (!query.data || query.data.length === 0) return;
    limparColetadosExpirados(query.data, usuario)
      .then((n) => {
        if (n > 0) queryClient.invalidateQueries({ queryKey: PEDIDOS_KEY });
      })
      .catch(() => undefined);
  }, [query.data, usuario, queryClient]);

  // Transição automática AG. MOVIMENTAÇÃO → COBRAR MOVIMENTAÇÃO após 48h.
  useEffect(() => {
    if (!query.data || query.data.length === 0) return;
    aplicarRegra48hMovimentacao(query.data, usuario)
      .then((n) => {
        if (n > 0) queryClient.invalidateQueries({ queryKey: PEDIDOS_KEY });
      })
      .catch(() => undefined);
  }, [query.data, usuario, queryClient]);



  const aplicarStatus = useMutation({
    mutationFn: async ({
      pedidos,
      field,
      value,
    }: {
      pedidos: Pedido[];
      field: EditableField;
      value: string;
    }) => {
      const alvos = pedidos.filter((p) => p[field] !== value);
      if (alvos.length === 0) return 0;
      const patch: Partial<Pedido> = { [field]: value };
      if (field === "status_coleta") {
        const agora = new Date().toISOString();
        patch.coletado_at = value === "Coletado" ? agora : null;
        patch.data_coleta = value === "Coletado" ? agora : null;
      }
      if (field === "situacao") {
        patch.situacao_updated_at = new Date().toISOString();
        patch.data_alteracao_situacao = new Date().toISOString();
      }


      for (const lote of emLotes(alvos.map((p) => p.numero_pedido), 200)) {
        const { error } = await supabase
          .from("pedidos")
          .update(patch)
          .in("numero_pedido", lote);
        if (error) throw error;
      }
      await registrarHistorico(
        usuario,
        alvos.map((p) => ({
          numero_pedido: p.numero_pedido,
          campo: FIELD_LABELS[field],
          valor_anterior: p[field] || "(vazio)",
          valor_novo: value,
        })),
      );
      return alvos.length;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PEDIDOS_KEY }),
  });

  const limparBase = useMutation({
    mutationFn: async (pedidos: Pedido[]) => {
      const { error } = await supabase.from("pedidos").delete().neq("numero_pedido", "");
      if (error) throw error;
      await registrarHistorico(
        usuario,
        pedidos.map((p) => ({
          numero_pedido: p.numero_pedido,
          campo: "Registro",
          valor_anterior: p.status_coleta,
          valor_novo: "Removido (limpeza manual da base)",
        })),
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PEDIDOS_KEY }),
  });

  return { query, aplicarStatus, limparBase, invalidate: () => queryClient.invalidateQueries({ queryKey: PEDIDOS_KEY }) };
}

export async function fetchHistorico(): Promise<EventoHistorico[]> {
  const PAGE = 1000;
  const todos: EventoHistorico[] = [];
  for (let from = 0; from < 50000; from += PAGE) {
    const { data, error } = await comRetentativas(async () => await supabase
      .from("historico_alteracoes")
      .select("*")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1));
    if (error) throw error;
    const lote = (data ?? []) as EventoHistorico[];
    todos.push(...lote);
    if (lote.length < PAGE) break;
  }
  return todos;
}
