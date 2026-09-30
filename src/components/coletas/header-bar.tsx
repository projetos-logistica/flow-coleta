import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, FileText, Info, Trash2, Upload, UserCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/** E-mails autorizados a executar ações destrutivas no painel. */
const ADMIN_EMAILS = [
  "fellipe.bacelar@usereserva.com",
  "transporteb2c@somagrupo.com.br",
  "renan.ribeiro@somagrupo.com.br",
];

type HeaderBarProps = {
  totalBase: number;
  usuario: string;
  onSalvarUsuario: (nome: string) => void;
  onImportarClick: () => void;
  onExportarBase: () => void;
  onExportarHistorico: () => void;
  onLimparBase: () => void;
  importando?: boolean;
};

export function HeaderBar({
  totalBase,
  usuario,
  onSalvarUsuario,
  onImportarClick,
  onExportarBase,
  onExportarHistorico,
  onLimparBase,
  importando = false,
}: HeaderBarProps) {
  const [nomeTemp, setNomeTemp] = useState(usuario);
  const [editando, setEditando] = useState(!usuario);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let ativo = true;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        const email = data.user?.email?.toLowerCase() ?? "";
        if (ativo) setIsAdmin(ADMIN_EMAILS.includes(email));
      })
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, []);

  function handleSalvar() {
    onSalvarUsuario(nomeTemp);
    setEditando(false);
  }

  return (
    <header className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Esquerda: Título, Status da Base e Identificação */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <img
              src="/logo-azzas-dark.png"
              alt="AZZAS 2154"
              className="h-7 w-auto shrink-0 dark:hidden"
            />
            <img
              src="/logo-azzas-white.png"
              alt="AZZAS 2154"
              className="hidden h-7 w-auto shrink-0 dark:block"
            />
            <span className="h-6 w-px bg-slate-200" aria-hidden="true" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Painel de Coletas <span className="font-normal text-slate-400">—</span> SFS Convencional
            </h1>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 ring-inset">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
              </span>
              {totalBase} pedido(s) na base compartilhada
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Operando como:</span>
            {editando ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={nomeTemp}
                  onChange={(e) => setNomeTemp(e.target.value)}
                  placeholder="Seu nome ou apelido"
                  className="h-7 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-800 focus:border-slate-400 focus:bg-white focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleSalvar()}
                />
                <button
                  type="button"
                  onClick={handleSalvar}
                  className="inline-flex h-7 items-center gap-1 rounded-md bg-slate-900 px-2.5 text-xs font-medium text-white transition hover:bg-slate-800"
                >
                  <UserCheck className="size-3.5" />
                  Salvar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">{usuario}</span>
                <button
                  type="button"
                  onClick={() => setEditando(true)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  (alterar)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Direita: Ações Consolidadas */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botão Primário: Importar Planilha */}
          <button
            type="button"
            disabled={importando}
            onClick={onImportarClick}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            <Upload className="size-4" />
            {importando ? "Processando..." : "Importar planilha"}
          </button>

          {/* Dropdown Unificado: Exportar ▾ */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
              >
                <Download className="size-3.5 text-slate-500" />
                Exportar
                <span className="text-slate-400">▾</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-2xl bg-white p-2.5 shadow-xl border border-slate-200">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                <Download className="size-3.5 text-indigo-600" />
                Opções de Download
              </div>
              <DropdownMenuItem
                onClick={onExportarBase}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <FileSpreadsheet className="size-4 text-emerald-600" />
                <span>Base Filtrada (.xlsx)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onExportarHistorico}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <FileText className="size-4 text-blue-600" />
                <span>Histórico de Alterações (.csv)</span>
              </DropdownMenuItem>

              <div className="mt-2.5 border-t border-slate-100 pt-2.5 px-1.5 pb-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  <Info className="size-3 text-indigo-500" />
                  Dicionário de Auditoria da Base
                </div>
                <p className="text-[10.5px] text-slate-500 mb-2 leading-relaxed">
                  O arquivo gerado contém a estrutura completa de colunas da base, incluindo campos de auditoria:
                </p>
                <div className="space-y-1.5 text-[10px] bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-800">Data Importação:</span>{" "}
                    <span className="text-slate-600">Data e hora da última carga recebida do pedido.</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Primeira Importação:</span>{" "}
                    <span className="text-slate-600">Data e hora em que o pedido entrou na plataforma pela 1ª vez.</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Data Alteração Situação:</span>{" "}
                    <span className="text-slate-600">Data e hora da última mudança de situação.</span>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Botão Discreto Ghost: Limpar Base — somente administradores */}
          {isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-transparent px-3 text-xs font-medium text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                title="Limpar todos os registros da base"
              >
                <Trash2 className="size-3.5" />
                Limpar base
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl border border-slate-200 bg-white p-6">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base font-bold text-slate-900">
                  Deseja realmente limpar a base de dados?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-slate-500">
                  Esta ação removerá todos os pedidos cadastrados no sistema. Essa ação não poderá ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="h-9 rounded-xl border border-slate-200 text-xs">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onLimparBase}
                  className="h-9 rounded-xl bg-rose-600 text-xs text-white hover:bg-rose-700"
                >
                  Sim, limpar tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          )}
        </div>
      </div>
    </header>
  );
}
