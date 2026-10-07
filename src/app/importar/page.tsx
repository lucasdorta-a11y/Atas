import type { Metadata } from "next";
import { ImportWizard } from "@/components/import-wizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Importar dados" };

export default function ImportarPage() {
  return <ImportWizard />;
}
