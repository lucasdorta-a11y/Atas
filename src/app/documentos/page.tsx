import type { Metadata } from "next";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { asc } from "drizzle-orm";
import { DocumentsManager } from "@/components/documents-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Documentos de apoio" };

export default async function DocumentosPage() {
  let docs: (typeof documents.$inferSelect)[] = [];
  let erro = false;
  try {
    docs = await db.select().from(documents).orderBy(asc(documents.categoria), asc(documents.titulo));
  } catch {
    erro = true;
  }
  return <DocumentsManager documentos={docs} erroInicial={erro} />;
}
