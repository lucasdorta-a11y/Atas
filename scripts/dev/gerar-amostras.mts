/**
 * Gera planilhas fictícias com o layout dos blocos do painel.
 * Os nomes e números são deliberadamente inventados e ficam em amostras/,
 * pasta ignorada pelo Git; servem apenas para exercitar extrair/dry-run.
 */
import { mkdirSync } from "node:fs";
import * as XLSX from "xlsx";

const output = "amostras";
mkdirSync(output, { recursive: true });

type Matrix = unknown[][];

const resumo = (current: boolean): Matrix => [
  ["LEITURA DOS GRÁFICOS"],
  ["Gráfico", "Situação apresentada", "ATAS", "ITENS"],
  ["ATA CONCLUÍDAS (VÁLIDAS)", "VÁLIDAS", current ? 62 : 58, current ? 1020 : 956],
  ["ITENS COM SALDOS E CONSUMIDOS (VÁLIDOS)", "COM SALDO", 0, current ? 920 : 877],
  ["ITENS COM SALDOS E CONSUMIDOS (VÁLIDOS)", "CONSUMIDOS", 0, current ? 95 : 80],
  ["ATAS VENCIDAS E A VENCER", "A VENCER (RENOVAR)", current ? 61 : 58, current ? 1300 : 1215],
  ["ATAS VENCIDAS E A VENCER", "VENCIDAS", current ? 45 : 48, current ? 315 : 334],
  ["ATAS EM ANDAMENTO (GERAL)", current ? 72 : 68, current ? 4980 : 4778],
  ["VALOR INDIRETOS", 125000],
  ["VALOR DIRETOS", 240000],
  ["VALOR CAPEX", 310000],
  ["Rótulos de Linha", "VALOR CONTRATADO R$", "SAVING HISTÓRICO R$", "SAVING PROPOSTA INICIAL R$", "REDUÇÃO HISTÓRICO %", "REDUÇÃO PROPOSTA INICIAL %"],
  ["INDIRETOS", 125000, 12500, 19000, "10%", "15,2%"],
  ["DIRETOS", 240000, 24000, 36000, "10%", "15%"],
  ["CAPEX", 310000, 31000, 46500, "10%", "15%"],
  ["TOTAL", 675000, 67500, 101500, "10%", "15%"],
  ["TOP COMP INDIRETOS", "ITENS", "ATAS", "TOTAL ATAS ÁREA", "TOP COMP DIRETOS", "ITENS", "ATAS", "TOTAL ATAS ÁREA", "TOP COMP CAPEX", "ITENS", "ATAS", "TOTAL ATAS ÁREA"],
  ["ANA SILVA", 320, 12, 25, "BRUNO LIMA", 410, 14, 31, "CARLA SOUZA", 280, 8, 18],
  ["DIEGO COSTA", 220, 8, 25, "ELISA ROCHA", 300, 10, 31, "FABIO ALVES", 180, 6, 18],
  ["FORNECEDORES GERAL"],
  ["FORNECEDOR", "QTD ATAS", "QTD ITENS", "% CONCENTRAÇÃO DE ITENS", "ANÁLISE"],
  ["ACME MATERIAL", 12, 160, "22%", "Alta Concentração"],
  ["BETA SERVIÇOS", 9, 110, "15%", "Alta Concentração"],
  ["GAMA INDUSTRIAL", 7, 90, "12%", "Volume Médio"],
  ["DELTA TECNOLOGIA", 5, 70, "9%", "Volume Médio"],
  ["OUTROS FORNECEDORES", 4, 50, "7%", "Pulverizado"],
  ["TOTAL", 37, 480, "100%", null],
  ["ATA INDIRETOS", "ATA DIRETOS", "ATA CAPEX"],
  ["QTD ATAS", "QTD ATAS", "QTD ATAS"],
  [12, 14, 8],
  ["QTD ITENS", "QTD ITENS", "QTD ITENS"],
  [320, 410, 280],
  ["EVOLUÇÃO POR ÁREA (EM ANDAMENTO)"],
  ["Rótulos de Linha", "QTD ATAS", "QTD ITENS"],
  ["INDIRETOS", 25, 700],
  ["DIRETOS", 31, 900],
  ["CAPEX", 18, 500],
  ["PREVISÃO DE CONCLUSÃO POR FAIXA"],
  ["INDIRETOS", null, "DIRETOS", null, "CAPEX"],
  ["Rótulos de Linha", "QTD ATAS", "QTD ITENS", "QTD ATAS", "QTD ITENS", "QTD ATAS", "QTD ITENS"],
  ["ATÉ 15 DIAS", 3, 40, 4, 60, 2, 25],
  ["ATÉ 30 DIAS", 5, 70, 6, 90, 3, 35],
  ["ATÉ 60 DIAS", 7, 100, 8, 120, 4, 55],
  ["ACIMA DE 60 DIAS", 9, 140, 10, 160, 5, 70],
  ["PREVISÕES VENCIDAS", 2, 30, 3, 45, 1, 12],
  ["PREVISÃO DE CONCLUSÃO POR MÊS"],
  ["INDIRETOS", null, "DIRETOS", null, "CAPEX"],
  ["Rótulos de Linha", "QTD ATAS", "QTD ITENS", "QTD ATAS", "QTD ITENS", "QTD ATAS", "QTD ITENS"],
  ["Outubro", 2, 25, 3, 40, 1, 15],
  ["Novembro", 4, 60, 5, 75, 2, 30],
  ["Dezembro", 6, 90, 7, 110, 3, 45],
  ["Vencida/Sem Previsão", 2, 30, 3, 45, 1, 12],
];

