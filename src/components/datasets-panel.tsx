"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Database, FileSpreadsheet, Trash2, CircleAlert } from "lucide-react";
import clsx from "clsx";
import { fmtDate, fmtDateTime, fmtInt } from "@/lib/format";
import { KIND_LABEL } from "@/lib/domain";

interface DatasetItem {
  id: number;
  kind: string;
  natureza: string;
  file_name: string;
  sheet_name: string | null;
  reference_date: string | null;
  imported_at: string;
  status: string;
  mode: string;
  row_count: number;
  valid_count: number;
  skipped_count: number;
  dup_count: number;
  warning_count: number;
  registros: number;
}

function notifyBaseUpdated() {
  window.dispatchEvent(new Event("giro:base-updated"));
}

export function DatasetsPanel({ onChanged }: { onChanged?: () => void }) {
  const [items, setItems] = useState<DatasetItem[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/datasets", { cache: "no-store" });
      const data = await res.json();
      setItems(data.datasets ?? []);
      setErro(null);
    } catch {
      setErro("Não foi possível carregar a lista de bases.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (confirmId !== null) {
      dialogRef.current?.showModal();
      cancelRef.current?.focus();
    }
  }, [confirmId]);

  async function excluir() {
    if (confirmId === null) return;
    setExcluindo(true);
    try {
      const res = await fetch(`/api/datasets?id=${confirmId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.erro ?? "Falha ao excluir.");
      }
      dialogRef.current?.close();
      setConfirmId(null);
      await load();
      notifyBaseUpdated();
      onChanged?.();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao excluir a base.");
      dialogRef.current?.close();
      setConfirmId(null);
    } finally {
      setExcluindo(false);
    }
  }

  if (erro) {
    return (
      <div className="card flex items-center gap-3 border-danger-600/30 bg-danger-100/40 p-4 text-[13.5px] text-danger-700" role="alert">
        <CircleAlert size={18} aria-hidden="true" />
        {erro}
      </div>
    );
  }

  if (items === null) {
    return (
      <div className="card space-y-3 p-4" aria-busy="true" aria-label="Carregando bases">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-12 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 px-6 py-8 text-center">
        <Database size={22} className="text-navy-400" aria-hidden="true" />
        <p className="text-[14px] font-semibold text-navy-950">Nenhuma base importada até agora</p>
        <p className="max-w-md text-[13px] text-ink-soft">
          As importações ficam registradas aqui com arquivo de origem, data e número de linhas — a trilha de auditoria do painel.
        </p>
      </div>
    );
  }

  const alvo = items.find((i) => i.id === confirmId);

  return (
    <>
      <ul className="space-y-3" aria-label="Bases de dados importadas">
        {items.map((d) => (
          <li key={d.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  aria-hidden="true"
                  className={clsx(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                    d.status === "active" ? "bg-navy-100 text-navy-600" : "bg-neutral-100 text-neutral-500",
                  )}
                >
                  <FileSpreadsheet size={19} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-navy-950" title={d.file_name}>
                    {d.file_name}
                    {d.sheet_name && <span className="font-normal text-ink-soft"> · aba “{d.sheet_name}”</span>}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-ink-soft">
                    {KIND_LABEL[d.kind as keyof typeof KIND_LABEL] ?? d.kind}
                    {" · "}
                    {d.natureza === "snapshot" ? "Snapshot semanal" : "Base operacional"}
                    {" · "}
                    importada em {fmtDateTime(d.imported_at)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11.5px]">
                    <span
                      className={clsx(
                        "rounded-full px-2 py-0.5 font-semibold",
                        d.status === "active" ? "bg-ok-100 text-ok-700" : "bg-neutral-100 text-neutral-500",
                      )}
                    >
                      {d.status === "active" ? "Ativa" : "Substituída"}
                    </span>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
                      ref.: {d.reference_date ? fmtDate(d.reference_date) : "—"}
                    </span>
                    <span className="tnum rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
                      {fmtInt(d.valid_count)} válidas
                    </span>
                    {d.skipped_count > 0 && (
                      <span className="tnum rounded-full bg-warn-100 px-2 py-0.5 font-medium text-warn-700">
                        {fmtInt(d.skipped_count)} ignoradas ({fmtInt(d.dup_count)} duplic.)
                      </span>
                    )}
                    {d.warning_count > 0 && (
                      <span className="tnum rounded-full bg-navy-100 px-2 py-0.5 font-medium text-navy-700">
                        {fmtInt(d.warning_count)} avisos
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmId(d.id)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[12.5px] font-semibold text-danger-700 transition-colors hover:border-danger-600/40 hover:bg-danger-100/40"
                aria-label={`Excluir a base ${d.file_name}`}
              >
                <Trash2 size={14} aria-hidden="true" />
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={() => setConfirmId(null)}
        className="w-[min(440px,92vw)] rounded-2xl border border-line bg-surface p-0 shadow-[var(--shadow-pop)]"
        aria-labelledby="dlg-excluir-titulo"
      >
        <div className="p-6">
          <h2 id="dlg-excluir-titulo" className="font-display text-[17px] font-bold text-navy-950">
            Excluir base de dados?
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
            A base <strong className="text-ink">{alvo?.file_name}</strong> e seus{" "}
            <strong className="tnum text-ink">{fmtInt(alvo?.registros ?? 0)}</strong> registros serão removidos
            definitivamente do banco. Os indicadores do painel serão recalculados. Esta ação não pode ser desfeita.
          </p>
          <div className="mt-5 flex justify-end gap-2.5">
            <button
              ref={cancelRef}
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="min-h-10 rounded-xl border border-line px-4 text-[13.5px] font-semibold text-ink transition-colors hover:bg-neutral-100/60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={excluir}
              disabled={excluindo}
              className="min-h-10 rounded-xl bg-danger-600 px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-danger-700 disabled:opacity-60"
            >
              {excluindo ? "Excluindo…" : "Excluir definitivamente"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

export { notifyBaseUpdated };
