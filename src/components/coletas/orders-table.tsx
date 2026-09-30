import { cn } from "@/lib/utils";
import {
  CONTATO_OPTIONS,
  SITUACAO_OPTIONS,
  formatDateTime,
  legendaSituacao,
  ouTraco,
  statusClasses,
  timeAgo,
  type EditableField,
  type Pedido,
} from "@/lib/coletas";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusSelect } from "./status-select";
import { Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRef, useState } from "react";

const HEADERS = [
  "Data do Pedido",
  "Número do Pedido",
  "Nome da Loja",
  "Transportadora",
  "Origem",
  "Marca",
  "UF Destino",
  "Escala Coleta",
  "Status Coleta",
  "Situação",
  "Status Contato",
  "Data Importação",
  "Data Coleta",
];

const HEADER_TOOLTIPS: Record<string, string> = {
  "Data Importação":
    "Data e hora da última planilha em que este pedido esteve presente.",
  "Data Coleta":
    "Data e hora em que a coleta foi confirmada.",
};


export function OrdersTable({
  pedidos,
  selected,
  onToggle,
  onToggleAll,
  onChangeField,
  buscaTags,
  onBuscaTagsChange,
  buscaTexto,
  onBuscaTextoChange,
  filtroContato,
  onFiltroContatoChange,
  pagina,
  totalPaginas,
  porPagina,
  onPaginaChange,
  onPorPaginaChange,
  totalRegistros,
}: {
  pedidos: Pedido[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onChangeField: (pedido: Pedido, field: EditableField, value: string) => void;
  buscaTags: string[];
  onBuscaTagsChange: (tags: string[] | ((prev: string[]) => string[])) => void;
  buscaTexto: string;
  onBuscaTextoChange: (v: string) => void;
  filtroContato: string;
  onFiltroContatoChange: (v: string) => void;
  pagina: number;
  totalPaginas: number;
  porPagina: number;
  onPaginaChange: (p: number) => void;
  onPorPaginaChange: (n: number) => void;
  totalRegistros: number;
}) {
  const allChecked =
    pedidos.length > 0 && pedidos.every((p) => selected.has(p.numero_pedido));

  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isCompact = !isFocused && buscaTags.length > 3;
  const tagsVisiveis = isCompact ? buscaTags.slice(0, 3) : buscaTags;
  const totalOcultos = buscaTags.length - 3;

  function adicionarTags(novas: string[]) {
    const limpos = novas
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (limpos.length === 0) return;
    onBuscaTagsChange((prev) => {
      const set = new Set(prev);
      limpos.forEach((item) => set.add(item));
      return Array.from(set);
    });
  }

  function removerTag(tagRemover: string) {
    onBuscaTagsChange((prev) => prev.filter((t) => t !== tagRemover));
  }

  function limparTudo() {
    onBuscaTagsChange([]);
    onBuscaTextoChange("");
    setIsFocused(true);
    inputRef.current?.focus();
  }

  function processarTexto(texto: string) {
    const partes = texto.split(/[,\n\r;\s\t]+/).filter(Boolean);
    if (partes.length > 0) {
      adicionarTags(partes);
      onBuscaTextoChange("");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      {/* Barra Superior da Tabela */}
      <div className="flex flex-col gap-3 border-b border-slate-200/80 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
        {/* Container de Busca com Tags/Chips estilo Tag Input (Modo Compacto e Modo Edição) */}
        <div
          ref={containerRef}
          onClick={() => {
            setIsFocused(true);
            inputRef.current?.focus();
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            if (!containerRef.current?.contains(e.relatedTarget as Node)) {
              setIsFocused(false);
            }
          }}
          className={cn(
            "relative flex flex-1 items-start gap-2 min-w-0 rounded-xl border bg-white px-3 py-1.5 shadow-2xs transition-all cursor-text",
            isFocused
              ? "border-indigo-500 ring-2 ring-indigo-500/20"
              : "border-slate-200 hover:border-slate-300"
          )}
        >
          <Search className="size-4 shrink-0 text-slate-400 mt-1" />

          {/* Área de Chips e Input com limite de altura e scroll */}
          <div
            className={cn(
              "flex flex-1 flex-wrap items-center gap-1.5 min-w-0 transition-all duration-200",
              isFocused
                ? "max-h-28 overflow-y-auto scroll-smooth py-0.5"
                : "max-h-9 overflow-hidden"
            )}
          >
            {/* Chips/Tags Ativas */}
            {tagsVisiveis.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200/90 px-2.5 py-0.5 text-xs font-medium text-slate-700 max-w-[220px] truncate group animate-in fade-in zoom-in-95 duration-100 shrink-0"
              >
                <span className="truncate">{tag}</span>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    // Evita perder o foco do campo ao remover tags
                    e.preventDefault();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removerTag(tag);
                  }}
                  className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Remover termo"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}

            {/* Badge condensado no modo compacto (+X pedidos) */}
            {isCompact && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFocused(true);
                  inputRef.current?.focus();
                }}
                className="inline-flex items-center rounded-lg bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer shrink-0 animate-in fade-in zoom-in-95 duration-100"
                title={`Mais ${totalOcultos} pedido(s) pesquisado(s). Clique para ver todos.`}
              >
                +{totalOcultos} {totalOcultos === 1 ? "pedido" : "pedidos"}
              </button>
            )}

            {/* Input Fluido */}
            <input
              ref={inputRef}
              type="text"
              value={buscaTexto}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => {
                const val = e.target.value;
                // Se digitar/colar delimitadores (vírgula, ponto-e-vírgula, quebra de linha)
                if (/[,\n\r;\t]/.test(val)) {
                  processarTexto(val);
                } else {
                  onBuscaTextoChange(val);
                }
              }}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text");
                if (pasted && /[,\n\r;\s\t]/.test(pasted.trim())) {
                  e.preventDefault();
                  processarTexto(pasted);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "," || e.key === ";") {
                  e.preventDefault();
                  if (buscaTexto.trim()) {
                    processarTexto(buscaTexto);
                  }
                } else if (e.key === " " && buscaTexto.trim().length > 0) {
                  // Se pressionar espaço com algum texto digitado, converte em tag
                  e.preventDefault();
                  processarTexto(buscaTexto);
                } else if (e.key === "Backspace" && buscaTexto === "") {
                  if (buscaTags.length > 0) {
                    onBuscaTagsChange((prev) => prev.slice(0, -1));
                  }
                } else if (e.key === "Escape") {
                  inputRef.current?.blur();
                  setIsFocused(false);
                }
              }}
              placeholder={
                buscaTags.length === 0
                  ? "Colar lista do Excel ou buscar por pedido, loja, transportadora..."
                  : isFocused
                    ? "Adicionar outro pedido ou termo..."
                    : ""
              }
              className="flex-1 min-w-[120px] bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none py-0.5"
            />
          </div>

          {/* Botão Limpar Tudo (aparece se houver tags ou texto) */}
          {(buscaTags.length > 0 || buscaTexto.length > 0) && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={(e) => {
                e.stopPropagation();
                limparTudo();
              }}
              className="shrink-0 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition mt-0.5 cursor-pointer"
              title="Limpar todos os termos de busca"
            >
              <span className="hidden sm:inline">Limpar</span>
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="filtro-contato-select" className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Status Contato:
          </label>
          <select
            id="filtro-contato-select"
            value={filtroContato}
            onChange={(e) => onFiltroContatoChange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Todos</option>
            {CONTATO_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="max-h-[70vh] overflow-x-auto overflow-y-auto scroll-smooth">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-slate-200/80 bg-slate-50 text-slate-500">
              <th className="px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(e) => onToggleAll(e.target.checked)}
                  aria-label="Selecionar todos os visíveis"
                  className="size-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              {HEADERS.map((h) => (
                <th
                  key={h}
                  title={HEADER_TOOLTIPS[h]}
                  className="whitespace-nowrap px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pedidos.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length + 1} className="py-8 text-center text-xs text-slate-400">
                  Nenhum pedido encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              pedidos.map((p) => (
                <tr key={p.numero_pedido} className="transition-colors hover:bg-slate-50/80">
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(p.numero_pedido)}
                      onChange={() => onToggle(p.numero_pedido)}
                      aria-label={`Selecionar pedido ${p.numero_pedido}`}
                      className="size-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">{p.data_pedido}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11.5px] font-semibold text-slate-800">
                    {p.numero_pedido}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-medium text-slate-900">{p.nome_loja}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{p.transportadora}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{ouTraco(p.origem)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-medium text-slate-700">{ouTraco(p.marca)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{ouTraco(p.uf_destino)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{ouTraco(p.escala_coleta)}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2.5 py-1 text-xs font-semibold",
                        statusClasses("status_coleta", p.status_coleta),
                      )}
                      title="Definido automaticamente pelo sistema"
                    >
                      {ouTraco(p.status_coleta)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <TooltipProvider delayDuration={600}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-block">
                            <StatusSelect
                              field="situacao"
                              value={p.situacao}
                              options={SITUACAO_OPTIONS}
                              onChange={(v) => onChangeField(p, "situacao", v)}
                            />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-center">
                          {legendaSituacao(p.situacao) ?? "Situação do pedido"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>

                  <td className="px-3 py-2.5">
                    <StatusSelect
                      field="status_contato"
                      value={p.status_contato}
                      options={CONTATO_OPTIONS}
                      allowEmpty
                      onChange={(v) => onChangeField(p, "status_contato", v)}
                    />
                  </td>
                  <td
                    className="whitespace-nowrap px-3 py-2.5 text-[11px] text-slate-400"
                    title="Data e hora da última planilha em que este pedido esteve presente."
                  >
                    {formatDateTime(p.importado_at)}
                  </td>
                  <td
                    className="whitespace-nowrap px-3 py-2.5 text-[11px] text-slate-500 font-mono"
                    title={p.status_coleta === "Coletado" ? "Data e hora de confirmação da coleta" : undefined}
                  >
                    {p.status_coleta === "Coletado"
                      ? formatDateTime(p.data_coleta || p.coletado_at)
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Rodapé de Paginação */}
      <div className="flex flex-col gap-3 border-t border-slate-200/80 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>Linhas por página:</span>
          <select
            value={porPagina}
            onChange={(e) => onPorPaginaChange(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
          <span className="text-slate-400">({totalRegistros} resultados)</span>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            disabled={pagina <= 1}
            onClick={() => onPaginaChange(pagina - 1)}
            className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-100"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="px-2 font-medium text-slate-700">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            type="button"
            disabled={pagina >= totalPaginas}
            onClick={() => onPaginaChange(pagina + 1)}
            className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-100"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
