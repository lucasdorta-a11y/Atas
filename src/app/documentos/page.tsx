import { DocumentsManager } from "@/components/documents-manager";

export const metadata = { title: "Documentos de apoio" };

export default function DocumentosPage() {
  return <DocumentsManager documentos={[]} erroInicial={false} />;
}
