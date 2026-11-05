export type PanoramaCardKey = "concluidas" | "andamento" | "saldo" | "sem_saldo" | "vencidas" | "a_vencer";
export type PanoramaAreaFilter = "TODAS" | "INDIRETOS" | "DIRETOS" | "CAPEX";

export function processosHref(params: Record<string, string | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && value.trim()) search.set(key, value);
  }
  const query = search.toString();
  return `/processos${query ? `?${query}` : ""}`;
}

function areaParam(area?: string): string | undefined {
  if (!area || area === "TODAS") return undefined;
  return area === "INDIRETOS" ? "Indiretos" : area === "DIRETOS" ? "Diretos" : area === "CAPEX" ? "CAPEX" : area;
}

/** Drill-through dos cards atuais, usando a mesma carteira calculada no Panorama. */
export function panoramaCardHref(card: PanoramaCardKey, area?: PanoramaAreaFilter | string): string {
  const base: Record<string, string | undefined> = {
    area: areaParam(area),
    origem: `card-${card}`,
    sort: "prazo",
  };
  if (card === "concluidas") return processosHref({ ...base, carteira: "concluidas" });
  if (card === "andamento") return processosHref({ ...base, natureza: "Atas em Andamento" });
  if (card === "saldo") return processosHref({ ...base, carteira: "concluidas", saldo: "com_saldo", sort: "valor_disponivel", dir: "desc" });
  if (card === "sem_saldo") return processosHref({ ...base, carteira: "concluidas", saldo: "com_esgotados", sort: "valor", dir: "desc" });
  if (card === "vencidas") return processosHref({ ...base, carteira: "vencidas" });
  return processosHref({ ...base, carteira: "a_vencer" });
}

export function panoramaQuickHref(action: "criticos" | "renovar" | "sem_saldo" | "andamento", area?: PanoramaAreaFilter | string): string {
  const areaValue = areaParam(area);
  if (action === "criticos") return processosHref({ area: areaValue, alerta: "criticos", origem: "atalho-criticos", sort: "prazo" });
  if (action === "renovar") return processosHref({ area: areaValue, natureza: "Contratos Vigentes", situacao: "a_renovar", alerta: "a_renovar", origem: "atalho-renovar", sort: "prazo" });
  if (action === "sem_saldo") return processosHref({ area: areaValue, natureza: "Contratos Vigentes", saldo: "com_esgotados", alerta: "itens_esgotados", origem: "atalho-sem-saldo", sort: "valor", dir: "desc" });
  return processosHref({ area: areaValue, natureza: "Atas em Andamento", origem: "atalho-andamento", sort: "prazo" });
}
