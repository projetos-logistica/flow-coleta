export type Pedido = {
  numero_pedido: string;
  data_pedido: string;
  nome_loja: string;
  transportadora: string;
  origem: string;
  marca: string;
  uf_destino: string;
  escala_coleta: string;
  status_coleta: string;
  status_contato: string;
  situacao: string;
  coletado_at: string | null;
  data_coleta?: string | null;
  importado_at: string | null;
  situacao_updated_at: string | null;
  data_alteracao_situacao: string | null;

  created_at?: string;
  updated_at: string;
};


export type EventoHistorico = {
  id: string;
  numero_pedido: string;
  usuario: string;
  campo: string;
  valor_anterior: string;
  valor_novo: string;
  created_at: string;
};

export const COLETA_OPTIONS = ["Pendente", "Coletado"] as const;
export const CONTATO_OPTIONS = ["Contato Realizado", "Contato Falhou"] as const;
export const SITUACAO_OPTIONS = [
  "AGUARDANDO",
  "ERRO SISTÊMICO",
  "PROBLEMA INTEGRAÇÃO",
  "AG. COLETA",
  "AG. MOVIMENTAÇÃO",
  "COBRAR MOVIMENTAÇÃO",
  "NÃO LIBERADO PELA LOJA",
  "BAIXO VOLUME",
] as const;


