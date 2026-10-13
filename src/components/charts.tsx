import type { ReactNode } from "react";
import clsx from "clsx";
import { fmtInt } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* Wrapper acessível: todo gráfico ganha alternativa em tabela          */
/* ------------------------------------------------------------------ */

export function ChartBlock({
  title,
  summary,
  children,
  table,
}: {
  title: string;
  summary: string;
  children: ReactNode;
  table: { headers: string[]; rows: (string | number)[][] };
}) {
  return (
    <div className="card p-5">
      <h3 className="mb-1 text-[14.5px] font-bold text-navy-950">{title}</h3>
      <p className="sr-only">{summary}</p>
      <div role="img" aria-label={summary}>
        {children}
      </div>
      <details className="mt-4">
        <summary className="cursor-pointer rounded-md text-[12.5px] font-semibold text-navy-600 underline decoration-navy-300 underline-offset-2 hover:text-navy-800">
          Ver dados em formato de tabela
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[13px]">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr className="border-b border-line text-left">
                {table.headers.map((h) => (
                  <th key={h} scope="col" className="py-1.5 pr-3 font-semibold text-ink-soft last:text-right">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i} className="border-b border-line/60 last:border-0">
                  {r.map((c, j) => (
                    <td key={j} className={clsx("py-1.5 pr-3 text-ink", j === r.length - 1 && "tnum text-right")}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rosca (distribuição por área)                                        */
/* ------------------------------------------------------------------ */

export interface Segment {
  label: string;
  value: number;
  color: string;
}

export function Donut({ segments, total }: { segments: Segment[]; total: number }) {
  const R = 54;
  const C = 2 * Math.PI * R;
  const visibleSegments = segments.filter((s) => s.value > 0);
  const arcs = visibleSegments.map((s, index) => {
    const frac = total > 0 ? s.value / total : 0;
    const dash = frac * C;
    const offset = visibleSegments.slice(0, index).reduce((sum, item) => {
      return sum + (total > 0 ? item.value / total : 0) * C;
    }, 0);
    return (
      <circle
        key={s.label}
        cx="70"
        cy="70"
        r={R}
        fill="none"
        stroke={s.color}
        strokeWidth="20"
        strokeDasharray={`${dash} ${C - dash}`}
        strokeDashoffset={-offset}
        transform="rotate(-90 70 70)"
      />
    );
  });

  return (
    <div className="mt-3 flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
      <svg viewBox="0 0 140 140" className="h-[150px] w-[150px] shrink-0" aria-hidden="true">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#eef1f4" strokeWidth="20" />
        {arcs}
        <text x="70" y="66" textAnchor="middle" className="fill-navy-950" fontSize="24" fontWeight="700" fontFamily="var(--font-display)">
          {fmtInt(total)}
        </text>
        <text x="70" y="84" textAnchor="middle" className="fill-ink-soft" fontSize="10.5">
          processos
        </text>
      </svg>
      <ul className="w-full space-y-2.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5 text-[13.5px]">
            <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-[4px]" style={{ backgroundColor: s.color }} />
            <span className="flex-1 text-ink">{s.label}</span>
            <span className="tnum font-semibold text-navy-950">{fmtInt(s.value)}</span>
            <span className="tnum w-12 text-right text-ink-soft">
              {total > 0 ? `${((s.value / total) * 100).toFixed(0)}%` : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Barras horizontais                                                   */
/* ------------------------------------------------------------------ */

export function HBars({
  items,
  colorFn,
  maxLabel,
}: {
  items: { label: string; value: number; hint?: string }[];
  colorFn?: (index: number, item: { label: string; value: number }) => string;
  maxLabel?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const barColor = colorFn ?? (() => "#2f6ba0");
  return (
    <ul className="mt-4 space-y-3">
      {items.map((item, i) => (
        <li key={`${item.label}-${i}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate font-medium text-ink" title={item.label}>
              {item.label}
            </span>
            <span className="tnum shrink-0 font-semibold text-navy-950">
              {fmtInt(item.value)}
              {item.hint && <span className="ml-1.5 font-normal text-ink-soft">{item.hint}</span>}
              {maxLabel && <span className="sr-only"> {maxLabel}</span>}
            </span>
          </div>
          <div className="h-[9px] overflow-hidden rounded-full bg-[#eef1f4]" aria-hidden="true">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: barColor(i, item) }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Empilhada (situação por área)                                        */
/* ------------------------------------------------------------------ */

export function StackedRow({
  label,
  parts,
  total,
}: {
  label: string;
  parts: { key: string; label: string; value: number; color: string }[];
  total: number;
}) {
  return (
    <li>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
        <span className="font-medium text-ink">{label}</span>
        <span className="tnum font-semibold text-navy-950">{fmtInt(total)}</span>
      </div>
      <div className="flex h-[10px] overflow-hidden rounded-full bg-[#eef1f4]" aria-hidden="true">
        {parts
          .filter((p) => p.value > 0)
          .map((p) => (
            <div
              key={p.key}
              style={{ width: `${total > 0 ? (p.value / total) * 100 : 0}%`, backgroundColor: p.color }}
              title={`${p.label}: ${fmtInt(p.value)}`}
            />
          ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11.5px] text-ink-soft">
        {parts
          .filter((p) => p.value > 0)
          .map((p) => (
            <span key={p.key} className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2 w-2 rounded-[3px]" style={{ backgroundColor: p.color }} />
              {p.label}: <span className="tnum font-semibold">{fmtInt(p.value)}</span>
            </span>
          ))}
      </div>
    </li>
  );
}
