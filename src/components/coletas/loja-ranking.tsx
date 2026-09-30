import { cn } from "@/lib/utils";
import { PanelLeftClose, Store } from "lucide-react";

export type LojaRankingItem = {
  nome: string;
  total: number;
  criticos: number;
  atrasados: number;
  em_dia: number;
  prevencao: number;
  prioridade_percent: number;
  volume_percent?: number;
  prioridade_acumulado?: number;
  volume_acumulado?: number;
};

export type RankingAba = "prioridade" | "prevencao" | "volume";

export function LojaRanking({
  lojas,
  active,
  onSelect,
  onSelectBadge,
  aba,
  onAbaChange,
  onRecolher,
}: {
  lojas: LojaRankingItem[];
  active: string[];
  onSelect: (nome: string) => void;
  onSelectBadge: (nome: string, tipo: "critico" | "atraso" | "em_dia" | "total") => void;
  aba: RankingAba;
  onAbaChange: (a: RankingAba) => void;
  onRecolher?: () => void;
}) {
  return (
    <aside className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Store className="size-4 shrink-0 text-indigo-600" />
          <h2 className="truncate text-xs font-bold uppercase tracking-wider text-slate-700">
            Ranking de Lojas
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {active.length > 0 && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
              {active.length} sel.
            </span>
          )}
          {onRecolher && (
            <button
              type="button"
              onClick={onRecolher}
              aria-label="Recolher ranking de lojas"
              title="Recolher painel"
              className="inline-flex size-6 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <PanelLeftClose className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Abas de ordenação reordenadas */}
      <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
        {(
          [
            { id: "prioridade", label: "🚨 Prioridade" },
            { id: "prevencao", label: "🟢 Prevenção" },
            { id: "volume", label: "📦 Volume" },
          ] as { id: RankingAba; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onAbaChange(t.id)}
            className={cn(
              "rounded-lg px-2 py-1.5 text-[10px] sm:text-[11px] font-semibold transition truncate",
              aba === t.id
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {lojas.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-400">
          Nenhum pedido aguardando.
        </p>
      ) : (
        <div className="max-h-[560px] space-y-1 overflow-y-auto pr-1">
          {lojas.map((loja, i) => {
            const isActive = active.includes(loja.nome);
            return (
              <div
                key={loja.nome}
                className={cn(
                  "group relative flex w-full flex-col overflow-hidden rounded-xl px-2.5 py-2 text-left transition-all duration-150",
                  isActive
                    ? "bg-indigo-50/80 ring-1 ring-indigo-500/30"
                    : "hover:bg-slate-50",
                )}
              >
                {/* Data Bar de Prioridade */}
                {aba === "prioridade" && loja.prioridade_percent > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 -z-10 bg-red-50/60 transition-all duration-500"
                    style={{ width: `${loja.prioridade_percent}%` }}
                  />
                )}

                <div
                  className={cn(
                    "flex w-full justify-between gap-2",
                    aba === "volume" ? "flex-col items-start" : "items-center"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(loja.nome)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={cn(
                        "truncate text-xs font-semibold",
                        isActive ? "text-indigo-900" : "text-slate-700",
                      )}
                    >
                      {loja.nome || "(sem loja)"}
                    </span>
                    
                    {/* Exibição da porcentagem de acordo com a aba */}
                    {aba === "prioridade" && loja.prioridade_percent > 0 && (
                      <span
                        className="shrink-0 text-[10px] font-medium text-slate-400 cursor-help tabular-nums"
                        title="Representatividade de (críticos+atrasos) da loja, dividido pelo Total de (críticos+atrasos) de todas as lojas."
                      >
                        {loja.prioridade_percent.toFixed(1)}%
                        {loja.prioridade_acumulado !== undefined && (
                          <span className="text-slate-300"> | Σ {loja.prioridade_acumulado.toFixed(1)}%</span>
                        )}
                      </span>
                    )}
                    {aba === "volume" && loja.volume_percent !== undefined && (
                      <span
                        className="shrink-0 text-[10px] font-medium text-slate-400 cursor-help tabular-nums"
                        title="Representatividade da loja sobre o volume total de pedidos pendentes da base."
                      >
                        {loja.volume_percent.toFixed(1)}%
                        {loja.volume_acumulado !== undefined && (
                          <span className="text-slate-300"> | Σ {loja.volume_acumulado.toFixed(1)}%</span>
                        )}
                      </span>
                    )}
                  </button>

                  <div className="flex shrink-0 items-center gap-1">
                    {/* Condicional para Críticos */}
                    {loja.criticos > 0 && aba !== "prevencao" && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onSelectBadge(loja.nome, "critico"); }}
                        className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-rose-700 hover:bg-rose-200 transition"
                        title="Filtrar Críticos (5+ dias)"
                      >
                        🔴 {loja.criticos}
                      </button>
                    )}
                    
                    {/* Condicional para Atrasos */}
                    {loja.atrasados > 0 && aba !== "prevencao" && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onSelectBadge(loja.nome, "atraso"); }}
                        className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-amber-700 hover:bg-amber-200 transition"
                        title="Filtrar em Atraso (1 a 4 dias)"
                      >
                        🟠 {loja.atrasados}
                      </button>
                    )}
                    
                    {/* Condicional para Em Dia */}
                    {loja.em_dia > 0 && aba !== "prioridade" && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onSelectBadge(loja.nome, "em_dia"); }}
                        className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-emerald-700 hover:bg-emerald-200 transition"
                        title="Filtrar No Prazo"
                      >
                        🟢 {loja.em_dia}
                      </button>
                    )}
                    
                    {/* Condicional para Volume Total */}
                    {aba !== "prioridade" && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onSelectBadge(loja.nome, "total"); }}
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums transition",
                          isActive
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                        )}
                        title="Selecionar todos os pedidos da loja"
                      >
                        📦 {loja.total}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
