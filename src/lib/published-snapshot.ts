import type { DashboardSnapshotPayload } from "@/lib/dashboard-snapshot";

/**
 * Contrato do snapshot compartilhado. O arquivo/API pode ser servido por uma
 * Azure Function ou por outro endpoint protegido pelo Microsoft Entra ID.
 *
 * O snapshot não contém o Excel original: somente os blocos já consolidados
 * pelo extrator do Giro.
 */
export interface PublishedSnapshotDocument {
  schemaVersion: 1;
  kind: "giro-snapshot";
  generatedAt: string;
  snapshot: DashboardSnapshotPayload;
}

/** URL configurável para a API protegida do Azure Static Web Apps. */
export function publishedSnapshotUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_GIRO_API_URL?.trim();
  return configured || null;
}

/**
 * Carrega a leitura compartilhada no navegador.
 *
 * Sem NEXT_PUBLIC_GIRO_API_URL o site permanece no modo local/IndexedDB. Isso
 * permite desenvolver e publicar a interface antes de ligar o endpoint
 * protegido pelo Entra ID, sem tentar buscar uma rota inexistente no Pages.
 */
export async function loadPublishedSnapshot(): Promise<DashboardSnapshotPayload | null> {
  const url = publishedSnapshotUrl();
  if (!url || typeof window === "undefined") return null;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const document = await response.json() as Partial<PublishedSnapshotDocument>;
    if (document.kind !== "giro-snapshot" || document.schemaVersion !== 1 || !document.snapshot) return null;
    if (document.snapshot.schemaVersion !== 2 || !document.snapshot.coverage) return null;
    return document.snapshot;
  } catch {
    // O IndexedDB/local continua sendo o fallback quando o endpoint estiver
    // indisponível, em desenvolvimento ou temporariamente sem autenticação.
    return null;
  }
}
