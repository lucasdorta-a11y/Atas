import { db } from "@/db";
import { documents } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const CATEGORIAS = new Set(["Procedimento", "Norma", "Manual", "Link SharePoint", "Outro"]);

export async function GET() {
  try {
    const rows = await db.select().from(documents).orderBy(asc(documents.categoria), asc(documents.titulo));
    return Response.json({ documentos: rows });
  } catch (err) {
    console.error("documentos.get", err);
    return Response.json({ erro: "Não foi possível listar os documentos." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { titulo?: string; url?: string; categoria?: string; descricao?: string };
    const titulo = (body.titulo ?? "").trim().slice(0, 200);
    const url = (body.url ?? "").trim().slice(0, 2000);
    const descricao = (body.descricao ?? "").trim().slice(0, 1000) || null;
    const categoria = CATEGORIAS.has(body.categoria ?? "") ? (body.categoria as string) : "Outro";

    if (!titulo) return Response.json({ erro: "Informe um título para o documento." }, { status: 400 });
    if (!/^https?:\/\/\S+$/i.test(url)) {
      return Response.json({ erro: "Informe uma URL válida começando com http:// ou https://." }, { status: 400 });
    }
    const [row] = await db.insert(documents).values({ titulo, url, categoria, descricao }).returning();
    return Response.json({ documento: row }, { status: 201 });
  } catch (err) {
    console.error("documentos.post", err);
    return Response.json({ erro: "Não foi possível salvar o documento." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = Number(req.nextUrl.searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ erro: "Identificador inválido." }, { status: 400 });
    }
    const deleted = await db.delete(documents).where(eq(documents.id, id)).returning({ id: documents.id });
    if (deleted.length === 0) {
      return Response.json({ erro: "Documento não encontrado." }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error("documentos.delete", err);
    return Response.json({ erro: "Não foi possível excluir o documento." }, { status: 500 });
  }
}
