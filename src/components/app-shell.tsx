"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { BookOpen, LayoutDashboard, Maximize2, Minimize2, Moon, Sun, Table2, Upload } from "lucide-react";
import clsx from "clsx";
import { fmtDate } from "@/lib/format";
import { getStaticBaseSummary } from "@/lib/static-dashboard";
import { STATIC_DATA_EVENT } from "@/lib/static-store";

const THEME_STORAGE_KEY = "giro-atas-theme";

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
        <rect x="2" y="2" width="34" height="34" rx="9" fill="#e6f0f7" stroke="#b7d2e8" />
        <path d="M9 24.5 15 15l4.2 5.2L23.5 14 29 24.5Z" fill="none" stroke="#064678" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx="28.2" cy="10.6" r="2.6" fill="#e06e1f" />
      </svg>
      {!compact && (
        <span className="leading-tight">
          <span className="block font-display text-[17px] font-bold tracking-tight text-navy-900">Giro de Atas</span>
          <span className="block text-[11.5px] font-medium text-ink-soft">Compras · Fundação Butantan</span>
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
      const data = await getStaticBaseSummary();
      if (!data.hasData) {
        setInfo({ label: "Nenhuma base carregada", detalhe: "Importe uma planilha para começar" });
      } else {
        const fonte =
          data.dataSource === "shared"
            ? "snapshot compartilhado"
            : data.dataSource === "local"
              ? "base local"
              : "sem fonte compartilhada";
        setInfo({
          label: data.referenceDate ? `Base de referência: ${fmtDate(data.referenceDate)}` : "Base sem data de referência",
          detalhe: `${fonte} · ${data.activeCount} ${data.activeCount === 1 ? "base ativa" : "bases ativas"} · ${data.processCount.toLocaleString("pt-BR")} registros`,
        });
      }
    } catch {
      setInfo({ label: "Armazenamento local indisponível", detalhe: "verifique as permissões do navegador" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const onUpdate = () => load();
    window.addEventListener(STATIC_DATA_EVENT, onUpdate);
    return () => window.removeEventListener(STATIC_DATA_EVENT, onUpdate);
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
  const isPanorama = pathname === "/" || pathname === "/Atas" || pathname === "/Atas/";
  const onImport = pathname.startsWith("/importar");
  const [panoramaFocus, setPanoramaFocus] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const applyTheme = useCallback((next: "light" | "dark") => {
    setTheme(next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", next);
      const meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) meta.setAttribute("content", next === "dark" ? "dark" : "only light");
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Sem persistência disponível; mantém na sessão atual.
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      const initial = saved === "dark" ? "dark" : "light";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      applyTheme(initial);
    } catch {
      applyTheme("light");
    }
  }, [applyTheme]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isPanorama) setPanoramaFocus(false);
  }, [isPanorama, pathname]);

  const toggleTheme = () => applyTheme(theme === "dark" ? "light" : "dark");

  return (
    <div className={clsx("min-h-dvh bg-canvas text-ink")}>
      {/* ================= Sidebar (desktop — 100% clara no modo Claro) ================= */}
      {!panoramaFocus && (
        <aside
          className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-line bg-surface lg:flex"
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
                      ? "bg-navy-100 font-semibold text-navy-900"
                      : "text-ink-soft hover:bg-navy-50 hover:text-navy-900",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={clsx(
                      "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-accent-500 transition-opacity",
                      active ? "opacity-100" : "opacity-0 group-hover:opacity-40",
                    )}
                  />
                  <item.icon
                    size={19}
                    strokeWidth={2}
                    aria-hidden="true"
                    className={active ? "text-accent-600" : "text-ink-soft group-hover:text-navy-800"}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-line px-5 py-4">
            <p className="text-[11.5px] leading-relaxed text-ink-soft">
              O panorama pode usar a leitura compartilhada corporativa; importações locais permanecem no IndexedDB deste navegador.
            </p>
          </div>
        </aside>
      )}

      {/* ================= Topbar ================= */}
      {!panoramaFocus && (
        <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-sm lg:pl-[248px]">
          <div className="flex h-[60px] items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3 lg:hidden">
              <Link href="/" aria-label="Giro de Atas — ir para o Panorama" className="rounded-lg">
                <BrandMark compact />
              </Link>
              <span className="font-display text-[16px] font-bold tracking-tight text-navy-900">Giro de Atas</span>
            </div>
            <div className="hidden items-center gap-2 lg:flex" aria-hidden="true">
              <span className="text-[13px] font-medium text-ink-soft">Painel de Compras e Atas de Registro de Preços</span>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-[12.5px] font-semibold text-navy-900 shadow-sm transition-colors hover:bg-navy-50"
                aria-label={theme === "dark" ? "Mudar para o tema claro" : "Mudar para o tema escuro"}
                title={theme === "dark" ? "Mudar para o tema claro" : "Mudar para o tema escuro"}
              >
                {theme === "dark" ? <Sun size={16} className="text-amber-400" aria-hidden="true" /> : <Moon size={16} className="text-navy-700" aria-hidden="true" />}
                <span>{theme === "dark" ? "Claro" : "Escuro"}</span>
              </button>
              {isPanorama && (
                <button
                  type="button"
                  onClick={() => setPanoramaFocus(true)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-[12.5px] font-semibold text-navy-900 shadow-sm transition-colors hover:bg-navy-50"
                  aria-label="Abrir o panorama em tela cheia, sem navegação"
                >
                  <Maximize2 size={16} aria-hidden="true" />
                  <span className="hidden sm:inline">Tela cheia</span>
                </button>
              )}
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
      )}

      {/* ================= Conteúdo ================= */}
      <main
        id="conteudo"
        tabIndex={-1}
        className={clsx(
          "anim-fade-up mx-auto w-full",
          panoramaFocus && isPanorama
            ? "max-w-none px-5 pb-14 pt-8 sm:px-8 lg:px-12"
            : "max-w-[1280px] px-4 pb-28 pt-6 sm:px-6 lg:pl-[272px] lg:pr-8 lg:pt-8 lg:pb-14 lg:max-w-none",
        )}
      >
        {children}
      </main>

      {panoramaFocus && isPanorama && (
        <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-surface/95 px-3 text-[12.5px] font-semibold text-navy-900 shadow-pop backdrop-blur-sm transition-colors hover:bg-navy-50"
            aria-label={theme === "dark" ? "Mudar para o tema claro" : "Mudar para o tema escuro"}
          >
            {theme === "dark" ? <Sun size={16} className="text-amber-400" aria-hidden="true" /> : <Moon size={16} className="text-navy-700" aria-hidden="true" />}
            <span>{theme === "dark" ? "Claro" : "Escuro"}</span>
          </button>
          <button
            type="button"
            onClick={() => setPanoramaFocus(false)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-surface/95 px-3 text-[12.5px] font-semibold text-navy-900 shadow-pop backdrop-blur-sm transition-colors hover:bg-navy-50"
            aria-label="Sair da tela cheia e restaurar a navegação"
          >
            <Minimize2 size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Sair da tela cheia</span>
          </button>
        </div>
      )}

      {/* ================= Navegação inferior (mobile) ================= */}
      {!panoramaFocus && (
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
                      active ? "text-navy-900 font-semibold" : "text-ink-soft hover:text-navy-800",
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
      )}
    </div>
  );
}
