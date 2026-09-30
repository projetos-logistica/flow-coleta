import { useState } from "react";
import { Calendar, FilterX, Tag, Truck, MapPin, Hourglass, Store, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ESCALA_GRUPOS: { titulo: string; opcoes: string[] }[] = [
  {
    titulo: "Críticos (5+ dias)",
    opcoes: ["5 a 6 dias", "7 a 8 dias", "9 a 10 dias", "11 dias ou mais"],
  },
  { titulo: "Em atraso (1 a 4 dias)", opcoes: ["1 a 2 dias", "3 a 4 dias"] },
  { titulo: "No prazo", opcoes: ["Vence hoje", "-1 dia", "-2 dias ou mais"] },
];

const BTN_BASE =
  "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition";
const BTN_ON = "border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold";
const BTN_OFF = "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

type GlobalFilterBarProps = {
  dataInicio: string;
  dataFim: string;
  onDataInicioChange: (v: string) => void;
  onDataFimChange: (v: string) => void;

  origensDisponiveis: string[];
  origensSelecionadas: string[];
  onOrigemToggle: (o: string) => void;

  marcasDisponiveis: string[];
  marcasSelecionadas: string[];
  onMarcaToggle: (m: string) => void;

  transportadorasDisponiveis: string[];
  transportadorasSelecionadas: string[];
  onTransportadoraToggle: (t: string) => void;

  lojasDisponiveis: string[];
  lojasSelecionadas: string[];
  onLojaToggle: (l: string) => void;

  escalasSelecionadas: string[];
  onEscalaToggle: (e: string) => void;

  temFiltrosAtivos: boolean;
  onLimparFiltros: () => void;
};

export function GlobalFilterBar({
  dataInicio,
  dataFim,
  onDataInicioChange,
  onDataFimChange,
  origensDisponiveis,
  origensSelecionadas,
  onOrigemToggle,
  marcasDisponiveis,
  marcasSelecionadas,
  onMarcaToggle,
  transportadorasDisponiveis,
  transportadorasSelecionadas,
  onTransportadoraToggle,
  lojasDisponiveis,
  lojasSelecionadas,
  onLojaToggle,
  escalasSelecionadas,
  onEscalaToggle,
  temFiltrosAtivos,
  onLimparFiltros,
}: GlobalFilterBarProps) {
  const [buscaLoja, setBuscaLoja] = useState("");
  const lojasFiltradas = lojasDisponiveis.filter((l) =>
    l.toLowerCase().includes(buscaLoja.trim().toLowerCase()),
  );

  return (
    <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* 1. Período */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-700">
          <Calendar className="size-3.5 text-slate-400" />
          <span className="font-semibold text-slate-500">Período:</span>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => onDataInicioChange(e.target.value)}
            className="bg-transparent text-xs text-slate-800 focus:outline-none"
          />
          <span className="text-slate-300">até</span>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => onDataFimChange(e.target.value)}
            className="bg-transparent text-xs text-slate-800 focus:outline-none"
          />
        </div>

        {/* 2. Origem */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`${BTN_BASE} ${origensSelecionadas.length > 0 ? BTN_ON : BTN_OFF}`}
            >
              <MapPin className="size-3.5 text-slate-400" />
              <span>
                Origem{" "}
                {origensSelecionadas.length > 0 && `(${origensSelecionadas.length})`}
              </span>
              <span className="text-slate-400">▾</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 rounded-xl bg-white p-1 shadow-lg border border-slate-200">
            {origensDisponiveis.map((origem) => (
              <DropdownMenuCheckboxItem
                key={origem}
                checked={origensSelecionadas.includes(origem)}
                onCheckedChange={() => onOrigemToggle(origem)}
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer rounded-lg text-xs"
              >
                {origem}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 3. Marca */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`${BTN_BASE} ${marcasSelecionadas.length > 0 ? BTN_ON : BTN_OFF}`}
            >
              <Tag className="size-3.5 text-slate-400" />
              <span>
                Marca{" "}
                {marcasSelecionadas.length > 0 && `(${marcasSelecionadas.length})`}
              </span>
              <span className="text-slate-400">▾</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto rounded-xl bg-white p-1 shadow-lg border border-slate-200">
            {marcasDisponiveis.map((marca) => (
              <DropdownMenuCheckboxItem
                key={marca}
                checked={marcasSelecionadas.includes(marca)}
                onCheckedChange={() => onMarcaToggle(marca)}
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer rounded-lg text-xs"
              >
                {marca}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 4. Transportadora */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`${BTN_BASE} ${transportadorasSelecionadas.length > 0 ? BTN_ON : BTN_OFF}`}
            >
              <Truck className="size-3.5 text-slate-400" />
              <span>
                Transportadora{" "}
                {transportadorasSelecionadas.length > 0 &&
                  `(${transportadorasSelecionadas.length})`}
              </span>
              <span className="text-slate-400">▾</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto rounded-xl bg-white p-1 shadow-lg border border-slate-200">
            {transportadorasDisponiveis.map((transp) => (
              <DropdownMenuCheckboxItem
                key={transp}
                checked={transportadorasSelecionadas.includes(transp)}
                onCheckedChange={() => onTransportadoraToggle(transp)}
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer rounded-lg text-xs"
              >
                {transp}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 5. Loja */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`${BTN_BASE} ${lojasSelecionadas.length > 0 ? BTN_ON : BTN_OFF}`}
            >
              <Store className="size-3.5 text-slate-400" />
              <span>
                Loja {lojasSelecionadas.length > 0 && `(${lojasSelecionadas.length})`}
              </span>
              <span className="text-slate-400">▾</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-64 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
          >
            <div className="sticky top-0 bg-white p-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 size-3.5 text-slate-400" />
                <input
                  value={buscaLoja}
                  onChange={(e) => setBuscaLoja(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Buscar loja..."
                  className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-2 text-xs text-slate-800 focus:border-indigo-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {lojasFiltradas.length === 0 ? (
                <p className="px-2 py-3 text-center text-xs text-slate-400">
                  Nenhuma loja encontrada.
                </p>
              ) : (
                lojasFiltradas.map((loja) => (
                  <DropdownMenuCheckboxItem
                    key={loja}
                    checked={lojasSelecionadas.includes(loja)}
                    onCheckedChange={() => onLojaToggle(loja)}
                    onSelect={(e) => e.preventDefault()}
                    className="cursor-pointer rounded-lg text-xs"
                  >
                    {loja || "(sem loja)"}
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 6. Escala Coleta (SLA) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`${BTN_BASE} ${escalasSelecionadas.length > 0 ? BTN_ON : BTN_OFF}`}
            >
              <Hourglass className="size-3.5 text-slate-400" />
              <span>
                Escala Coleta{" "}
                {escalasSelecionadas.length > 0 && `(${escalasSelecionadas.length})`}
              </span>
              <span className="text-slate-400">▾</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-60 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
          >
            {ESCALA_GRUPOS.map((grupo, gi) => (
              <div key={grupo.titulo}>
                {gi > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {grupo.titulo}
                </DropdownMenuLabel>
                {grupo.opcoes.map((op) => (
                  <DropdownMenuCheckboxItem
                    key={op}
                    checked={escalasSelecionadas.includes(op)}
                    onCheckedChange={() => onEscalaToggle(op)}
                    onSelect={(e) => e.preventDefault()}
                    className="cursor-pointer rounded-lg text-xs"
                  >
                    {op}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 7. Limpar Filtros */}
        {temFiltrosAtivos && (
          <button
            type="button"
            onClick={onLimparFiltros}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-rose-100 hover:text-rose-700"
          >
            <FilterX className="size-3.5" />
            Limpar Filtros
          </button>
        )}
      </div>
    </div>
  );
}
