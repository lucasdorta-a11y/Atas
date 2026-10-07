import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await db.execute(sql`
      SELECT d.id, d.kind, d.natureza, d.file_name, d.sheet_name, d.reference_date,
             d.imported_at::text, d.status, d.mode, d.row_count, d.valid_count,
             d.skipped_count, d.dup_count, d.warning_count, d.report,
             (SELECT COUNT(*) FROM records r WHERE r.dataset_id = d.id)::int AS registros
      FROM datasets d
      ORDER BY d.imported_at DESC
      LIMIT 60
    `);
    return Response.json({ datasets: res.rows });
  } catch (err) {
    console.error("datasets.get", err);
    return Response.json({ erro: "Não foi possível listar as bases." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = Number(req.nextUrl.searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ erro: "Identificador inválido." }, { status: 400 });
    }
    const res = await db.execute(sql`DELETE FROM datasets WHERE id = ${id} RETURNING id`);
    if (res.rows.length === 0) {
      return Response.json({ erro: "Base não encontrada (talvez já tenha sido excluída)." }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error("datasets.delete", err);
    return Response.json({ erro: "Não foi possível excluir a base." }, { status: 500 });
  }
}
