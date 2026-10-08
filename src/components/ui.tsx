import type { ReactNode } from "react";
import clsx from "clsx";
import { SITUACAO_LABEL, type SituacaoChave } from "@/lib/domain";

/* ------------------------------------------------------------------ */
/* Cabeçalho de página                                                  */
/* ------------------------------------------------------------------ */

export function PageHeader({
  overline,
  title,
  description,
  actions,
}: {
  overline: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="overline mb-1.5">{overline}</p>
        <h1 className="font-display text-pretty text-[24px] font-bold leading-tight tracking-tight text-navy-950 sm:text-[28px]">
          {title}
        </h1>
        {description && <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Situação — nunca só cor: ponto + rótulo textual                      */
/* ------------------------------------------------------------------ */

const SITUACAO_STYLE: Record<SituacaoChave, { chip: string; dot: string }> = {
  vencido: { chip: "bg-danger-100 text-danger-700", dot: "bg-danger-600" },
  a_vencer: { chip: "bg-warn-100 text-warn-700", dot: "bg-warn-600" },
  em_dia: { chip: "bg-ok-100 text-ok-700", dot: "bg-ok-600" },
  sem_data: { chip: "bg-neutral-100 text-neutral-700", dot: "bg-neutral-500" },
  concluido: { chip: "bg-navy-100 text-navy-700", dot: "bg-navy-500" },
  cancelado: { chip: "bg-neutral-100 text-neutral-500", dot: "bg-neutral-400" },
};

export function StatusBadge({ situacao, detalhe }: { situacao: SituacaoChave; detalhe?: string }) {
  const s = SITUACAO_STYLE[situacao] ?? SITUACAO_STYLE.sem_data;
  return (
    <span
      className={clsx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold", s.chip)}
    >
      <span aria-hidden="true" className={clsx("h-[7px] w-[7px] rounded-full", s.dot)} />
      {SITUACAO_LABEL[situacao]}
      {detalhe && <span className="font-normal opacity-90">· {detalhe}</span>}
    </span>
  );
}

export function situacaoChave(situacao: string | null | undefined): SituacaoChave {
  const keys: SituacaoChave[] = ["vencido", "a_vencer", "em_dia", "sem_data", "concluido", "cancelado"];
  return keys.includes(situacao as SituacaoChave) ? (situacao as SituacaoChave) : "sem_data";
}

/* ------------------------------------------------------------------ */
/* Área                                                                 */
/* ------------------------------------------------------------------ */

export const AREA_STYLE: Record<string, { chip: string; dot: string; bar: string; hex: string }> = {
  Indiretos: { chip: "bg-indiretos-100 text-indiretos-700", dot: "bg-indiretos-500", bar: "bg-indiretos-500", hex: "#2f6ba0" },
  Diretos: { chip: "bg-diretos-100 text-diretos-700", dot: "bg-diretos-500", bar: "bg-diretos-500", hex: "#118578" },
  CAPEX: { chip: "bg-capex-100 text-capex-700", dot: "bg-capex-600", bar: "bg-capex-600", hex: "#b45309" },
  "Não informado": { chip: "bg-neutral-100 text-neutral-700", dot: "bg-neutral-500", bar: "bg-neutral-400", hex: "#98a2b3" },
};

export function AreaTag({ area }: { area: string | null | undefined }) {
  const key = area && AREA_STYLE[area] ? area : "Não informado";
  const s = AREA_STYLE[key];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-[3px] text-[12px] font-semibold", s.chip)}>
      <span aria-hidden="true" className={clsx("h-[7px] w-[7px] rounded-[2px]", s.dot)} />
      {key}
    </span>
  );
}

export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "navy" | "warn" | "ok" | "danger" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold",
        tone === "neutral" && "bg-neutral-100 text-neutral-700",
        tone === "accent" && "bg-accent-100 text-accent-700",
        tone === "navy" && "bg-navy-100 text-navy-700",
        tone === "warn" && "bg-warn-100 text-warn-700",
        tone === "ok" && "bg-ok-100 text-ok-700",
        tone === "danger" && "bg-danger-100 text-danger-700",
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Estado vazio                                                         */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={clsx(
        "card flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-6 py-10" : "gap-3 px-6 py-14 sm:px-12 sm:py-20",
      )}
    >
      <span
        aria-hidden="true"
        className="grid h-14 w-14 place-items-center rounded-2xl bg-navy-100 text-navy-600 [&>svg]:h-7 [&>svg]:w-7"
      >
        {icon}
      </span>
      <h2 className="font-display text-[18px] font-bold text-navy-950">{title}</h2>
      {description && <p className="max-w-md text-[14px] leading-relaxed text-ink-soft">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Título de seção                                                      */
/* ------------------------------------------------------------------ */

export function SectionTitle({ title, hint, aside }: { title: string; hint?: string; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 className="font-display text-[16.5px] font-bold tracking-tight text-navy-950">{title}</h2>
      <div className="flex items-baseline gap-3">
        {hint && <p className="text-[12.5px] text-ink-soft">{hint}</p>}
        {aside}
      </div>
    </div>
  );
}
