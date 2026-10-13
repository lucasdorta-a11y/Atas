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
  themeColor: "#07182b",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased font-sans">
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
