/**
 * Sugestão automática de mapeamento coluna → campo canônico.
 * Nunca decide sozinho em caso de ambiguidade: devolve `confidence` e a
 * interface deixa o usuário confirmar ou ajustar.
 */
import { CANONICAL_FIELDS, normText, type Mapping } from "./domain";

interface Synonym {
  key: string;
  terms: string[];       // termos exatos (normalizados)
  contains: string[];    // substrings
  weight: number;        // prioridade em conflito
}

const DICTIONARY: Synonym[] = [
  { key: "numero", weight: 100, terms: ["processo", "n processo", "nº processo", "n° processo", "numero do processo", "n do processo", "numero", "nº", "n°", "num", "id", "identificador", "ata", "n ata", "ata n", "numero da ata", "nº ata", "registro", "codigo", "pa", "pedido"], contains: ["processo", "identific", "ata n", "nº ata", "numero d"] },
  { key: "objeto", weight: 95, terms: ["objeto", "descricao", "descricao do objeto", "descricao resumida", "item", "material", "descricao do item", "resumo", "especificacao", "produto", "servico"], contains: ["objeto", "descri", "especific"] },
  { key: "area", weight: 60, terms: ["area", "categoria", "grupo", "tipo", "tipo de compra", "segmento"], contains: ["categoria"] },
  { key: "unidade", weight: 50, terms: ["unidade", "setor", "solicitante", "unidade requerente", "departamento", "unidade solicitante", "area requerente", "requerente"], contains: ["solicit", "requerente", "departamento", "setor", "unidade"] },
  { key: "fornecedor", weight: 90, terms: ["fornecedor", "empresa", "razao social", "fornecedor vencedor", "adjudicatario", "contratada", "fornecedor(es)", "nome fornecedor"], contains: ["fornec", "adjudic", "razao social"] },
  { key: "responsavel", weight: 85, terms: ["responsavel", "comprador", "gestor", "buyer", "analista", "responsavel pelo processo", "gestor do contrato", "fiscal"], contains: ["respons", "comprador", "gestor"] },
  { key: "etapa", weight: 80, terms: ["etapa", "fase", "status", "andamento", "etapa atual", "fase atual", "status do processo", "situacao do processo"], contains: ["etapa", "fase"] },
  { key: "situacao", weight: 78, terms: ["situacao", "situacao atual", "condicao", "status final", "sit"], contains: ["situacao"] },
  { key: "data_inicio", weight: 70, terms: ["data abertura", "data de abertura", "publicacao", "data de publicacao", "inicio", "data inicio", "data de inicio", "abertura", "data", "dt abertura", "data do pedido", "data de criacao"], contains: ["abertura", "publicac", "inicio"] },
  { key: "data_fim", weight: 92, terms: ["vigencia", "fim da vigencia", "validade", "vencimento", "data fim", "data de vencimento", "limite", "prazo", "fim", "termino", "data limite", "validade da ata", "dt vencimento", "fim vigencia", "ate", "data final de vigencia", "vencimento da ata"], contains: ["vigenc", "vencim", "validade", "prazo", "limite", "termino"] },
  { key: "quantidade", weight: 75, terms: ["quantidade", "qtd", "qtde", "itens", "qtd itens", "numero de itens", "total de itens", "qnt", "quant"], contains: ["quant", "itens"] },
  { key: "valor", weight: 88, terms: ["valor", "valor estimado", "valor total", "montante", "r$", "valor r$", "valor global", "preco", "valor unitario", "valor homologado", "valor da ata", "valor do contrato", "total"], contains: ["valor", "preco", "montante"] },
  { key: "status_consumo", weight: 80, terms: ["status consumo", "consumo", "nivel de consumo qtd", "saldo"], contains: ["consumo", "saldo"] },
  { key: "saving_hist", weight: 85, terms: ["saving historico", "saving hist", "saving historico r$"], contains: ["saving historico", "saving hist"] },
  { key: "saving_prop", weight: 85, terms: ["saving sob proposta", "saving proposta r$", "saving prop"], contains: ["saving proposta", "saving sob proposta"] },
  { key: "status_renovacao", weight: 82, terms: ["status renovacao", "status de renovacao", "decisao nova ata", "decisao", "renovacao"], contains: ["renovacao", "decisao"] },
  { key: "data_previsao", weight: 75, terms: ["previsao de conclusao", "estimativa de conclusao", "data previsao", "previsao"], contains: ["previsao", "estimativa"] },
  { key: "observacao", weight: 40, terms: ["observacao", "obs", "notas", "comentario", "observacoes", "comentarios", "anotacao", "anotacoes", "detalhes"], contains: ["observa", "comenta", "nota"] },
  { key: "link", weight: 65, terms: ["link", "url", "endereco", "caminho", "sharepoint", "documento", "arquivo", "hiperlink", "link do processo", "link sharepoint"], contains: ["link", "url", "sharepoint", "hiperlink"] },
];

export interface Suggestion {
  mapping: Mapping;               // canonicalKey -> header
  byHeader: Record<string, string | null>; // header -> canonicalKey
  confidence: Record<string, "exact" | "partial" | "none">; // canonicalKey
  unmappedHeaders: string[];      // colunas que ficarão em "extra"
}

export function suggestMapping(headers: string[]): Suggestion {
  const mapping: Mapping = {};
  const byHeader: Record<string, string | null> = {};
  const confidence: Record<string, "exact" | "partial" | "none"> = {};
  for (const f of CANONICAL_FIELDS) confidence[f.key] = "none";

  const normalized = headers.map((h) => ({ raw: h, n: normText(h) }));
  const usedHeaders = new Set<string>();

  interface Cand { key: string; header: string; score: number; exact: boolean }
  const cands: Cand[] = [];
  for (const entry of DICTIONARY) {
    for (const h of normalized) {
      if (usedHeaders.has(h.raw)) continue;
      if (h.n === "") continue;
      if (entry.terms.includes(h.n)) {
        cands.push({ key: entry.key, header: h.raw, score: entry.weight + 1000 + h.raw.length * -0.001, exact: true });
      } else if (entry.contains.some((c) => h.n.includes(c))) {
        cands.push({ key: entry.key, header: h.raw, score: entry.weight, exact: false });
      }
    }
  }
  cands.sort((a, b) => b.score - a.score);
  const usedKeys = new Set<string>();
  for (const c of cands) {
    if (usedKeys.has(c.key) || usedHeaders.has(c.header)) continue;
    usedKeys.add(c.key);
    usedHeaders.add(c.header);
    mapping[c.key] = c.header;
    byHeader[c.header] = c.key;
    confidence[c.key] = c.exact ? "exact" : "partial";
  }
  for (const h of headers) if (!(h in byHeader)) byHeader[h] = null;

  const unmappedHeaders = headers.filter((h) => !byHeader[h]);
  return { mapping, byHeader, confidence, unmappedHeaders };
}
