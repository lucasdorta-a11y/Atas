/**
 * Teste E2E do Giro de Atas (executar com a app rodando em :3000):
 *   node scripts/e2e-test.mjs
 * Gera arquivos sintéticos de teste COM RÓTULO explícito e os remove do banco ao final.
 */
import * as XLSX from "xlsx";
import assert from "node:assert/strict";

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const MARCADOR = "TESTE-E2E";

let passou = 0;
function ok(nome) {
  passou++;
  console.log(`  ✓ ${nome}`);
}

/* ------------------------------ preparação ------------------------------ */

// Planilha 1 (aba "Dados"): cabeçalhos em pt-BR não padronizados, datas BR, valores BR
const linhasIndiretos = [
  ["RELATÓRIO DE COMPRAS — " + MARCADOR], // linha de título antes do cabeçalho
  ["Processo", "Descrição do Objeto", "Setor Requisitante", "Empresa Vencedora", "Comprador Resp.", "Fase Atual", "Situação Atual", "Data Abertura", "Vigência Final", "Qtd Itens", "Valor Estimado R$", "Notas Gerais", "Endereço SP", "Coluna Livre"],
  ["PA-2025/001", "Aquisição de insumos de laboratório", "Pesquisa", "Labex Ltda", "Ana Souza", "Cotação", "Em andamento", "05/01/2026", "10/02/2030", "120", "1.234.567,89", "Urgente, conforme SEI 123", "https://sharepoint.interno/doc1", "texto livre A"],
  ["PA-2025/002", "Serviço de manutenção predial", "Facilities", "Construmais SA", "Bruno Lima", "Emissão de ata", "Em andamento", "12/01/2026", "15/02/2020", "3", "85.000,00", "", "https://sharepoint.interno/doc2", "texto livre B"],
  ["PA-2025/003", "Licenças de software", "TI", "", "Carla Roos", "Aguardando fornecedor", "Concluído", "20/12/2025", "01/01/2031", "1", "R$ 12.900,50", "renovação anual", "", "x"],
  ["PA-2025/004", "Uniformes e EPIs", "RH", "Protege EPI", "Ana Souza", "Cotação", "Cancelado", "02/01/2026", "30/06/2030", "500", "45.000", "", "", ""],
  ["", "Linha sem identificador deve ser ignorada", "RH", "", "", "", "", "", "", "5", "1.000", "", "", ""], // erro: sem número
  ["PA-2025/001", "Aquisição de insumos de laboratório", "Pesquisa", "Labex Ltda", "Ana Souza", "Cotação", "Em andamento", "05/01/2026", "10/02/2030", "120", "1.234.567,89", "duplicada", "https://sharepoint.interno/doc1", "dup"], // duplicada
  ["PA-2025/006", "Número ambíguo de itens", "TI", "", "", "", "", "05/01/2026", "10/02/2030", "3.054", "2.500,00", "3.054 deve virar 3054 com aviso", "", ""],
];

const wb = XLSX.utils.book_new();
const ws1 = XLSX.utils.aoa_to_sheet(linhasIndiretos);
XLSX.utils.book_append_sheet(wb, ws1, "Dados");
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Aba vazia"]]), "Resumo");
const xlsxB64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

// Converte as linhas em Record<header, value> simulando o que o cliente enviaria
function linhasParaObjetos(linhas, headerRowIdx) {
  const headers = linhas[headerRowIdx];
  return linhas.slice(headerRowIdx + 1).filter((r) => r.some((c) => c !== "" && c != null)).map((r) => {
    const o = {};
    headers.forEach((h, i) => (o[h] = r[i] ?? null));
    return o;
  });
}

const rowsIndiretos = linhasParaObjetos(linhasIndiretos, 1);
const mappingIndiretos = {
  numero: "Processo", objeto: "Descrição do Objeto", unidade: "Setor Requisitante",
  fornecedor: "Empresa Vencedora", responsavel: "Comprador Resp.", etapa: "Fase Atual",
  situacao: "Situação Atual", data_inicio: "Data Abertura", data_fim: "Vigência Final",
  quantidade: "Qtd Itens", valor: "Valor Estimado R$", observacao: "Notas Gerais", link: "Endereço SP",
};

