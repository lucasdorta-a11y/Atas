"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { BookOpen, LayoutDashboard, Table2, Upload } from "lucide-react";
import clsx from "clsx";
import { fmtDate } from "@/lib/format";

const NAV = [
  { href: "/", label: "Panorama", icon: LayoutDashboard, match: (p: string) => p === "/" },
  { href: "/processos", label: "Processos", icon: Table2, match: (p: string) => p.startsWith("/processos") },
  { href: "/importar", label: "Importar", icon: Upload, match: (p: string) => p.startsWith("/importar") },
  { href: "/documentos", label: "Documentos", icon: BookOpen, match: (p: string) => p.startsWith("/documentos") },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden="true" className="shrink-0">
        <rect x="2" y="2" width="34" height="34" rx="9" fill="#0c2338" stroke="#1b4568" />
        <path d="M9 24.5 15 15l4.2 5.2L23.5 14 29 24.5Z" fill="none" stroke="#e06e1f" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx="28.2" cy="10.6" r="2.4" fill="#ec9152" />
      </svg>
      {!compact && (
        <span className="leading-tight">
          <span className="block font-display text-[17px] font-bold tracking-tight text-white">Giro de Atas</span>
          <span className="block text-[11.5px] font-medium text-navy-300">Compras · Fundação Butantan</span>
        </span>
      )}
    </span>
  );
}

/** Chip de contexto da base: data de referência + nº de bases ativas. */
function BaseChip() {
  const [info, setInfo] = useState<{ label: string; detalhe: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const data = await res.json();
      const ativas = (data.datasets ?? []).filter((d: { status: string }) => d.status === "active");
      if (!ativas.length) {
        setInfo({ label: "Nenhuma base carregada", detalhe: "Importe uma planilha para começar" });
      } else {
        const refs = ativas.map((d: { reference_date: string | null }) => d.reference_date).filter(Boolean) as string[];
        const ref = refs.length ? refs.sort().reverse()[0] : null;
        setInfo({
          label: ref ? `Base de referência: ${fmtDate(ref)}` : "Base sem data de referência",
          detalhe: `${ativas.length} ${ativas.length === 1 ? "base ativa" : "bases ativas"} · ${Number(data.kpis?.processos ?? 0).toLocaleString("pt-BR")} processos`,
        });
      }
    } catch {
      setInfo({ label: "Base indisponível", detalhe: "não foi possível ler o banco de dados" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener("giro:base-updated", onUpdate);
    return () => window.removeEventListener("giro:base-updated", onUpdate);
  }, [load]);

  return (
    <div
      className="hidden min-w-0 flex-col items-end text-right sm:flex"
      role="status"
      aria-live="polite"
      aria-label="Contexto da base de dados"
    >
      {loading ? (
        <span className="skeleton h-8 w-44 rounded-lg" aria-hidden="true" />
      ) : (
        <>
          <span className="text-[13px] font-semibold text-ink">{info?.label}</span>
          <span className="text-[12px] text-ink-soft">{info?.detalhe}</span>
        </>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const onImport = pathname.startsWith("/importar");

  return (
    <div className="min-h-dvh">
      {/* ================= Sidebar (desktop) ================= */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col bg-navy-950 lg:flex"
        aria-label="Navegação principal"
      >
        <div className="px-5 pb-5 pt-6">
          <Link href="/" className="inline-block rounded-lg" aria-label="Giro de Atas — ir para o Panorama">
            <BrandMark />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3" aria-label="Seções do painel">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "group relative flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-[14px] font-medium transition-colors",
                  active
                    ? "bg-navy-800/80 text-white"
                    : "text-navy-300 hover:bg-navy-900 hover:text-white",
                )}
              >
                <span
                  aria-hidden="true"
                  className={clsx(
                    "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-accent-500 transition-opacity",
                    active ? "opacity-100" : "opacity-0 group-hover:opacity-40",
                  )}
                />
                <item.icon size={19} strokeWidth={2} aria-hidden="true" className={active ? "text-accent-400" : "text-navy-400 group-hover:text-navy-200"} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-navy-800/70 px-5 py-4">
          <p className="text-[11.5px] leading-relaxed text-navy-400">
            Dados armazenados no banco interno (PostgreSQL). Não há sincronização automática com o SharePoint.
          </p>
        </div>
      </aside>

      {/* ================= Topbar ================= */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-sm lg:pl-[248px]">
        <div className="flex h-[60px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3 lg:hidden">
            <Link href="/" aria-label="Giro de Atas — ir para o Panorama" className="rounded-lg">
              <BrandMark compact />
            </Link>
            <span className="font-display text-[16px] font-bold tracking-tight text-navy-950">Giro de Atas</span>
          </div>
          <div className="hidden items-center gap-2 lg:flex" aria-hidden="true">
            <span className="text-[13px] font-medium text-ink-soft">Painel de Compras e Atas de Registro de Preços</span>
          </div>
          <div className="flex items-center gap-4">
            <BaseChip />
            {!onImport && (
              <Link
                href="/importar"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent-600 px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-accent-700"
              >
                <Upload size={16} aria-hidden="true" />
                <span className="hidden sm:inline">Importar planilha</span>
                <span className="sm:hidden">Importar</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ================= Conteúdo ================= */}
      <main id="conteudo" tabIndex={-1} className="anim-fade-up mx-auto w-full max-w-[1280px] px-4 pb-28 pt-6 sm:px-6 lg:pl-[272px] lg:pr-8 lg:pt-8 lg:pb-14 lg:max-w-none">
        {children}
      </main>

      {/* ================= Navegação inferior (mobile) ================= */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Navegação principal (móvel)"
        data-no-print
      >
        <ul className="grid grid-cols-4">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "relative flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                    active ? "text-navy-800" : "text-neutral-500 hover:text-navy-700",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={clsx(
                      "absolute top-0 h-[3px] w-10 rounded-b-full bg-accent-500 transition-opacity",
                      active ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <item.icon size={21} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" className={active ? "text-accent-600" : undefined} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
