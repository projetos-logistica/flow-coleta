import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  COLETA_OPTIONS,
  CONTATO_OPTIONS,
  DISPLAY_ORDER,
  ESCALA_OPTIONS,
  FIELD_LABELS,
  SITUACAO_OPTIONS,
  getUltimoDiaUtil,
  isEscalaNoPrazo,
  isHoje,
  isMesmoDia,
  nivelSla,
  normSituacao,
  type EditableField,
  type Pedido,
} from "@/lib/coletas";
import { fetchHistorico, usePedidos } from "@/hooks/use-coletas";
import { importarPlanilha, type ProgressoImportacao } from "@/lib/importacao";
import { mensagemAmigavel } from "@/lib/rede";
import { HeaderBar } from "@/components/coletas/header-bar";
import { GlobalFilterBar } from "@/components/coletas/global-filter-bar";
import { KpiBlock } from "@/components/coletas/kpi-block";
import {
  LojaRanking,
  type LojaRankingItem,
  type RankingAba,
} from "@/components/coletas/loja-ranking";
import { OrdersTable } from "@/components/coletas/orders-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PanelLeftOpen, Copy, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/")(
  {
    head: () => ({
      meta: [
        { title: "Painel de Coletas - SFS Convencional" },
        {
          name: "description",
          content:
            "Painel compartilhado de pedidos pendentes de coleta - SFS Convencional: importe a planilha, acompanhe status em tempo real e registre o histórico de alterações.",
        },
        { property: "og:title", content: "Painel de Coletas - SFS Convencional" },
        {
          property: "og:description",
          content:
            "Controle compartilhado de coletas - SFS Convencional com importação de planilha, KPIs, ranking de lojas e auditoria de alterações.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    }),
    component: Painel,
  },
);

const USER_KEY = "coletas-usuario";

function Painel() {
  // ─── Estado de Usuário ───
  const [usuario, setUsuario] = useState("");

  // ─── Filtros Globais (Barra no topo) ───
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [filtroMarca, setFiltroMarca] = useState<string[]>([]);
  const [filtroOrigem, setFiltroOrigem] = useState<string[]>([]);
  const [filtroTransportadora, setFiltroTransportadora] = useState<string[]>([]);
  const [filtroEscala, setFiltroEscala] = useState<string[]>([]);

  // ─── Filtros de Painel (KPIs, Ranking, Busca) ───
  const [filtroKpiCard, setFiltroKpiCard] = useState<
    "pendentes" | "atrasados" | "noprazo" | "coletados_hoje" | null
  >(null);
  const [filtroColeta, setFiltroColeta] = useState<string | null>(null);
  const [filtroSituacao, setFiltroSituacao] = useState<string[]>([]);
  const [filtroLoja, setFiltroLoja] = useState<string[]>([]);
  const [filtroContato, setFiltroContato] = useState("");
  const [buscaTags, setBuscaTags] = useState<string[]>([]);
  const [buscaTexto, setBuscaTexto] = useState("");

  // ─── Tabela & Bulk ───
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState({
    contato: CONTATO_OPTIONS[0] as string,
    situacao: SITUACAO_OPTIONS[0] as string,
  });
  const [importando, setImportando] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [progressoImportacao, setProgressoImportacao] = useState<ProgressoImportacao | null>(null);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Init usuário ───
  useEffect(() => {
    const salvo = localStorage.getItem(USER_KEY) ?? "";
    setUsuario(salvo);
  }, []);

  // ─── Query Supabase ───
  const { query, aplicarStatus, limparBase, invalidate } = usePedidos(usuario);
  const pedidos = useMemo(() => query.data ?? [], [query.data]);

  // ─── Marcas disponíveis (coluna MARCA da planilha) ───
  const marcasDisponiveis = useMemo(
    () =>
      [...new Set(pedidos.map((p) => (p.marca ?? "").trim()).filter(Boolean))].sort(),
    [pedidos],
  );


  const origensDisponiveis = useMemo(
    () => [...new Set(pedidos.map((p) => p.origem).filter(Boolean))].sort(),
    [pedidos],
  );

  const transportadorasDisponiveis = useMemo(
    () => [...new Set(pedidos.map((p) => p.transportadora).filter(Boolean))].sort(),
    [pedidos],
  );

  const lojasDisponiveis = useMemo(
    () => [...new Set(pedidos.map((p) => (p.nome_loja ?? "").trim()).filter(Boolean))].sort(),
    [pedidos],
  );

  // ─── Pré-filtro global (base para KPIs e Tabela) ───
  const pedidosGlobal = useMemo(() => {
    return pedidos.filter((p) => {
      // Filtro de período
      if (filtroDataInicio) {
        const dp = p.data_pedido ?? "";
        // data_pedido está em DD/MM/YYYY – converter para comparação
        const partes = dp.split("/");
        if (partes.length === 3) {
          const iso = `${partes[2]}-${partes[1]}-${partes[0]}`;
          if (iso < filtroDataInicio) return false;
        }
      }
      if (filtroDataFim) {
        const dp = p.data_pedido ?? "";
        const partes = dp.split("/");
        if (partes.length === 3) {
          const iso = `${partes[2]}-${partes[1]}-${partes[0]}`;
          if (iso > filtroDataFim) return false;
        }
      }
      // Filtro de marca
      if (filtroMarca.length > 0 && !filtroMarca.includes((p.marca ?? "").trim()))
        return false;

      // Filtro de origem
      if (filtroOrigem.length > 0 && !filtroOrigem.includes(p.origem)) return false;
      // Filtro de transportadora
      if (filtroTransportadora.length > 0 && !filtroTransportadora.includes(p.transportadora))
        return false;
      // Filtro de escala coleta (SLA)
      if (
        filtroEscala.length > 0 &&
        !filtroEscala.includes((p.escala_coleta ?? "").trim())
      )
        return false;
      return true;
    });
  }, [pedidos, filtroDataInicio, filtroDataFim, filtroMarca, filtroOrigem, filtroTransportadora, filtroEscala]);

  // ─── Base dos KPIs (com cross-filtering de lojas) ───
  const pedidosBaseKpi = useMemo(() => {
    if (filtroLoja.length === 0) return pedidosGlobal;
    return pedidosGlobal.filter((p) => filtroLoja.includes(p.nome_loja));
  }, [pedidosGlobal, filtroLoja]);

  // 4 Indicadores Principais de Coleta (Total Pendentes - todas as situações)
  const totalPendentes = useMemo(
    () =>
      pedidosBaseKpi.filter(
        (p) => p.status_coleta === "Pendente",
      ).length,
    [pedidosBaseKpi],
  );

  const pedidosNoPrazo = useMemo(
    () =>
      pedidosBaseKpi.filter((p) => {
        if (p.status_coleta !== "Pendente") return false;
        return isEscalaNoPrazo(p.escala_coleta);
      }).length,
    [pedidosBaseKpi],
  );

  const pedidosAtrasados = useMemo(
    () =>
      pedidosBaseKpi.filter((p) => {
        if (p.status_coleta !== "Pendente") return false;
        return !isEscalaNoPrazo(p.escala_coleta);
      }).length,
    [pedidosBaseKpi],
  );

  const diaSemanaHoje = new Date().getDay(); // 0=Dom, 1=Seg, ..., 6=Sab
  const isSegunda = diaSemanaHoje === 1;
  const ultimoDiaUtil = useMemo(() => getUltimoDiaUtil(), []);

  const coletadosHoje = useMemo(
    () =>
      pedidosBaseKpi.filter(
        (p) => p.status_coleta === "Coletado" && isHoje(p.data_coleta || p.coletado_at),
      ).length,
    [pedidosBaseKpi],
  );

  const coletadosUltimoDia = useMemo(
    () =>
      pedidosBaseKpi.filter(
        (p) =>
          p.status_coleta === "Coletado" &&
          isMesmoDia(p.data_coleta || p.coletado_at, ultimoDiaUtil),
      ).length,
    [pedidosBaseKpi, ultimoDiaUtil],
  );

  const exibirUltimoDiaColetados = !isSegunda && coletadosHoje === 0;

  const contagemSituacao = (valor: string) =>
    pedidosBaseKpi.filter(
      (p) =>
        p.status_coleta === "Pendente" &&
        normSituacao(p.situacao) === normSituacao(valor),
    ).length;

  // ─── Filtrados para tabela (todos os filtros aplicados) ───
  const filtrados = useMemo(() => {
    const termosTexto = buscaTexto
      .split(/[,\n\r;\s\t]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const todosTermos = Array.from(
      new Set([
        ...buscaTags.map((t) => t.trim().toLowerCase()).filter(Boolean),
        ...termosTexto,
      ]),
    );

    return pedidosGlobal.filter((p) => {
      // 1. Filtro dos Cards de KPI (Total Pendentes, Atrasados e No Prazo)
      if (filtroKpiCard === "pendentes") {
        if (p.status_coleta !== "Pendente") return false;
      } else if (filtroKpiCard === "atrasados") {
        if (p.status_coleta !== "Pendente") return false;
        if (isEscalaNoPrazo(p.escala_coleta)) return false;
      } else if (filtroKpiCard === "noprazo") {
        if (p.status_coleta !== "Pendente") return false;
        if (!isEscalaNoPrazo(p.escala_coleta)) return false;
      } else if (filtroKpiCard === "coletados_hoje") {
        if (p.status_coleta !== "Coletado") return false;
        if (exibirUltimoDiaColetados) {
          if (!isMesmoDia(p.data_coleta || p.coletado_at, ultimoDiaUtil)) return false;
        } else {
          if (!isHoje(p.data_coleta || p.coletado_at)) return false;
        }
      } else if (filtroColeta) {
        if (p.status_coleta !== filtroColeta) return false;
      }

      if (
        filtroSituacao.length > 0 &&
        (p.status_coleta !== "Pendente" ||
          !filtroSituacao.some(
            (s) => normSituacao(s) === normSituacao(p.situacao),
          ))
      )
        return false;
      if (filtroLoja.length > 0 && !filtroLoja.includes(p.nome_loja)) return false;
      if (filtroContato && p.status_contato !== filtroContato) return false;
      if (todosTermos.length > 0) {
        const hay = DISPLAY_ORDER.map((f) => String(p[f] ?? ""))
          .join(" ")
          .toLowerCase();
        const bateu = todosTermos.some((t) => hay.includes(t));
        if (!bateu) return false;
      }
      return true;
    }).sort((a, b) => {
      // 1º Critério: Pendentes primeiro, Coletados por último
      const aPendente = a.status_coleta === "Pendente";
      const bPendente = b.status_coleta === "Pendente";
      if (aPendente && !bPendente) return -1;
      if (!aPendente && bPendente) return 1;

      // 2º Critério: Criticidade da Escala Coleta (mais crítico / maior atraso primeiro)
      const aEscalaIdx = ESCALA_OPTIONS.indexOf(a.escala_coleta as (typeof ESCALA_OPTIONS)[number]);
      const bEscalaIdx = ESCALA_OPTIONS.indexOf(b.escala_coleta as (typeof ESCALA_OPTIONS)[number]);
      const aIdx = aEscalaIdx === -1 ? 999 : aEscalaIdx;
      const bIdx = bEscalaIdx === -1 ? 999 : bEscalaIdx;
      if (aIdx !== bIdx) return aIdx - bIdx;

      // 3º Critério: Data do pedido mais antiga primeiro (desempate)
      const toIsoDate = (dp?: string) => {
        if (!dp) return "9999-99-99";
        const p = dp.split("/");
        return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : dp;
      };
      const aData = toIsoDate(a.data_pedido);
      const bData = toIsoDate(b.data_pedido);
      if (aData !== bData) return aData.localeCompare(bData);

      return 0;
    });
  }, [
    pedidosGlobal,
    buscaTags,
    buscaTexto,
    filtroKpiCard,
    filtroColeta,
    filtroSituacao,
    filtroLoja,
    filtroContato,
    exibirUltimoDiaColetados,
    ultimoDiaUtil,
  ]);

  // ─── Paginação ───
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const paginados = useMemo(
    () => filtrados.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina),
    [filtrados, paginaAtual, porPagina],
  );

  useEffect(() => {
    setPagina(1);
  }, [
    buscaTags,
    buscaTexto,
    filtroKpiCard,
    filtroColeta,
    filtroSituacao,
    filtroLoja,
    filtroContato,
    porPagina,
    filtroDataInicio,
    filtroDataFim,
    filtroMarca,
    filtroOrigem,
    filtroTransportadora,
    filtroEscala,
  ]);

  // ─── Ranking de lojas (prioridade SLA x volume) ───
  const [abaRanking, setAbaRanking] = useState<RankingAba>("prioridade");
  const [rankingAberto, setRankingAberto] = useState(true);

  const ranking = useMemo(() => {
    const mapa = new Map<string, LojaRankingItem>();
    let totalCriticosAtrasadosGeral = 0;

    pedidosGlobal
      .filter(
        (p) =>
          p.status_coleta === "Pendente" &&
          normSituacao(p.situacao) === normSituacao("AGUARDANDO"),
      )
      .forEach((p) => {
        const item =
          mapa.get(p.nome_loja) ??
          { nome: p.nome_loja, total: 0, criticos: 0, atrasados: 0, em_dia: 0, prevencao: 0, prioridade_percent: 0 };
        item.total += 1;
        const nivel = nivelSla(p.escala_coleta);
        const escalaNormal = (p.escala_coleta ?? "").trim().toLowerCase();

        if (nivel === "critico") {
          item.criticos += 1;
          totalCriticosAtrasadosGeral += 1;
        } else if (nivel === "atencao") {
          item.atrasados += 1;
          totalCriticosAtrasadosGeral += 1;
        } else {
          item.em_dia += 1;
        }

        // Regra de prevenção: "vence hoje" e "1 a 2 dias"
        if (escalaNormal === "vence hoje" || escalaNormal === "1 a 2 dias") {
          item.prevencao += 1;
        }

        mapa.set(p.nome_loja, item);
      });

    const totalGeralBase = [...mapa.values()].reduce((acc, i) => acc + i.total, 0);

    const lista = [...mapa.values()].map(item => {
      const somaProblemas = item.criticos + item.atrasados;
      item.prioridade_percent = totalCriticosAtrasadosGeral > 0 
        ? (somaProblemas / totalCriticosAtrasadosGeral) * 100 
        : 0;
      item.volume_percent = totalGeralBase > 0
        ? (item.total / totalGeralBase) * 100
        : 0;
      return item;
    });

    const ordenada =
      abaRanking === "volume"
        ? lista.sort((a, b) => b.total - a.total)
        : abaRanking === "prevencao"
          ? lista.sort((a, b) => b.em_dia - a.em_dia || b.total - a.total)
          : lista.sort(
              (a, b) =>
                b.criticos - a.criticos ||
                b.atrasados - a.atrasados ||
                b.total - a.total,
            );

    // Pareto: percentual acumulado seguindo a ordem exibida na aba atual.
    let acumPrioridade = 0;
    let acumVolume = 0;
    for (const item of ordenada) {
      acumPrioridade += item.prioridade_percent;
      acumVolume += item.volume_percent ?? 0;
      item.prioridade_acumulado = Math.min(acumPrioridade, 100);
      item.volume_acumulado = Math.min(acumVolume, 100);
    }

    return ordenada;
  }, [pedidosGlobal, abaRanking]);


  // ─── Filtro global ativo? ───
  const filtrosGlobaisAtivos =
    !!filtroDataInicio ||
    !!filtroDataFim ||
    filtroMarca.length > 0 ||
    filtroOrigem.length > 0 ||
    filtroTransportadora.length > 0 ||
    filtroLoja.length > 0 ||
    filtroEscala.length > 0 ||
    filtroKpiCard !== null ||
    filtroSituacao.length > 0 ||
    buscaTags.length > 0 ||
    !!buscaTexto;

  function limparFiltrosGlobais() {
    setFiltroDataInicio("");
    setFiltroDataFim("");
    setFiltroMarca([]);
    setFiltroOrigem([]);
    setFiltroTransportadora([]);
    setFiltroLoja([]);
    setFiltroEscala([]);
    setFiltroKpiCard(null);
    setFiltroSituacao([]);
    setBuscaTags([]);
    setBuscaTexto("");
  }

  // ─── Handlers ───
  function handleSalvarUsuario(nome: string) {
    const n = nome.trim().slice(0, 60);
    if (!n) return;
    localStorage.setItem(USER_KEY, n);
    setUsuario(n);
  }

  async function alterarCampo(pedido: Pedido, campo: EditableField, valor: string) {
    try {
      await aplicarStatus.mutateAsync({ pedidos: [pedido], field: campo, value: valor });
    } catch (e) {
      toast.error(mensagemAmigavel(e, "Não consegui salvar a alteração"));
    }
  }

  async function aplicarEmMassa(campo: EditableField, valor: string) {
    const alvos = filtrados.filter((p) => selecionados.has(p.numero_pedido));
    if (alvos.length === 0) return;
    try {
      const n = await aplicarStatus.mutateAsync({ pedidos: alvos, field: campo, value: valor });
      toast.success(`${n} pedido(s) atualizado(s) em ${FIELD_LABELS[campo]}.`);
      setSelecionados(new Set());
    } catch (e) {
      toast.error(mensagemAmigavel(e, "Não consegui aplicar a alteração em massa"));
    }
  }

  async function onImportar(file: File) {
    setImportando(true);
    setImportError(null);
    setProgressoImportacao({ enviados: 0, total: 0, etapa: "Lendo a planilha" });
    try {
      const tid = toast.loading("Lendo a planilha...", { duration: 20000 });
      const r = await importarPlanilha(file, pedidos, usuario, (p) => {
        setProgressoImportacao(p);
        toast.loading(
          `${p.etapa}: ${p.enviados.toLocaleString("pt-BR")} de ${p.total > 0 ? p.total.toLocaleString("pt-BR") : "—"} pedidos...`,
          { id: tid, duration: 20000 },
        );
      });
      toast.dismiss(tid);
      toast.success(
        `Importado com sucesso: ${r.novos} novo(s) · ${r.mantidos} existente(s) · ${r.coletados} coletado(s) automaticamente`,
        { duration: 20000, closeButton: true }
      );
      // Invalida cache e força recarregamento imediato
      await invalidate();
      await query.refetch();
    } catch (e) {
      toast.dismiss();
      const erroMsg = mensagemAmigavel(e, "Falha ao importar a planilha");
      setImportError(erroMsg);
    } finally {
      setImportando(false);
      setProgressoImportacao(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function exportarBase() {
    if (filtrados.length === 0) {
      toast.error("Não há pedidos visíveis para exportar.");
      return;
    }
    const linhas = filtrados.map((p) => {
      const row: Record<string, string> = {};
      DISPLAY_ORDER.forEach((f) => (row[FIELD_LABELS[f]] = String(p[f] ?? "")));
      row["Data Coleta"] = p.coletado_at
        ? new Date(p.coletado_at).toLocaleString("pt-BR")
        : "";
      row["Data Importação"] = p.importado_at
        ? new Date(p.importado_at).toLocaleString("pt-BR")
        : "";
      row["Primeira Importação"] = p.created_at
        ? new Date(p.created_at).toLocaleString("pt-BR")
        : "";
      row["Data Alteração Situação"] = (p.data_alteracao_situacao || p.situacao_updated_at)
        ? new Date(p.data_alteracao_situacao || p.situacao_updated_at!).toLocaleString("pt-BR")
        : "";

      return row;
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(linhas), "Coletas");
    
    // Formata o timestamp: YYYY-MM-DD_HHhMM
    const now = new Date();
    const ts = now.toISOString().slice(0, 10) + "_" + now.getHours().toString().padStart(2, '0') + "h" + now.getMinutes().toString().padStart(2, '0');
    XLSX.writeFile(wb, `Coletas_Filtradas_${ts}.xlsx`);
  }

  async function exportarHistorico() {
    const hist = await fetchHistorico();
    if (hist.length === 0) {
      toast.error("Ainda não há alterações registradas no histórico.");
      return;
    }
    const header = [
      "Data/Hora",
      "Usuário",
      "Número do Pedido",
      "Campo Alterado",
      "Valor Anterior",
      "Novo Valor",
    ];
    const linhas = [header.join(";")];
    hist.forEach((ev) => {
      linhas.push(
        [
          new Date(ev.created_at).toLocaleString("pt-BR"),
          ev.usuario,
          ev.numero_pedido,
          ev.campo,
          ev.valor_anterior,
          ev.valor_novo,
        ]
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(";"),
      );
    });
    const blob = new Blob([linhas.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historico-coletas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onLimparBase() {
    if (pedidos.length === 0) return;
    await limparBase.mutateAsync(pedidos);
    setSelecionados(new Set());
    toast.success("Base limpa.");
  }

  const totalSelecionados = filtrados.filter((p) => selecionados.has(p.numero_pedido)).length;

  // ─── Render ───
  return (
    <main className="w-full px-4 pb-16 pt-7 sm:px-6" style={{ background: "#F8F9FA", minHeight: "100vh" }}>
      <Toaster />

      {/* Input de arquivo oculto */}
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onImportar(f);
        }}
      />

      {/* Modal de Erro Detalhado (Importação) */}
      <AlertDialog open={!!importError} onOpenChange={(open) => !open && setImportError(null)}>
        <AlertDialogContent className="rounded-2xl border-rose-200 bg-white p-6 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg font-bold text-rose-600">
              <AlertTriangle className="size-5" />
              Falha na Importação
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600">
              Ocorreu um erro ao processar a planilha. Por favor, verifique a mensagem abaixo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-2 max-h-48 overflow-y-auto rounded-lg bg-rose-50 p-3 text-xs font-mono text-rose-800 border border-rose-100">
            {importError}
          </div>

          <AlertDialogFooter className="sm:justify-between">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(importError || "");
                toast.success("Detalhes copiados para a área de transferência!");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition"
            >
              <Copy className="size-3.5" /> Copiar detalhes
            </button>
            <AlertDialogAction className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl px-6">
              Fechar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 1. CABEÇALHO CLEAN */}
      <HeaderBar
        totalBase={pedidos.length}
        usuario={usuario}
        onSalvarUsuario={handleSalvarUsuario}
        onImportarClick={() => fileRef.current?.click()}
        onExportarBase={exportarBase}
        onExportarHistorico={exportarHistorico}
        onLimparBase={onLimparBase}
        importando={importando}
      />

      {importando && progressoImportacao && (
        <section
          className="mb-4 border border-slate-200 bg-white px-4 py-3 shadow-xs"
          aria-label="Progresso da importação"
          aria-live="polite"
        >
          <div className="mb-2 flex items-center justify-between gap-4 text-xs font-medium text-slate-700">
            <span>Processando a planilha...</span>
            <span>
              {progressoImportacao.enviados.toLocaleString("pt-BR")} de{" "}
              {progressoImportacao.total > 0
                ? progressoImportacao.total.toLocaleString("pt-BR")
                : "—"}{" "}
              pedidos concluídos
            </span>
          </div>
          <progress
            className="h-2 w-full accent-sky-400"
            max={Math.max(progressoImportacao.total, 1)}
            value={progressoImportacao.enviados}
          />
        </section>
      )}

      {/* 2. BARRA DE FILTROS GLOBAIS */}
      <GlobalFilterBar
        dataInicio={filtroDataInicio}
        dataFim={filtroDataFim}
        onDataInicioChange={setFiltroDataInicio}
        onDataFimChange={setFiltroDataFim}
        marcasDisponiveis={marcasDisponiveis}
        marcasSelecionadas={filtroMarca}
        onMarcaToggle={(m) =>
          setFiltroMarca((prev) =>
            prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
          )
        }
        origensDisponiveis={origensDisponiveis}
        origensSelecionadas={filtroOrigem}
        onOrigemToggle={(o) =>
          setFiltroOrigem((prev) =>
            prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o],
          )
        }
        transportadorasDisponiveis={transportadorasDisponiveis}
        transportadorasSelecionadas={filtroTransportadora}
        onTransportadoraToggle={(t) =>
          setFiltroTransportadora((prev) =>
            prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
          )
        }
        lojasDisponiveis={lojasDisponiveis}
        lojasSelecionadas={filtroLoja}
        onLojaToggle={(l) =>
          setFiltroLoja((prev) =>
            prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l],
          )
        }
        escalasSelecionadas={filtroEscala}
        onEscalaToggle={(e) =>
          setFiltroEscala((prev) =>
            prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
          )
        }
        temFiltrosAtivos={filtrosGlobaisAtivos}
        onLimparFiltros={limparFiltrosGlobais}
      />

      {/* 3. BLOCO DE INDICADORES (4 Cards de KPI + Chips de Situação) */}
      <KpiBlock
        kpiCards={[
          {
            id: "pendentes",
            label: "Total Pendentes",
            value: totalPendentes,
            active: filtroKpiCard === "pendentes",
            tooltip: "Total de pedidos pendentes em todas as situações que aguardam coleta.",
            theme: "neutro",
          },
          {
            id: "atrasados",
            label: "Pendentes Atrasados",
            value: pedidosAtrasados,
            active: filtroKpiCard === "atrasados",
            tooltip: "Soma dos pedidos pendentes com SLA de coleta fora do prazo.",
            theme: "atrasado",
          },
          {
            id: "noprazo",
            label: "Pendentes no Prazo",
            value: pedidosNoPrazo,
            active: filtroKpiCard === "noprazo",
            tooltip: "Soma dos pedidos pendentes no prazo de coleta (Vence hoje, -1 dia, -2 dias ou mais, ou no prazo).",
            theme: "noprazo",
          },
          {
            id: "coletados_hoje",
            label: "Coletados",
            value: exibirUltimoDiaColetados ? coletadosUltimoDia : coletadosHoje,
            active: filtroKpiCard === "coletados_hoje",
            tooltip: exibirUltimoDiaColetados
              ? "Total de pedidos coletados no último dia útil (aguardando a carga de hoje)."
              : "Quantidade de pedidos que tiveram a coleta confirmada no dia de hoje.",
            theme: "coletados",
          },
        ]}
        onKpiCardToggle={(id) =>
          setFiltroKpiCard((prev) => (prev === id ? null : id))
        }
        situacaoItems={SITUACAO_OPTIONS.map((o) => ({
          label: o,
          value: contagemSituacao(o),
          active: filtroSituacao.includes(o),
        }))}
        onSituacaoToggle={(l) =>
          setFiltroSituacao((prev) =>
            prev.includes(l) ? prev.filter((item) => item !== l) : [...prev, l],
          )
        }
      />

      {/* 4. ÁREA PRINCIPAL: Sidebar de Lojas + Tabela */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* Coluna Esquerda: Ranking de Lojas (~32%) — retrátil */}
        <div
          className={
            rankingAberto
              ? "min-w-0 origin-left transition-all duration-300 ease-out lg:col-span-4 xl:col-span-3 translate-x-0 opacity-100"
              : "hidden"
          }
        >
          <LojaRanking
            aba={abaRanking}
            onAbaChange={setAbaRanking}
            lojas={ranking}
            active={filtroLoja}
            onRecolher={() => setRankingAberto(false)}
            onSelect={(nome) =>
              setFiltroLoja((prev) =>
                prev.includes(nome)
                  ? prev.filter((item) => item !== nome)
                  : [...prev, nome],
              )
            }
            onSelectBadge={(nome, tipo) => {
              // Sempre aplica o filtro da loja
              setFiltroLoja([nome]);
              // Aplica o filtro de escala conforme o tipo do badge
              if (tipo === "critico") {
                setFiltroEscala(["5 a 6 dias", "7 a 8 dias", "9 a 10 dias", "11 dias ou mais"]);
              } else if (tipo === "atraso") {
                setFiltroEscala(["1 a 2 dias", "3 a 4 dias"]);
              } else if (tipo === "em_dia") {
                setFiltroEscala(["Vence hoje", "-1 dia", "-2 dias ou mais"]);
              } else {
                // total: limpa filtro de escala para mostrar tudo da loja
                setFiltroEscala([]);
              }
            }}
          />
        </div>

        {/* Coluna Direita: Tabela (~68% ou 100% em modo foco) */}
        <div
          className={
            rankingAberto
              ? "min-w-0 transition-all duration-300 ease-out lg:col-span-8 xl:col-span-9"
              : "min-w-0 w-full transition-all duration-300 ease-out lg:col-span-12"
          }
        >
          {!rankingAberto && (
            <button
              type="button"
              onClick={() => setRankingAberto(true)}
              className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900"
            >
              <PanelLeftOpen className="size-3.5 text-indigo-600" />
              Ranking de Lojas
            </button>
          )}
          {/* Barra de Ações em Massa (aparece ao selecionar pedidos) */}

          {totalSelecionados > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs text-indigo-900">
              <span className="font-bold">{totalSelecionados} selecionado(s)</span>


              <select
                className="rounded-lg border border-indigo-200 bg-white px-2 py-1.5 text-xs"
                value={bulk.contato}
                onChange={(e) => setBulk({ ...bulk, contato: e.target.value })}
              >
                {CONTATO_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <button
                type="button"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                onClick={() => aplicarEmMassa("status_contato", bulk.contato)}
              >
                Aplicar Contato
              </button>

              <select
                className="rounded-lg border border-indigo-200 bg-white px-2 py-1.5 text-xs"
                value={bulk.situacao}
                onChange={(e) => setBulk({ ...bulk, situacao: e.target.value })}
              >
                {SITUACAO_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <button
                type="button"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                onClick={() => aplicarEmMassa("situacao", bulk.situacao)}
              >
                Aplicar Situação
              </button>

              <button
                type="button"
                className="ml-auto rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                onClick={() => setSelecionados(new Set())}
              >
                Limpar seleção
              </button>
            </div>
          )}

          {query.isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
              Carregando pedidos...
            </div>
          ) : pedidos.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center text-slate-500">
              <p className="mb-1 text-base font-semibold text-slate-900">Nenhum pedido ainda</p>
              <p className="text-sm">
                Importe sua planilha para começar. Todos que abrirem este painel verão a mesma base,
                atualizada em tempo real.
              </p>
            </div>
          ) : (
            <OrdersTable
              pedidos={paginados}
              selected={selecionados}
              onToggle={(id) =>
                setSelecionados((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })
              }
              onToggleAll={(checked) =>
                setSelecionados(
                  checked ? new Set(paginados.map((p) => p.numero_pedido)) : new Set(),
                )
              }
              onChangeField={alterarCampo}
              buscaTags={buscaTags}
              onBuscaTagsChange={setBuscaTags}
              buscaTexto={buscaTexto}
              onBuscaTextoChange={setBuscaTexto}
              filtroContato={filtroContato}
              onFiltroContatoChange={setFiltroContato}
              pagina={paginaAtual}
              totalPaginas={totalPaginas}
              porPagina={porPagina}
              onPaginaChange={setPagina}
              onPorPaginaChange={setPorPagina}
              totalRegistros={filtrados.length}
            />
          )}
        </div>
      </div>
    </main>
  );
}
