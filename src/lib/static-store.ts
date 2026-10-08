import {
  situacaoPrazo,
  type CleanRecord,
  type DatasetKind,
  type DatasetNatureza,
  type ImportMode,
  type Issue,
  type SituacaoChave,
} from "@/lib/domain";
import type { DashboardSnapshotPayload } from "@/lib/dashboard-snapshot";

/**
 * Persistência local para a versão publicada no GitHub Pages.
 *
 * GitHub Pages não oferece API nem PostgreSQL. Para manter a importação
 * funcional, os datasets ficam no IndexedDB do navegador do usuário. Isso
 * preserva os registros entre visitas no mesmo navegador, mas não sincroniza
 * dados entre pessoas, dispositivos ou o SharePoint.
 */

export const STATIC_DATA_EVENT = "giro:base-updated";
const DB_NAME = "giro-de-atas-static";
const DB_VERSION = 2;
const DATASETS_STORE = "datasets";
const DOCUMENTS_STORE = "documents";

export interface StoredDataset {
  id: number;
  kind: DatasetKind;
  natureza: DatasetNatureza;
  fileName: string;
  sheetName: string | null;
  referenceDate: string | null;
  importedAt: string;
  status: "active" | "superseded";
  mode: ImportMode;
  rowCount: number;
  validCount: number;
  skippedCount: number;
  dupCount: number;
  warningCount: number;
  report: {
    issues: Issue[];
    issuesTotal: number;
  };
  records: CleanRecord[];
  /** Leitura explícita dos blocos do painel; permanece no histórico local. */
  snapshot: DashboardSnapshotPayload | null;
}

export interface StoredDocument {
  id: number;
  titulo: string;
  url: string;
  categoria: string;
  descricao: string | null;
  createdAt: string;
}

export interface SaveDatasetInput {
  kind: DatasetKind;
  natureza: DatasetNatureza;
  fileName: string;
  sheetName: string | null;
  referenceDate: string | null;
  importMode: ImportMode;
  rowCount: number;
  result: {
    records: CleanRecord[];
    issues: Issue[];
    skipped: number;
    duplicates: number;
    warnings: number;
  };
  snapshot?: DashboardSnapshotPayload | null;
}

export interface ProcessRow {
  id: string;
  dataset_id: number;
  area: string | null;
  numero: string;
  objeto: string;
  unidade: string | null;
  fornecedor: string | null;
  responsavel: string | null;
  etapa: string | null;
  situacao_fonte: string | null;
  situacao_norm: "concluido" | "cancelado" | null;
  data_inicio: string | null;
  data_fim: string | null;
  quantidade: number | null;
  valor: number | null;
  status_consumo: string | null;
  saving_hist: number | null;
  saving_prop: number | null;
  status_renovacao: string | null;
  data_previsao: string | null;
  observacao: string | null;
  link: string | null;
  source_row: number | null;
  extra: Record<string, string> | null;
  dias: number | null;
  situacao: SituacaoChave;
  file_name: string;
  kind: string;
  natureza: string;
  reference_date: string | null;
  imported_at: string;
}

function assertBrowser() {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    throw new Error("O armazenamento local só está disponível no navegador.");
  }
}

function openDatabase(): Promise<IDBDatabase> {
  assertBrowser();
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir o armazenamento local."));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DATASETS_STORE)) {
        db.createObjectStore(DATASETS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(DOCUMENTS_STORE)) {
        db.createObjectStore(DOCUMENTS_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Falha no armazenamento local."));
  });
}

async function readAll<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(storeName, "readonly");
    return await requestResult(tx.objectStore(storeName).getAll() as IDBRequest<T[]>);
  } finally {
    db.close();
  }
}

async function put<T>(storeName: string, value: T): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Falha ao salvar no armazenamento local."));
      tx.onabort = () => reject(tx.error ?? new Error("Operação cancelada no armazenamento local."));
    });
  } finally {
    db.close();
  }
}

async function deleteById(storeName: string, id: number): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Falha ao excluir do armazenamento local."));
      tx.onabort = () => reject(tx.error ?? new Error("Operação cancelada no armazenamento local."));
    });
  } finally {
    db.close();
  }
}

export async function listDatasets(): Promise<StoredDataset[]> {
  const rows = await readAll<StoredDataset>(DATASETS_STORE);
  return rows.sort((a, b) => b.importedAt.localeCompare(a.importedAt));
}

export async function listActiveDatasets(): Promise<StoredDataset[]> {
  const rows = await listDatasets();
  return rows.filter((d) => d.status === "active");
}

/** Snapshots ativos e arquivados, em ordem do mais recente para o mais antigo. */
export async function listSnapshotDatasets(): Promise<StoredDataset[]> {
  const rows = await listDatasets();
  return rows.filter((dataset) => Boolean(dataset.snapshot)).sort((a, b) => b.importedAt.localeCompare(a.importedAt));
}

