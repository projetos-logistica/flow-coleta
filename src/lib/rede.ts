/** Utilitários de resiliência de rede para chamadas ao banco. */

export type PostgrestLikeError = { message?: string; details?: string; hint?: string; code?: string };

const CAMPO_LABEL: Record<string, string> = {
  numero_pedido: "Número do Pedido",
  data_pedido: "Data do Pedido",
  nome_loja: "Nome da Loja",
  transportadora: "Transportadora",
  origem: "Origem",
  marca: "MARCA",
  uf_destino: "UF Destino",
  escala_coleta: "Escala Coleta",
  status_coleta: "Status Coleta",
  status_contato: "Status Contato",
  situacao: "Situação",
  importado_at: "Data Importação",
};

/** Converte erros de rede/PostgREST em mensagens legíveis para o usuário. */
export function mensagemAmigavel(e: unknown, contexto?: string): string {
  const prefixo = contexto ? `${contexto}: ` : "";
  if (e instanceof TypeError && /fetch/i.test(e.message)) {
    return `${prefixo}falha de conexão com o servidor. Verifique sua internet e tente novamente — o envio é feito em lotes, então você pode reimportar sem duplicar pedidos.`;
  }
  const err = e as PostgrestLikeError | undefined;
  const raw = [err?.message, err?.details, err?.hint].filter(Boolean).join(" · ");
  if (!raw) return `${prefixo}${e instanceof Error ? e.message : "erro inesperado."}`;

  for (const [coluna, label] of Object.entries(CAMPO_LABEL)) {
    if (raw.includes(`"${coluna}"`) || raw.includes(`column ${coluna}`)) {
      return `${prefixo}erro na coluna ${label} — ${raw}`;
    }
  }
  if (err?.code === "42501" || /permission denied/i.test(raw)) {
    return `${prefixo}o banco recusou a operação por falta de permissão (${raw}).`;
  }
  return `${prefixo}${raw}`;
}

export const aguardar = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function erroTransitorio(e: unknown): boolean {
  const err = e as (PostgrestLikeError & { status?: number }) | undefined;
  const texto = [err?.message, err?.details, err?.hint, String(e)].filter(Boolean).join(" ");
  return (
    (e instanceof TypeError && /fetch/i.test(e.message)) ||
    err?.status === 408 ||
    err?.status === 429 ||
    /network|timeout|timed out|fetch failed|failed to fetch|connection|rate.?limit|\b408\b|\b429\b|\b502\b|\b503\b|\b504\b/i.test(
      texto,
    )
  );
}

/** Executa a operação com novas tentativas e espera progressiva em falhas de rede. */
export async function comRetentativas<T>(
  fn: () => Promise<T>,
  {
    tentativas = 4,
    esperaBase = 600,
    esperaProgressiva = true,
  }: { tentativas?: number; esperaBase?: number; esperaProgressiva?: boolean } = {},
): Promise<T> {
  let ultimo: unknown;
  for (let i = 0; i < tentativas; i++) {
    try {
      return await fn();
    } catch (e) {
      ultimo = e;
      if (!erroTransitorio(e) || i === tentativas - 1) throw e;
      await aguardar(esperaProgressiva ? esperaBase * 2 ** i : esperaBase);
    }
  }
  throw ultimo;
}
