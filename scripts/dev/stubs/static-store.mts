/**
 * Substituto de "@/lib/static-store" para rodar o painel no Node, sem IndexedDB.
 * O harness define globalThis.__ATAS_STORE__ antes de importar o painel.
 */

type AnyRecord = Record<string, unknown>;
interface Store {
  snapshots: unknown[];
  rows: AnyRecord[];
  datasets: AnyRecord[];
}

const store = (): Store => ((globalThis as AnyRecord).__ATAS_STORE__ as Store) ?? { snapshots: [], rows: [], datasets: [] };

export const __STUB__ = true;
export const STATIC_DATA_EVENT = "giro:base-updated";

export async function listActiveProcessRows() {
  return store().rows;
}

export async function listDatasets() {
  return store().datasets;
}

export async function listActiveDatasets() {
  return store().datasets.filter((dataset) => dataset.status === "active");
}

export async function listSnapshotDatasets() {
  return store().snapshots.map((snapshot, index) => ({
    id: index + 1,
    snapshot,
    importedAt: new Date(Date.now() - index * 86400000).toISOString(),
    referenceDate: (snapshot as AnyRecord)?.referenceDate ?? null,
    status: "active",
  }));
}

export function notifyStaticDataChanged() {}

export function formatStoredDataset(dataset: AnyRecord) {
  return { id: dataset.id ?? 0, has_snapshot: Boolean(dataset.snapshot) };
}
