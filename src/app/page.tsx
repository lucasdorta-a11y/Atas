"use client";

import Link from "next/link";
import { FileStack, FileUp } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui";
import { DatasetsPanel } from "@/components/datasets-panel";

export default function PanoramaPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        overline="Panorama geral"
        title="Giro de Atas"
        description="Painel interno de compras e Atas de Registro de Preços. Importe suas planilhas operacionais e de snapshots para alimentar os indicadores."
      />
      <EmptyState
        icon={<FileStack />}
        title="Comece importando as planilhas"
        description="Os números do painel são alimentados pelas planilhas Excel ou CSV. Use as planilhas da equipe para espelhar as visões do SharePoint aqui."
        action={
          <Link
            href="/importar"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent-600 px-5 text-[14px] font-semibold text-white transition-colors hover:bg-accent-700"
          >
            <FileUp size={17} aria-hidden="true" />
            Importar planilhas
          </Link>
        }
      />

      <section className="mt-12 border-t border-line pt-8" data-no-print>
        <h2 className="text-[16px] font-bold text-navy-950 mb-4">Auditoria das Bases de Dados</h2>
        <DatasetsPanel />
      </section>
    </div>
  );
}
