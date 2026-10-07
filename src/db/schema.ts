import { pgTable, serial, text, integer, numeric, date, timestamp, jsonb, index } from "drizzle-orm/pg-core";

/**
 * Cada importação gera um "dataset". Substituir uma base não apaga a
 * anterior: ela fica como `superseded`, o que permite auditar e comparar
 * variações entre bases. Excluir um dataset remove seus registros.
 */
export const datasets = pgTable("datasets", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(), // indiretos | diretos | capex | outro
  natureza: text("natureza").notNull().default("operacional"), // operacional | snapshot
  fileName: text("file_name").notNull(),
  sheetName: text("sheet_name"),
  referenceDate: date("reference_date", { mode: "string" }),
  importedAt: timestamp("imported_at", { withTimezone: false }).notNull().defaultNow(),
  status: text("status").notNull().default("active"), // active | superseded
  mode: text("mode").notNull().default("replace"), // replace | combine
  rowCount: integer("row_count").notNull().default(0),
  validCount: integer("valid_count").notNull().default(0),
  skippedCount: integer("skipped_count").notNull().default(0),
  dupCount: integer("dup_count").notNull().default(0),
  warningCount: integer("warning_count").notNull().default(0),
  report: jsonb("report"), // resumo + amostra de problemas para auditoria
});

export const records = pgTable(
  "records",
  {
    id: serial("id").primaryKey(),
    datasetId: integer("dataset_id")
      .notNull()
      .references(() => datasets.id, { onDelete: "cascade" }),
    area: text("area"),
    numero: text("numero").notNull(),
    objeto: text("objeto").notNull(),
    unidade: text("unidade"),
    fornecedor: text("fornecedor"),
    responsavel: text("responsavel"),
    etapa: text("etapa"),
    situacaoFonte: text("situacao_fonte"),
    situacaoNorm: text("situacao_norm"), // concluido | cancelado | null
    dataInicio: date("data_inicio", { mode: "string" }),
    dataFim: date("data_fim", { mode: "string" }),
    quantidade: numeric("quantidade"),
    valor: numeric("valor"),
    statusConsumo: text("status_consumo"),
    savingHist: numeric("saving_hist"),
    savingProp: numeric("saving_prop"),
    statusRenovacao: text("status_renovacao"),
    dataPrevisao: date("data_previsao", { mode: "string" }),
    observacao: text("observacao"),
    link: text("link"),
    searchNorm: text("search_norm"),
    rowHash: text("row_hash"),
    sourceRow: integer("source_row"),
    extra: jsonb("extra"), // colunas não mapeadas, preservadas da planilha
  },
  (t) => [
    index("records_dataset_idx").on(t.datasetId),
    index("records_datafim_idx").on(t.dataFim),
    index("records_area_idx").on(t.area),
  ],
);

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  url: text("url").notNull(),
  categoria: text("categoria").notNull().default("Outro"),
  descricao: text("descricao"),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export type DatasetRow = typeof datasets.$inferSelect;
export type RecordRow = typeof records.$inferSelect;
export type DocumentRow = typeof documents.$inferSelect;
