import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Giro de Atas — Painel de Compras · Fundação Butantan",
    template: "%s · Giro de Atas",
  },
  description:
    "Painel interno de compras e Atas de Registro de Preços da Fundação Butantan: panorama de prazos, riscos, áreas e processos, com importação de planilhas Excel e CSV.",
};

export const viewport: Viewport = {
  themeColor: "#f3f7fa",
};

const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('giro-atas-theme');var t=(s==='dark')?'dark':'light';document.documentElement.setAttribute('data-theme',t);var m=document.querySelector('meta[name="color-scheme"]');if(m)m.setAttribute('content',t==='dark'?'dark':'only light');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="light" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="only light" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased font-sans">
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