// CSV ; com acentos e decimais por vírgula (texto simulando SheetJS)
const csvRows = [
  { "Nº da Ata": "ATA-77/2026", "Objeto": "Cromatógrafo gasoso — manutenção", "Responsável": "José Álvares", "Validade": "31/12/2030", "Valor (R$)": "10.500,75", "Qtd": "1", "Situação": "Em andamento" },
  { "Nº da Ata": "ATA-78/2026", "Objeto": "Autoclave vertical 75 L", "Responsável": "José Álvares", "Validade": "15/08/2025", "Valor (R$)": "92.300,00", "Qtd": "2", "Situação": "Em andamento" },
  { "Nº da Ata": "ATA-79/2026", "Objeto": "Água ultrapura tipo I — 5.000 L", "Responsável": "Maria Pinhão", "Validade": "20/09/2026", "Valor (R$)": "7.800,00", "Qtd": "10", "Situação": "" },
];
const mappingCsv = { numero: "Nº da Ata", objeto: "Objeto", responsavel: "Responsável", data_fim: "Validade", valor: "Valor (R$)", quantidade: "Qtd", situacao: "Situação" };

/* ------------------------------ testes ------------------------------ */

console.log("\n— Saúde e estado inicial —");
{
  const h = await (await fetch(`${BASE}/api/health`)).json();
  assert.equal(h.ok, true);
  ok("GET /api/health → ok");

  const d = await (await fetch(`${BASE}/api/dashboard`)).json();
  assert.equal(d.hasData, false);
  ok("Panorama vazio reporta hasData=false (sem números fictícios)");
}

console.log("\n— Importação XLSX (multi-abas, título antes do cabeçalho, BR) —");
let datasetId1;
{
  const payload = {
    fileName: `indiretos-${MARCADOR}.xlsx`, sheetName: "Dados", kind: "indiretos",
    natureza: "operacional", importMode: "replace", referenceDate: "2026-01-20",
    mapping: mappingIndiretos, rows: rowsIndiretos,
  };
  const v = await (await fetch(`${BASE}/api/import`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phase: "validate", ...payload }) })).json();
  assert.equal(v.resumo.validos, 5, `esperava 5 válidas, veio ${v.resumo.validos}`);
  assert.equal(v.resumo.ignoradas, 2, `esperava 2 ignoradas (1 obrigatória + 1 duplicada)`);
  assert.ok(v.resumo.avisos >= 1, "esperava aviso (3.054/ano/etc.)");
  ok(`validate: ${v.resumo.validos} válidas, ${v.resumo.ignoradas} ignoradas, ${v.resumo.avisos} avisos`);

  const c = await (await fetch(`${BASE}/api/import`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phase: "commit", ...payload }) })).json();
  assert.equal(c.ok, true);
  datasetId1 = c.datasetId;
  ok("commit: base indiretos gravada");

  const rec = (await (await fetch(`${BASE}/api/processos?q=PA-2025/001`)).json());
  assert.equal(rec.total, 1);
  const r = rec.rows[0];
  assert.equal(r.area, "Indiretos");
  assert.equal(r.valor, 1234567.89);
  assert.equal(r.quantidade, 120);
  assert.ok(r.extra && r.extra["Coluna Livre"] === "texto livre A", "coluna não mapeada preservada em extra");
  ok("registro gravado com área padrão, valor BR e coluna extra preservada");

  const amb = (await (await fetch(`${BASE}/api/processos?q=PA-2025/006`)).json());
  assert.equal(amb.rows[0].quantidade, 3054);
  ok("'3.054' interpretado como 3054 (milhar pt-BR) — aviso registrado no relatório");
}

console.log("\n— Importação CSV (; acentos, vírgula decimal) —");
let datasetId2;
{
  const payload = {
    fileName: `atas-capex-${MARCADOR}.csv`, sheetName: null, kind: "capex",
    natureza: "operacional", importMode: "replace", referenceDate: "2026-01-22",
    mapping: mappingCsv, rows: csvRows,
  };
  const c = await (await fetch(`${BASE}/api/import`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phase: "commit", ...payload }) })).json();
  assert.equal(c.ok, true);
  datasetId2 = c.datasetId;
  ok("commit: base capex gravada (3 linhas)");
}

console.log("\n— Panorama e consistência —");
{
  const d = await (await fetch(`${BASE}/api/dashboard`)).json();
  assert.equal(d.hasData, true);
  assert.equal(d.kpis.processos, 8);
  assert.equal(d.kpis.concluido, 1);
  assert.equal(d.kpis.cancelado, 1);
  assert.ok(d.porArea.some((a) => a.area === "CAPEX" && a.processos === 3));
  console.log(`  · vencidos=${d.kpis.vencido} a_vencer=${d.kpis.a_vencer} sem_data=${d.kpis.sem_data} valor=${d.kpis.valorTotal}`);
  ok("panorama soma as duas bases ativas (8 processos; 1 concluído; 1 cancelado)");
}