const andamento = (current: boolean): Matrix => [
  ["DESCRIÇÃO DOS LOTES ATAS", "QTD ITENS", "COMPRADOR", "AREA", "ETAPA ATUAL", "N° CONTRATO", "ESTIMATIVA VALOR TOTAL"],
  ["Kit de vidraria", 40, "ANA SILVA", "INDIRETOS", current ? "FINALIZADO" : "EM ANDAMENTO", "4600001001", 12000],
  ["Reagentes de laboratório", 60, "BRUNO LIMA", "DIRETOS", "FINALIZADO", "4600001002", 24000],
  ["Serviço de calibração", 25, "CARLA SOUZA", "CAPEX", current ? "FINALIZADA" : "EM ANDAMENTO", "4600001003", 18000],
];

const contratos: Matrix = [
  ["Contrato", "Item", "Fornecedor"],
  ["4600001001", "Material A", "ACME MATERIAL (1000411)"],
  ["4600001002", "Material B", "BETA SERVIÇOS (1000412)"],
  ["4600001003", "Material C", "GAMA INDUSTRIAL (1000413)"],
];

const cruzamento: Matrix = [
  ["COMPRADOR", "AREA", "PRAZO CONCLUSÃO", "QTD ATAS", "QTD ITENS"],
  ["ANA SILVA", "INDIRETOS", "15/10/2026", 1, 10],
  ["BRUNO LIMA", "DIRETOS", "20/11/2026", 2, 20],
  ["CARLA SOUZA", "CAPEX", "31/01/2027", 3, 30],
];

const statusAtas = (): Matrix => {
  const area = (name: string, base: string, offset: number): Matrix => [
    [name],
    [`${name} | Status das Atas`],
    [`Carteira da área e ações prioritárias | Base: ${base}`],
    ["10 TOTAL", "8 VIGENTES", "2 VENCIDAS", "3 ATÉ 15 DIAS", "4 16 A 30 DIAS", "1 A RENOVAR"],
    ["CONTRATO SAP", "VENCIMENTO", "COMPRADOR(A)"],
    [`460000${2000 + offset}`, "20/10/2026", "ANA SILVA"],
    [`460000${2001 + offset}`, "05/11/2026", "BRUNO LIMA"],
    ["COMPRADOR(A)", "VIG.", "VENC.", "A RENOVAR", "TOTAL"],
    ["ANA SILVA", 4, 1, 1, 5],
    ["BRUNO LIMA", 3, 1, 0, 4],
    ["TOTAL", 7, 2, 1, 9],
    ["4 atas adicionais vencem entre 31 e 60 dias."],
  ];
  return [...area("INDIRETOS", "13/10/2026", 0), ...area("DIRETOS", "13/10/2026", 10), ...area("CAPEX", "13/10/2026", 20)];
};

function makeWorkbook(current: boolean) {
  const workbook = XLSX.utils.book_new();
  for (const [name, matrix] of [
    ["Resumo semanal", resumo(current)],
    ["Base - Atas Em andamento", andamento(current)],
    ["Base - Controle de Contratos", contratos],
    ["Base - Cruzamento por comprador", cruzamento],
    ["Status das Atas", statusAtas()],
  ] as Array<[string, Matrix]>) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(matrix), name);
  }
  return workbook;
}

XLSX.writeFile(makeWorkbook(true), `${output}/semana-atual.xlsx`);
XLSX.writeFile(makeWorkbook(false), `${output}/semana-anterior.xlsx`);
console.log(`Amostras geradas em ${output}/semana-atual.xlsx e ${output}/semana-anterior.xlsx.`);
