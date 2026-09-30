import { cn } from "@/lib/utils";
import { legendaSituacao } from "@/lib/coletas";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type KpiCardItem = {
  id: "pendentes" | "atrasados" | "noprazo" | "coletados_hoje";
  label: string;
  value: number;
  active: boolean;
  tooltip: string;
  theme: "neutro" | "atrasado" | "noprazo" | "coletados";
};

type SituacaoItem = {
  label: string;
  value: number;
  active: boolean;
};

type KpiBlockProps = {
  kpiCards: KpiCardItem[];
  onKpiCardToggle: (id: "pendentes" | "atrasados" | "noprazo" | "coletados_hoje") => void;
  situacaoItems: SituacaoItem[];
  onSituacaoToggle: (label: string) => void;
};

export function KpiBlock({
  kpiCards,
  onKpiCardToggle,
  situacaoItems,
  onSituacaoToggle,
}: KpiBlockProps) {
  return (
    <div className="mb-6 space-y-4">
      {/* Bloco 1: 4 Cards de Destaque Interativos com Tooltips */}
      <TooltipProvider delayDuration={400}>
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Indicadores de Coleta
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((card) => (
              <Tooltip key={card.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onKpiCardToggle(card.id)}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer",
                      card.active
                        ? card.theme === "atrasado"
                          ? "border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/20 shadow-xs"
                          : card.theme === "noprazo"
                            ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs"
                            : card.theme === "coletados"
                              ? "border-purple-500 bg-purple-50/40 ring-2 ring-purple-500/20 shadow-xs"
                              : "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20 shadow-xs"
                        : "border-slate-200/80 bg-white hover:border-slate-300"
                    )}
                  >
                    {/* Barra de cor no topo do card */}
                    <div
                      className={cn(
                        "absolute top-0 left-0 h-1.5 w-full transition-all",
                        card.theme === "neutro" && "bg-indigo-500",
                        card.theme === "atrasado" && "bg-rose-500",
                        card.theme === "noprazo" && "bg-emerald-500",
                        card.theme === "coletados" && "bg-purple-600"
                      )}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {card.label}
                      </p>
                      {card.active && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider",
                            card.theme === "atrasado"
                              ? "bg-rose-100 text-rose-700"
                              : card.theme === "noprazo"
                                ? "bg-emerald-100 text-emerald-700"
                                : card.theme === "coletados"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-indigo-100 text-indigo-700"
                          )}
                        >
                          Ativo
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "mt-1 text-3xl font-extrabold tracking-tight tabular-nums",
                        card.theme === "atrasado"
                          ? "text-rose-600"
                          : card.theme === "noprazo"
                            ? "text-emerald-600"
                            : card.theme === "coletados"
                              ? "text-purple-700"
                              : "text-slate-900"
                      )}
                    >
                      {card.value.toLocaleString("pt-BR")}
                    </p>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-center text-xs">
                  {card.tooltip}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </TooltipProvider>

      {/* Bloco 2: Situação dos Pedidos (Formato Chips/Pílulas Interativas) */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Situação dos Pedidos (Filtro por Pendentes)
          </p>
        </div>
        <TooltipProvider delayDuration={400}>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs">
            {situacaoItems.map((item) => (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onSituacaoToggle(item.label)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95",
                      item.active
                        ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-600/30"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                    )}
                  >
                    <span>{item.label}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                        item.active
                          ? "bg-white/20 text-white"
                          : "bg-white text-slate-800 shadow-2xs"
                      )}
                    >
                      {item.value.toLocaleString("pt-BR")}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-center text-xs">
                  {legendaSituacao(item.label) ?? item.label}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}