console.log("\n— Busca, filtros, ordenação, paginação —");
{
  const q = await (await fetch(`${BASE}/api/processos?q=CROMATÓGRAFO`)).json();
  assert.equal(q.total, 1, "busca deve ignorar acentos");
  const q2 = await (await fetch(`${BASE}/api/processos?q=cromatografo`)).json();
  assert.equal(q2.total, 1);
  ok("busca sem acento encontra texto acentuado (e vice-versa)");

  const f = await (await fetch(`${BASE}/api/processos?area=CAPEX&situacao=vencido`)).json();
  assert.ok(f.rows.every((r) => r.area === "CAPEX" && r.situacao === "vencido"));
  ok(`filtros combinados área+situação (${f.total} resultado(s))`);

  const s = await (await fetch(`${BASE}/api/processos?sort=valor&dir=desc&pageSize=10`)).json();
  const valores = s.rows.map((r) => r.valor ?? -1);
  assert.deepEqual(valores, [...valores].sort((a, b) => b - a));
  ok("ordenação por valor decrescente");

  const p1 = await (await fetch(`${BASE}/api/processos?pageSize=5&page=1`)).json();
  const p2 = await (await fetch(`${BASE}/api/processos?pageSize=5&page=2`)).json();
  assert.equal(p1.rows.length, 5);
  assert.equal(p2.rows.length, 3);
  assert.notDeepEqual(p1.rows.map((r) => r.id), p2.rows.map((r) => r.id));
  ok("paginação 5 por página (5 + 3)");

  const facets = await (await fetch(`${BASE}/api/processos?facets=1`)).json();
  assert.ok(facets.facets.areas.length >= 2 && facets.facets.etapas.length >= 1);
  ok("facetas de área e etapa disponíveis");
}

console.log("\n— Exportação CSV —");
{
  const res = await fetch(`${BASE}/api/processos/export?area=CAPEX`);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  assert.equal(res.headers.get("content-type").includes("text/csv"), true);
  assert.ok(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf, "BOM UTF-8 presente (Excel)");
  const text = new TextDecoder().decode(bytes.subarray(3));
  assert.ok(text.includes("ATA-77/2026") && !text.includes("PA-2025/001"));
  assert.ok(text.includes(";"));
  ok("CSV filtrado por área, com BOM e separador ';'");
}

console.log("\n— Documentos —");
{
  const c = await fetch(`${BASE}/api/documentos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titulo: `Manual ${MARCADOR}`, url: "https://sharepoint.interno/manual", categoria: "Manual", descricao: "doc de teste" }) });
  assert.equal(c.status, 201);
  const { documento } = await c.json();

  const bad = await fetch(`${BASE}/api/documentos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titulo: "x", url: "javascript:alert(1)" }) });
  assert.equal(bad.status, 400);

  const del = await fetch(`${BASE}/api/documentos?id=${documento.id}`, { method: "DELETE" });
  assert.equal(del.status, 200);
  ok("cadastro, validação de URL e exclusão de documento");
}

console.log("\n— Substituição de base (replace mantém histórico) —");
{
  const payload = {
    fileName: `indiretos-${MARCADOR}-v2.xlsx`, sheetName: "Dados", kind: "indiretos",
    natureza: "operacional", importMode: "replace", referenceDate: "2026-01-27",
    mapping: mappingIndiretos, rows: rowsIndiretos.slice(0, 2), // só 2 linhas
  };
  const c = await (await fetch(`${BASE}/api/import`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phase: "commit", ...payload }) })).json();
  assert.equal(c.ok, true);

  const ds = (await (await fetch(`${BASE}/api/datasets`)).json()).datasets;
  const inds = ds.filter((d) => d.kind === "indiretos");
  assert.equal(inds.filter((d) => d.status === "active").length, 1);
  assert.equal(inds.filter((d) => d.status === "superseded").length, 1);

  const d = await (await fetch(`${BASE}/api/dashboard`)).json();
  assert.equal(d.variacoes.length, 1);
  const v = d.variacoes[0];
  assert.equal(v.atual, 2); // 2 linhas válidas no arquivo v2
  assert.equal(v.anterior, 5);
  ok(`substituição arquiva a anterior e gera variação (${v.anterior} → ${v.atual})`);
}

console.log("\n— Limpeza (remove dados de teste) —");
{
  const ds = (await (await fetch(`${BASE}/api/datasets`)).json()).datasets;
  for (const d of ds) {
    if (d.file_name.includes(MARCADOR)) {
      await fetch(`${BASE}/api/datasets?id=${d.id}`, { method: "DELETE" });
    }
  }
  const d = await (await fetch(`${BASE}/api/dashboard`)).json();
  assert.equal(d.hasData, false);
  for (const id of [datasetId1, datasetId2]) {
    const r = await fetch(`${BASE}/api/datasets?id=${id}`, { method: "DELETE" }).catch(() => null);
    void r;
  }
  ok("ambiente de teste limpo (banco volta ao estado vazio)");
}

console.log(`\n✔ Todos os grupos de teste passaram (${passou} verificações).\n`);