/** Normaliza situação (maiúsculas, sem acentos) para comparações seguras. */
export function normSituacao(v?: string | null): string {
  return String(v ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Dicionário oficial de legendas exibidas nas tooltips de Situação. */
export const SITUACAO_LEGENDAS: Record<string, string> = {
  AGUARDANDO: "Status inicial do pedido pendente de tratativa ou coleta.",
  "ERRO SISTEMICO": "Pedido com erro ou divergência no processo de faturamento.",
  "PROBLEMA INTEGRACAO":
    "Falha de comunicação/integração de dados entre o sistema e a transportadora.",
  "AG. COLETA":
    "Pedido faturado e pronto na loja, aguardando a retirada pela transportadora.",
  "AG. MOVIMENTACAO":
    "Pedido coletado aguardando a primeira movimentação/rastreio da transportadora. Após 48h vira COBRAR MOVIMENTAÇÃO automaticamente.",
  "COBRAR MOVIMENTACAO":
    "Pedido retido ou sem atualização de rastreio/movimentação na transportadora.",
  "NAO LIBERADO PELA LOJA":
    "Pedido não entregue à transportadora pela loja no momento da coleta.",
  "BAIXO VOLUME":
    "Coleta não realizada devido ao baixo volume e baixa frequência na rota.",
};

/** Legenda da situação (aceita valores com ou sem acentuação). */
export function legendaSituacao(v?: string | null): string | undefined {
  return SITUACAO_LEGENDAS[normSituacao(v)];
}

export type EditableField = "status_coleta" | "status_contato" | "situacao";


/** Identifica se a escala de coleta está dentro do prazo estipulado ("Vence hoje", valores negativos como "-1 dia", "-2 dias ou mais", ou contendo "no prazo"). */
export function isEscalaNoPrazo(escala?: string | null): boolean {
  const esc = String(escala ?? "").trim().toLowerCase();
  return esc === "vence hoje" || esc.startsWith("-") || esc.includes("no prazo");
}

/** Faixas de SLA da coluna ESCALA COLETA, da mais crítica para a mais recente. */
export const ESCALA_OPTIONS = [
  "11 dias ou mais",
  "9 a 10 dias",
  "7 a 8 dias",
  "5 a 6 dias",
  "3 a 4 dias",
  "1 a 2 dias",
  "Vence hoje",
  "-1 dia",
  "-2 dias ou mais",
] as const;

export const ESCALA_CRITICAS = [
  "5 a 6 dias",
  "7 a 8 dias",
  "9 a 10 dias",
  "11 dias ou mais",
] as const;
export const ESCALA_ATRASADAS = ["1 a 2 dias", "3 a 4 dias"] as const;

export type NivelSla = "critico" | "atencao" | "emdia";

/** Classifica a escala de coleta em nível de urgência operacional. */
export function nivelSla(escala?: string | null): NivelSla {
  const v = String(escala ?? "").trim().toLowerCase();
  if (!v || isEscalaNoPrazo(v)) return "emdia";
  if ((ESCALA_CRITICAS as readonly string[]).some((e) => e.toLowerCase() === v))
    return "critico";
  if ((ESCALA_ATRASADAS as readonly string[]).some((e) => e.toLowerCase() === v))
    return "atencao";
  return "emdia";
}

export const FIELD_LABELS: Record<string, string> = {
  data_pedido: "Data do Pedido",
  numero_pedido: "Número do Pedido",
  nome_loja: "Nome da Loja",
  transportadora: "Transportadora",
  origem: "Origem",
  marca: "Marca",
  uf_destino: "UF Destino",
  escala_coleta: "Escala Coleta",
  status_coleta: "Status Coleta",
  situacao: "Situação",
  status_contato: "Status Contato",
};

export const DISPLAY_ORDER = [
  "data_pedido",
  "numero_pedido",
  "nome_loja",
  "transportadora",
  "origem",
  "marca",
  "uf_destino",
  "escala_coleta",
  "status_coleta",
  "situacao",
  "status_contato",
] as const;


/** Classes de cor semânticas por status (tokens do design system). */
export function statusClasses(field: EditableField, value: string): string {
  if (field === "status_coleta") {
    return value === "Coletado"
      ? "bg-coletado text-coletado-foreground"
      : "bg-pendente text-pendente-foreground";
  }
  if (field === "status_contato") {
    if (value === "Contato Realizado") return "bg-finalizado text-finalizado-foreground";
    if (value === "Contato Falhou") return "bg-erro text-erro-foreground";
    return "bg-neutro text-neutro-foreground";
  }
  const vUpper = normSituacao(value);
  if (vUpper === "AGUARDANDO") return "bg-pendente text-pendente-foreground";
  if (vUpper === "ERRO SISTEMICO" || vUpper === "PROBLEMA INTEGRACAO") return "bg-erro text-erro-foreground";
  if (vUpper === "AG. COLETA") return "bg-finalizado text-finalizado-foreground";
  if (vUpper === "AG. MOVIMENTACAO") return "bg-chip text-muted-foreground";
  if (vUpper === "COBRAR MOVIMENTACAO") return "bg-neutro text-neutro-foreground";
  if (vUpper === "NAO LIBERADO PELA LOJA") return "bg-naoentregue text-naoentregue-foreground";
  if (vUpper === "BAIXO VOLUME") return "bg-chip text-muted-foreground";
  return "bg-neutro text-neutro-foreground";
}

export function normHeader(h: unknown): string {
  return String(h ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function findHeader(
  headers: string[],
  test: (n: string) => boolean,
): string | undefined {
  return headers.find((h) => test(normHeader(h)));
}

export function formatDate(v: unknown): string {
  if (v instanceof Date && !isNaN(v.getTime())) return v.toLocaleDateString("pt-BR");
  return v == null ? "" : String(v);
}

/** Dias úteis (seg–sex) completos decorridos desde `from`. */
export function businessDaysSince(from: Date, to: Date): number {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() + 1);
  const today = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  let count = 0;
  while (d <= today) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "agora há pouco";
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h atrás`;
  return `${Math.floor(diff / 86400)} d atrás`;
}

/** Valor de texto ou traço quando vazio. */
export function ouTraco(v?: string | null): string {
  const s = String(v ?? "").trim();
  return s === "" ? "—" : s;
}

/** Data/hora formatada em pt-BR ou traço. */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/** Obtém o último dia útil (seg–sex) em relação a uma data de referência. */
export function getUltimoDiaUtil(referencia: Date = new Date()): Date {
  const d = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());
  const diaSemana = d.getDay(); // 0 = Dom, 1 = Seg, 2 = Ter, ..., 6 = Sab
  let diasVoltar = 1;
  if (diaSemana === 1) diasVoltar = 3; // Segunda -> Sexta anterior
  else if (diaSemana === 0) diasVoltar = 2; // Domingo -> Sexta anterior
  else if (diaSemana === 6) diasVoltar = 1; // Sábado -> Sexta anterior
  d.setDate(d.getDate() - diasVoltar);
  return d;
}

/** Compara se duas datas correspondem ao mesmo dia de calendário (no fuso local). */
export function isMesmoDia(
  data1?: string | Date | null,
  data2?: string | Date | null,
): boolean {
  if (!data1 || !data2) return false;
  const d1 = typeof data1 === "string" ? new Date(data1) : data1;
  const d2 = typeof data2 === "string" ? new Date(data2) : data2;
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}

/** Verifica se a data fornecida corresponde ao dia de hoje (no fuso local). */
export function isHoje(dataIsoOuBr?: string | null): boolean {
  return isMesmoDia(dataIsoOuBr, new Date());
}
