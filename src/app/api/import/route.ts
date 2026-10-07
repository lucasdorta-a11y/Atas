import { db } from "@/db";
import { datasets, records } from "@/db/schema";
import { sql } from "drizzle-orm";
import {
  KIND_LABEL, normText, transformAndValidate,
  type DatasetKind, type DatasetNatureza, type ImportMode, type Mapping,
} from "@/lib/domain";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_ROWS = 60000;
const ISSUE_SAMPLE = 300;

interface ImportPayload {
  phase: "validate" | "commit";
  fileName: string;
  sheetName: string | null;
  kind: DatasetKind;
  natureza: DatasetNatureza;
  importMode: ImportMode;
  referenceDate: string | null;
  mapping: Mapping;
  rows: Record<string, unknown>[];
}

function badRequest(msg: string) {
  return Response.json({ erro: msg }, { status: 400 });
}

function summarize(result: ReturnType<typeof transformAndValidate>) {
  const valorTotal = result.records.reduce((a, r) => a + (r.valor ?? 0), 0);
  const itensTotal = result.records.reduce((a, r) => a + (r.quantidade ?? 0), 0);
  const dateValues = result.records.map((r) => r.dataInicio).filter(Boolean) as string[];
  const refSugerida = dateValues.length ? dateValues.sort()[dateValues.length - 1] : null;
  return {
    validos: result.records.length,
    ignoradas: result.skipped,
    duplicadas: result.duplicates,
    avisos: result.warnings,
    valorTotal,
    itensTotal,
    valorCobertura: result.records.filter((r) => r.valor !== null).length,
    itensCobertura: result.records.filter((r) => r.quantidade !== null).length,
    refSugerida,
    issuesAmostra: result.issues.slice(0, ISSUE_SAMPLE),
    issuesTotal: result.issues.length,
  };
}

export async function POST(req: Request) {
  let payload: ImportPayload;
  try {
    payload = (await req.json()) as ImportPayload;
  } catch {
    return badRequest("Corpo da requisição inválido.");
  }

  if (!payload || typeof payload !== "object") return badRequest("Dados de importação ausentes.");
  if (!Array.isArray(payload.rows)) return badRequest("Nenhuma linha recebida.");
  if (payload.rows.length === 0) return badRequest("O arquivo não contém linhas de dados (apenas o cabeçalho).");
  if (payload.rows.length > MAX_ROWS) return badRequest(`Máximo de ${MAX_ROWS.toLocaleString("pt-BR")} linhas por importação.`);
  if (!payload.mapping || !payload.mapping.numero || !payload.mapping.objeto) {
    return badRequest("Mapeie ao menos os campos obrigatórios (identificador e objeto) antes de importar.");
  }
  if (!payload.fileName || payload.fileName.length > 300) return badRequest("Nome de arquivo inválido.");
  if (!["indiretos", "diretos", "capex", "outro"].includes(payload.kind)) return badRequest("Tipo de base inválido.");
  if (payload.natureza !== "operacional" && payload.natureza !== "snapshot") payload.natureza = "operacional";
  if (payload.importMode !== "replace" && payload.importMode !== "combine") payload.importMode = "replace";
  if (payload.referenceDate && !/^\d{4}-\d{2}-\d{2}$/.test(payload.referenceDate)) payload.referenceDate = null;

  // A validação é refeita no servidor: o cliente nunca é fonte confiável.
  const defaultArea =
    payload.kind === "indiretos" ? "Indiretos" :
    payload.kind === "diretos" ? "Diretos" :
    payload.kind === "capex" ? "CAPEX" : null;

  const result = transformAndValidate(payload.rows, payload.mapping, { defaultArea });
  const summary = summarize(result);

  if (payload.phase === "validate") {
    return Response.json({
      ok: true,
      resumo: summary,
      amostra: result.records.slice(0, 8),
    });
  }

  if (result.records.length === 0) {
    return badRequest("Nenhuma linha válida para importar. Corrija o mapeamento ou a planilha e tente novamente.");
  }

  try {
    const report = {
      mapping: payload.mapping,
      issuesAmostra: summary.issuesAmostra,
      issuesTotal: summary.issuesTotal,
      valorTotal: summary.valorTotal,
      itensTotal: summary.itensTotal,
      importadoEm: new Date().toISOString(),
    };

    const datasetId = await db.transaction(async (tx) => {
      if (payload.importMode === "replace") {
        // Nada é apagado: bases anteriores do mesmo tipo ficam como "superseded" (auditoria/variação).
        await tx.execute(sql`
          UPDATE datasets SET status = 'superseded'
          WHERE kind = ${payload.kind} AND status = 'active'
        `);
      }

      const [{ id }] = await tx
        .insert(datasets)
        .values({
          kind: payload.kind,
          natureza: payload.natureza,
          fileName: payload.fileName,
          sheetName: payload.sheetName,
          referenceDate: payload.referenceDate,
          status: "active",
          mode: payload.importMode,
          rowCount: payload.rows.length,
          validCount: result.records.length,
          skippedCount: result.skipped,
          dupCount: result.duplicates,
          warningCount: result.warnings,
          report,
        })
        .returning({ id: datasets.id });

      const CHUNK = 800;
      for (let i = 0; i < result.records.length; i += CHUNK) {
        const slice = result.records.slice(i, i + CHUNK);
        await tx.insert(records).values(
          slice.map((r) => ({
            datasetId: id,
            area: r.area,
            numero: r.numero,
            objeto: r.objeto,
            unidade: r.unidade,
            fornecedor: r.fornecedor,
            responsavel: r.responsavel,
            etapa: r.etapa,
            situacaoFonte: r.situacaoFonte,
            situacaoNorm: r.situacaoNorm,
            dataInicio: r.dataInicio,
            dataFim: r.dataFim,
            quantidade: r.quantidade === null ? null : String(r.quantidade),
            valor: r.valor === null ? null : String(r.valor),
            statusConsumo: r.statusConsumo,
            savingHist: r.savingHist === null ? null : String(r.savingHist),
            savingProp: r.savingProp === null ? null : String(r.savingProp),
            statusRenovacao: r.statusRenovacao,
            dataPrevisao: r.dataPrevisao,
            observacao: r.observacao,
            link: r.link,
            extra: r.extra,
            rowHash: r.rowHash,
            sourceRow: r.sourceRow,
            searchNorm: normText(
              [r.numero, r.objeto, r.fornecedor, r.responsavel, r.etapa, r.unidade, r.observacao]
                .filter(Boolean)
                .join(" "),
            ).slice(0, 6000),
          })),
        );
      }
      return id;
    });

    return Response.json({
      ok: true,
      datasetId,
      kindLabel: KIND_LABEL[payload.kind],
      resumo: summary,
    });
  } catch (err) {
    console.error("import.commit", err);
    return Response.json({ erro: "Falha ao gravar a base. Nenhum dado foi alterado (operação revertida)." }, { status: 500 });
  }
}