export async function saveDataset(input: SaveDatasetInput): Promise<StoredDataset> {
  const existing = await listDatasets();
  const id = existing.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const now = new Date().toISOString();

  const superseded = [
    ...(input.importMode === "replace"
      ? existing
          .filter((item) => item.status === "active" && item.kind === input.kind)
          .map((item) => ({ ...item, status: "superseded" as const }))
      : []),
    // Snapshot é uma série única do painel: ao importar uma nova leitura,
    // a leitura anterior continua no histórico e deixa de ser a ativa.
    ...(input.snapshot
      ? existing
          .filter((item) => item.status === "active" && item.snapshot)
          .filter((item) => !existing.some((candidate) => candidate.id === item.id && candidate.status === "superseded"))
          .map((item) => ({ ...item, status: "superseded" as const }))
      : []),
  ].filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index);

  const dataset: StoredDataset = {
    id,
    kind: input.kind,
    natureza: input.natureza,
    fileName: input.fileName,
    sheetName: input.sheetName,
    referenceDate: input.referenceDate,
    importedAt: now,
    status: "active",
    mode: input.importMode,
    rowCount: input.rowCount,
    validCount: input.result.records.length,
    skippedCount: input.result.skipped,
    dupCount: input.result.duplicates,
    warningCount: input.result.warnings,
    report: {
      issues: input.result.issues.slice(0, 500),
      issuesTotal: input.result.issues.length,
    },
    records: input.result.records,
    snapshot: input.snapshot ?? null,
  };

  // Uma única transação mantém a substituição e a nova base consistentes:
  // se qualquer gravação falhar, nenhuma das alterações é confirmada.
  const db = await openDatabase();
  try {
    const tx = db.transaction(DATASETS_STORE, "readwrite");
    const store = tx.objectStore(DATASETS_STORE);
    for (const previous of superseded) store.put(previous);
    store.put(dataset);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Falha ao salvar a importação local."));
      tx.onabort = () => reject(tx.error ?? new Error("Importação local cancelada."));
    });
  } finally {
    db.close();
  }
  return dataset;
}

export async function deleteDataset(id: number): Promise<void> {
  await deleteById(DATASETS_STORE, id);
}

export async function listActiveProcessRows(): Promise<ProcessRow[]> {
  const datasets = await listActiveDatasets();
  const rows: ProcessRow[] = [];
  for (const dataset of datasets) {
    dataset.records.forEach((record, index) => {
      const prazo = situacaoPrazo(record.situacaoNorm, record.dataFim);
      rows.push({
        id: `${dataset.id}:${index}`,
        dataset_id: dataset.id,
        area: record.area,
        numero: record.numero,
        objeto: record.objeto,
        unidade: record.unidade,
        fornecedor: record.fornecedor,
        responsavel: record.responsavel,
        etapa: record.etapa,
        situacao_fonte: record.situacaoFonte,
        situacao_norm: record.situacaoNorm,
        data_inicio: record.dataInicio,
        data_fim: record.dataFim,
        quantidade: record.quantidade,
        valor: record.valor,
        status_consumo: record.statusConsumo,
        saving_hist: record.savingHist,
        saving_prop: record.savingProp,
        status_renovacao: record.statusRenovacao,
        data_previsao: record.dataPrevisao,
        observacao: record.observacao,
        link: record.link,
        source_row: record.sourceRow,
        extra: record.extra,
        dias: prazo.dias,
        situacao: prazo.chave,
        file_name: dataset.fileName,
        kind: dataset.kind,
        natureza: dataset.natureza,
        reference_date: dataset.referenceDate,
        imported_at: dataset.importedAt,
      });
    });
  }
  return rows;
}

export async function listDocuments(): Promise<StoredDocument[]> {
  const rows = await readAll<StoredDocument>(DOCUMENTS_STORE);
  return rows.sort((a, b) => a.categoria.localeCompare(b.categoria) || a.titulo.localeCompare(b.titulo));
}

export async function createDocument(input: Omit<StoredDocument, "id" | "createdAt">): Promise<StoredDocument> {
  const existing = await listDocuments();
  const id = existing.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const document: StoredDocument = { ...input, id, createdAt: new Date().toISOString() };
  await put(DOCUMENTS_STORE, document);
  return document;
}

export async function deleteDocument(id: number): Promise<void> {
  await deleteById(DOCUMENTS_STORE, id);
}

export function notifyStaticDataChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(STATIC_DATA_EVENT));
}

export function formatStoredDataset(dataset: StoredDataset) {
  return {
    id: dataset.id,
    kind: dataset.kind,
    natureza: dataset.natureza,
    file_name: dataset.fileName,
    sheet_name: dataset.sheetName,
    reference_date: dataset.referenceDate,
    imported_at: dataset.importedAt,
    status: dataset.status,
    mode: dataset.mode,
    row_count: dataset.rowCount,
    valid_count: dataset.validCount,
    skipped_count: dataset.skippedCount,
    dup_count: dataset.dupCount,
    warning_count: dataset.warningCount,
    registros: dataset.records.length,
    has_snapshot: Boolean(dataset.snapshot),
    snapshot_coverage: dataset.snapshot?.coverage ?? null,
    report: dataset.report,
  };
}
