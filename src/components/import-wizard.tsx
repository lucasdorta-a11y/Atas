"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, CircleAlert, CircleCheckBig, Download, FileSpreadsheet,
  FileUp, Loader2, ShieldCheck, TriangleAlert,
} from "lucide-react";
import clsx from "clsx";
import { PageHeader, SectionTitle } from "@/components/ui";
import {
  parseMultipleFiles, ParseError, MAX_FILE_MB, type SheetTable, type SourceSheet
} from "@/lib/client-parse";
import { suggestMapping, type Suggestion } from "@/lib/mapping";
import {
  CANONICAL_FIELDS, KIND_LABEL, transformAndValidate,
  type DatasetKind, type DatasetNatureza, type ImportMode, type Issue, type Mapping, type ValidationResult,
} from "@/lib/domain";
import { buildCsv } from "@/lib/csv";
import { fmtCurrency, fmtInt, todayISO } from "@/lib/format";
import { notifyBaseUpdated } from "@/components/datasets-panel";
import { saveDataset } from "@/lib/static-store";
import {
  extractSnapshotPayload,
  hasSnapshotPayloadMeaningfulData,
  type DashboardSnapshotPayload,
} from "@/lib/dashboard-snapshot";

/* ------------------------------------------------------------------ */

const STEPS = [
  { n: 1, label: "Arquivo" },
  { n: 2, label: "Tipo de base" },
  { n: 3, label: "Colunas" },
  { n: 4, label: "Revisão" },
  { n: 5, label: "Concluído" },
];

interface ValidateResponse {
  ok: boolean;
  erro?: string;
  resumo?: {
    validos: number;
    ignoradas: number;
    duplicadas: number;
    avisos: number;
    valorTotal: number;
    itensTotal: number;
    valorCobertura: number;
    itensCobertura: number;
    issuesAmostra: Issue[];
    issuesTotal: number;
  };
  snapshotCoverage?: { found: string[]; missing: string[] };
  snapshotMeaningful?: boolean;
  datasetId?: number;
}

export function ImportWizard() {
  const [step, setStep] = useState(1);
  
  // Agora armazenamos a tabela combinada de TODOS os arquivos/abas selecionados
  const [combinedInfo, setCombinedInfo] = useState<{
    names: string[];
    filesCount: number;
    sheetsCount: number;
    combinedTable: SheetTable;
    sourceSheets: SourceSheet[];
  } | null>(null);
  
  const [parseErro, setParseErro] = useState<{ msg: string; code: string } | null>(null);
  const [lendo, setLendo] = useState(false);
  const [dragAtivo, setDragAtivo] = useState(false);

  const [kind, setKind] = useState<DatasetKind>("indiretos");
  const [natureza, setNatureza] = useState<DatasetNatureza>("operacional");
  const [importMode, setImportMode] = useState<ImportMode>("replace");
  const [referenceDate, setReferenceDate] = useState(todayISO());

  const [mapping, setMapping] = useState<Mapping>({});
  const [mappingTocado, setMappingTocado] = useState(false);

  const [validacao, setValidacao] = useState<ValidateResponse | null>(null);
  const [resultadoValidacao, setResultadoValidacao] = useState<ValidationResult | null>(null);
  const [resultadoSnapshot, setResultadoSnapshot] = useState<DashboardSnapshotPayload | null>(null);
  const [validando, setValidando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [erroEtapa, setErroEtapa] = useState<string | null>(null);
  const [avisoEstrutura, setAvisoEstrutura] = useState<string | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  // Foco no título a cada troca de etapa (orientação por teclado/leitor de tela)
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const announce = useCallback((msg: string) => {
    if (liveRef.current) liveRef.current.textContent = "";
    setTimeout(() => {
      if (liveRef.current) liveRef.current.textContent = msg;
    }, 60);
  }, []);

  /* ---------------- Leitura do arquivo ---------------- */

  const processarArquivos = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      if (files.length > 2) {
        setParseErro({ msg: "Selecione no máximo duas planilhas por lote. Faça uma nova importação para outros arquivos.", code: "estrutura" });
        announce("São permitidos no máximo dois arquivos por lote.");
        return;
      }
      setLendo(true);
      setParseErro(null);
      setValidacao(null);
      setErroEtapa(null);
      try {
        const info = await parseMultipleFiles(files);
        setCombinedInfo(info);
        setMappingTocado(false);
        announce(
          `${info.filesCount} arquivos lidos com sucesso. ${info.sheetsCount} abas processadas.`,
        );
      } catch (e) {
        setCombinedInfo(null);
        const pe = e instanceof ParseError ? e : null;
        setParseErro({ msg: pe?.message ?? "Falha inesperada ao ler os arquivos.", code: pe?.code ?? "estrutura" });
        announce("Não foi possível ler os arquivos.");
      } finally {
        setLendo(false);
      }
    },
    [announce],
  );

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragAtivo(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) processarArquivos(files);
  }

  /* ---------------- Tabela combinada ---------------- */

  const table: SheetTable | null = combinedInfo?.combinedTable ?? null;

  const suggestion: Suggestion | null = useMemo(
    () => (table ? suggestMapping(table.headers) : null),
    [table],
  );

  // Aplica a sugestão quando o arquivo/aba/cabeçalho muda (respeitando edições do usuário)
  useEffect(() => {
    if (!suggestion) return;
    if (!mappingTocado) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
      setMapping(suggestion.mapping);
      setAvisoEstrutura(null);
    } else {
      setAvisoEstrutura("A linha de cabeçalho mudou. Revise o mapeamento — suas escolhas foram mantidas.");
    }
  }, [suggestion, mappingTocado]);

  const obrigatoriosOk = Boolean(mapping.numero && mapping.objeto);

  /* ---------------- Validação local (GitHub Pages) ---------------- */

  const defaultArea = kind === "indiretos" ? "Indiretos" : kind === "diretos" ? "Diretos" : kind === "capex" ? "CAPEX" : null;
  const snapshotPreview = useMemo(
    () => combinedInfo
      ? extractSnapshotPayload(combinedInfo.sourceSheets, {
          fileNames: combinedInfo.names,
          referenceDate: referenceDate || null,
        })
      : null,
    [combinedInfo, referenceDate],
  );
  const snapshotMeaningful = hasSnapshotPayloadMeaningfulData(snapshotPreview);
  const canValidate = obrigatoriosOk || snapshotMeaningful;

  function resumoDaValidacao(result: ValidationResult) {
    return {
      validos: result.records.length,
      ignoradas: result.skipped,
      duplicadas: result.duplicates,
      avisos: result.warnings,
      valorTotal: result.records.reduce((sum, row) => sum + (row.valor ?? 0), 0),
      itensTotal: result.records.reduce((sum, row) => sum + (row.quantidade ?? 0), 0),
      valorCobertura: result.records.filter((row) => row.valor !== null).length,
      itensCobertura: result.records.filter((row) => row.quantidade !== null).length,
      issuesAmostra: result.issues.slice(0, 300),
      issuesTotal: result.issues.length,
    };
  }

  function validar() {
    if (!table || !combinedInfo) return;
    setValidando(true);
    setErroEtapa(null);
    try {
      const snapshot = extractSnapshotPayload(combinedInfo.sourceSheets, {
        fileNames: combinedInfo.names,
        referenceDate: referenceDate || null,
      });
      const result: ValidationResult = obrigatoriosOk
        ? transformAndValidate(table.rows, mapping, { defaultArea })
        : { records: [], issues: [], skipped: 0, duplicates: 0, warnings: 0 };
      const meaningful = hasSnapshotPayloadMeaningfulData(snapshot);
      if (result.records.length === 0 && !meaningful) {
        throw new Error("Nenhum registro operacional ou bloco específico do painel foi reconhecido. Revise os nomes exatos das colunas e o mapeamento.");
      }
      setResultadoValidacao(result);
      setResultadoSnapshot(snapshot);
      const resumo = resumoDaValidacao(result);
      setValidacao({
        ok: true,
        resumo,
        snapshotCoverage: snapshot.coverage,
        snapshotMeaningful: meaningful,
      });
      setStep(4);
      announce(
        `Validação concluída: ${resumo.validos.toLocaleString("pt-BR")} linhas operacionais e ${snapshot.coverage.found.length.toLocaleString("pt-BR")} blocos específicos reconhecidos.`,
      );
    } catch (e) {
      setErroEtapa(e instanceof Error ? e.message : "Falha ao validar os dados.");
      announce("Falha na validação.");
    } finally {
      setValidando(false);
    }
  }

  async function confirmar() {
    if (!combinedInfo || !table || !resultadoValidacao) return;
    const meaningfulSnapshot = hasSnapshotPayloadMeaningfulData(resultadoSnapshot);
    if (resultadoValidacao.records.length === 0 && !meaningfulSnapshot) return;
    setConfirmando(true);
    setErroEtapa(null);
    try {
      const dataset = await saveDataset({
        kind,
        natureza,
        fileName: combinedInfo.names.join(", ").slice(0, 290),
        sheetName: `${combinedInfo.sheetsCount} abas processadas`,
        referenceDate: referenceDate || null,
        importMode,
        rowCount: table.totalRows,
        result: resultadoValidacao,
        snapshot: meaningfulSnapshot ? resultadoSnapshot : null,
      });
      setValidacao((current) => current ? { ...current, datasetId: dataset.id } : current);
      setStep(5);
      notifyBaseUpdated();
      announce(`Importação concluída. ${resultadoValidacao.records.length.toLocaleString("pt-BR")} linhas operacionais e ${meaningfulSnapshot ? "leitura do painel" : "nenhum snapshot"} salvos neste navegador.`);
    } catch (e) {
      setErroEtapa(e instanceof Error ? e.message : "Falha ao salvar a importação neste navegador.");
      announce("Falha na importação.");
    } finally {
      setConfirmando(false);
    }
  }

  function baixarRelatorio() {
    if (!table) return;
    // Mesma validação do preview — aqui para gerar o relatório integral.
    const result = resultadoValidacao ?? (obrigatoriosOk
      ? transformAndValidate(table.rows, mapping, { defaultArea })
      : { records: [], issues: [], skipped: 0, duplicates: 0, warnings: 0 });
    const csv = buildCsv(
      ["Linha na planilha", "Coluna", "Tipo", "Ocorrência"],
      result.issues.map((i) => [i.row, i.column, i.severity === "error" ? "linha ignorada" : "aviso", i.message]),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-importacao.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function recomeçar() {
    setStep(1);
    setCombinedInfo(null);
    setParseErro(null);
    setValidacao(null);
    setResultadoValidacao(null);
    setResultadoSnapshot(null);
    setErroEtapa(null);
    setAvisoEstrutura(null);
    setMapping({});
    setMappingTocado(false);
    if (inputFileRef.current) inputFileRef.current.value = "";
  }

  /* ================================ RENDER */

  return (
    <>
      <PageHeader
        overline="Dados"
        title="Importar planilha"
        description={`Leia arquivos .xlsx, .xls ou .csv de até ${MAX_FILE_MB} MB. A leitura, a validação e o armazenamento acontecem no seu navegador — os dados ficam neste navegador após a sua confirmação.`}
      />

      <div ref={liveRef} role="status" aria-live="polite" className="sr-only" />

      {/* Passo a passo */}
      <nav aria-label="Etapas da importação" className="mb-6" data-no-print>
        <ol className="flex flex-wrap items-center gap-y-2">
          {STEPS.map((s, i) => {
            const estado = s.n < step ? "concluido" : s.n === step ? "atual" : "futuro";
            return (
              <li key={s.n} className="flex items-center">
                <span
                  aria-current={estado === "atual" ? "step" : undefined}
                  className={clsx(
                    "flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-semibold",
                    estado === "atual" && "bg-navy-900 text-white",
                    estado === "concluido" && "bg-ok-100 text-ok-700",
                    estado === "futuro" && "text-neutral-500",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={clsx(
                      "grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold",
                      estado === "atual" && "bg-accent-500 text-white",
                      estado === "concluido" && "bg-ok-600 text-white",
                      estado === "futuro" && "bg-neutral-100 text-neutral-500",
                    )}
                  >
                    {estado === "concluido" ? <CircleCheckBig size={12} /> : s.n}
                  </span>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && <span aria-hidden="true" className="mx-1.5 h-px w-5 bg-line sm:w-8" />}
              </li>
            );
          })}
        </ol>
      </nav>

      <h2 ref={headingRef} tabIndex={-1} className="sr-only">
        Etapa {step} de 5 — {STEPS[step - 1].label}
      </h2>

      {/* =============== ETAPA 1: ARQUIVO =============== */}
      {step === 1 && (
        <section aria-label="Escolha do arquivo" className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragAtivo(true);
            }}
            onDragLeave={() => setDragAtivo(false)}
            onDrop={onDrop}
            className={clsx(
              "card flex flex-col items-center justify-center gap-3 border-2 border-dashed px-6 py-14 text-center transition-colors sm:py-20",
              dragAtivo ? "border-accent-500 bg-accent-50" : "border-navy-200 bg-navy-50/40",
            )}
          >
            <span aria-hidden="true" className="grid h-16 w-16 place-items-center rounded-2xl bg-surface text-navy-600 shadow-[var(--shadow-card)]">
              {lendo ? <Loader2 size={30} className="animate-spin" /> : <FileUp size={30} />}
            </span>
            <p className="font-display text-[18px] font-bold text-navy-950">
              {lendo ? "Lendo arquivos…" : "Arraste as planilhas para cá (até 2)"}
            </p>
            <p className="max-w-md text-[13.5px] leading-relaxed text-ink-soft">
              Todas as abas com dados serão lidas e combinadas automaticamente.
              Formatos aceitos: <strong>.xlsx</strong>, <strong>.xls</strong> e <strong>.csv</strong>.
            </p>
            <button
              type="button"
              onClick={() => inputFileRef.current?.click()}
              disabled={lendo}
              className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent-600 px-5 text-[14px] font-semibold text-white transition-colors hover:bg-accent-700 disabled:opacity-60"
            >
              <FileSpreadsheet size={17} aria-hidden="true" />
              Selecionar arquivos
            </button>
            <input
              ref={inputFileRef}
              type="file"
              multiple
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              aria-label="Selecionar arquivos Excel ou CSV"
              onChange={(e) => {
                const f = Array.from(e.target.files || []);
                if (f.length > 0) processarArquivos(f);
              }}
            />
          </div>

          {parseErro && (
            <div className="card flex items-start gap-3 border-danger-600/30 bg-danger-100/40 p-5" role="alert">
              <CircleAlert size={20} className="mt-0.5 shrink-0 text-danger-700" aria-hidden="true" />
              <div>
                <p className="text-[14.5px] font-bold text-danger-700">Não foi possível usar os arquivos</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-danger-700/90">{parseErro.msg}</p>
              </div>
            </div>
          )}

          {combinedInfo && (
            <div className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-xl bg-ok-100 text-ok-700">
                    <FileSpreadsheet size={20} />
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-navy-950">{combinedInfo.filesCount} {combinedInfo.filesCount === 1 ? 'arquivo selecionado' : 'arquivos selecionados'}</p>
                    <p className="mt-0.5 text-[12.5px] text-ink-soft">
                      {combinedInfo.names.join(", ")}
                    </p>
                    <p className="mt-1 text-[12.5px] font-medium text-navy-600">
                      {fmtInt(combinedInfo.combinedTable.totalRows)} linhas identificadas em {combinedInfo.sheetsCount} abas válidas.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={recomeçar}
                  className="min-h-9 rounded-lg border border-line px-3 text-[12.5px] font-semibold text-navy-800 hover:bg-navy-50"
                >
                  Trocar arquivos
                </button>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-navy-900 px-5 text-[14px] font-semibold text-white transition-colors hover:bg-navy-700"
                >
                  Continuar
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* =============== ETAPA 2: TIPO DE BASE =============== */}
      {step === 2 && combinedInfo && (
        <section aria-label="Tipo de base" className="space-y-5">
          <fieldset className="card p-5">
            <legend className="text-[12.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">
              A qual área esta base pertence?
            </legend>
            <p className="mt-1 text-[13px] text-ink-soft">
              Se a planilha tiver uma coluna de área, ela poderá ser mapeada na próxima etapa e prevalece linha a linha.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(Object.keys(KIND_LABEL) as DatasetKind[]).map((k) => (
                <RadioCard
                  key={k}
                  name="kind"
                  checked={kind === k}
                  onChange={() => setKind(k)}
                  title={KIND_LABEL[k]}
                  desc={
                    k === "indiretos" ? "Materiais e serviços indiretos (administrativo, TI, facilities…)"
                    : k === "diretos" ? "Materiais e insumos ligados à produção e pesquisa"
                    : k === "capex" ? "Investimentos: equipamentos, obras e infraestrutura"
                    : "Base geral, sem distinção de área"
                  }
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="card p-5">
            <legend className="text-[12.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">
              Qual a natureza desta base?
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <RadioCard
                name="natureza"
                checked={natureza === "operacional"}
                onChange={() => setNatureza("operacional")}
                title="Base operacional detalhada"
                desc="Planilha de trabalho do dia a dia, com todos os campos de acompanhamento."
              />
              <RadioCard
                name="natureza"
                checked={natureza === "snapshot"}
                onChange={() => setNatureza("snapshot")}
                title="Snapshot semanal"
                desc="Fotografia consolidada de uma data (ex.: relatório semanal). Escopo e campos podem diferir da base operacional."
              />
            </div>
            {natureza === "snapshot" && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-warn-100/60 px-4 py-3 text-[12.5px] leading-relaxed text-warn-700">
                <TriangleAlert size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                Snapshots não são misturados silenciosamente: o painel sinaliza quando bases de naturezas
                diferentes estiverem ativas ao mesmo tempo.
              </p>
            )}
          </fieldset>

          <div className="grid gap-5 lg:grid-cols-2">
            <fieldset className="card p-5">
              <legend className="text-[12.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">
                Como tratar a base atual?
              </legend>
              <div className="mt-3 space-y-2">
                <RadioCard
                  name="modo"
                  checked={importMode === "replace"}
                  onChange={() => setImportMode("replace")}
                  title="Substituir a base ativa desta área"
                  desc="A base anterior fica arquivada como “substituída” (auditoria e comparação de variação) e sai dos indicadores."
                />
                <RadioCard
                  name="modo"
                  checked={importMode === "combine"}
                  onChange={() => setImportMode("combine")}
                  title="Combinar com as bases ativas"
                  desc="Soma os registros às bases existentes. Use apenas se os arquivos cobrirem recortes diferentes."
                />
              </div>
            </fieldset>

            <div className="card p-5">
              <label htmlFor="ref-date" className="text-[12.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">
                Data de referência da base
              </label>
              <input
                id="ref-date"
                type="date"
                value={referenceDate}
                onChange={(e) => setReferenceDate(e.target.value)}
                className="mt-2.5 min-h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[14px] text-ink"
                aria-describedby="ref-hint"
              />
              <p id="ref-hint" className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
                Data em que a planilha foi gerada na origem (ex.: data do snapshot). Ela identifica a base no painel e
                nas comparações. O cálculo de vencidos/a vencer usa sempre a data de hoje.
              </p>
            </div>
          </div>

          <WizardNav
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            nextLabel="Mapear colunas"
          />
        </section>
      )}

      {/* =============== ETAPA 3: MAPEAMENTO =============== */}
      {step === 3 && combinedInfo && table && suggestion && (
        <section aria-label="Mapeamento de colunas" className="space-y-4">
          <div className="card p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-[14.5px] font-bold text-navy-950">
                  Mapeamento de Colunas Unificado
                </h3>
                <p className="mt-0.5 text-[12.5px] text-ink-soft">
                  As colunas de todas as abas foram combinadas. Aponte cada informação para a sua respectiva coluna nas planilhas.
                </p>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] text-ink-soft">
              {fmtInt(table.totalRows)} linhas unidas · {table.headers.length} colunas únicas.
              Colunas não associadas ficarão salvas nos detalhes de cada registro (não serão perdidas).
            </p>
          </div>

          <div className="card border-navy-200 bg-navy-50/70 p-5" aria-label="Mapeamento específico das tabelas do dashboard">
            <h3 className="text-[14.5px] font-bold text-navy-950">Leitura específica do painel</h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">
              Além do mapeamento operacional abaixo, o Giro de Atas procura somente os nomes exatos da planilha para montar o snapshot semanal. Nenhuma coluna parecida é usada por inferência.
            </p>
            <ul className="mt-3 grid gap-2 text-[12px] leading-relaxed text-ink sm:grid-cols-2">
              <li><strong>Leitura dos gráficos:</strong> <code>Gráfico</code>, <code>Situação apresentada</code>, <code>ATAS</code>, <code>ITENS</code>.</li>
              <li><strong>Valores:</strong> <code>VALOR DIRETOS</code>, <code>VALOR INDIRETOS</code>, <code>VALOR CAPEX</code>.</li>
              <li><strong>Saving:</strong> <code>Rótulos de Linha</code> (CAPEX/DIRETOS/INDIRETOS/TOTAL), <code>VALOR CONTRATADO R$</code>, <code>SAVING HISTÓRICO R$</code>, <code>SAVING PROPOSTA INICIAL R$</code>, reduções.</li>
              <li><strong>Compradores:</strong> <code>TOP COMP INDIRETOS</code>, <code>TOP COMP DIRETOS</code>, <code>TOP COMP CAPEX</code>, <code>ITENS</code>, <code>ATAS</code>.</li>
              <li><strong>Fornecedores:</strong> <code>FORNECEDOR</code>, <code>QTD ATAS</code>, <code>QTD ITENS</code>, <code>% CONCENTRAÇÃO DE ITENS</code>, <code>ANÁLISE</code>.</li>
              <li><strong>Evolução:</strong> <code>ATA INDIRETOS</code>, <code>ATA DIRETOS</code>, <code>ATA CAPEX</code>, <code>ITEM SALDO V ...</code>, <code>ITEM S/SALDO ...</code>, <code>VENCIDAS ...</code>, <code>A VENCER ...</code>.</li>
              <li><strong>Previsões:</strong> em outra planilha, <code>COMPRADOR</code>, <code>AREA</code>, <code>PRAZO CONCLUSÃO</code>.</li>
            </ul>
            {snapshotPreview && (
              <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-[12px] font-semibold text-navy-700" role="status">
                Blocos reconhecidos nesta leitura: {snapshotPreview.coverage.found.length ? snapshotPreview.coverage.found.join(", ") : "nenhum ainda"}.
              </p>
            )}
          </div>

          {avisoEstrutura && (
            <div className="card flex items-start gap-2.5 border-warn-600/30 bg-warn-100/50 p-4 text-[13px] leading-relaxed text-warn-700" role="status">
              <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {avisoEstrutura}
            </div>
          )}

          <div className="card overflow-hidden">
            <ul className="divide-y divide-line/70">
              {CANONICAL_FIELDS.map((f) => {
                const selecionada = mapping[f.key] ?? "";
                const confianca = suggestion.confidence[f.key];
                const amostras = selecionada
                  ? [...new Set(table.rows.slice(0, 60).map((r) => r[selecionada]).filter((v) => v !== null && v !== undefined && String(v).trim() !== "").map((v) => (v instanceof Date ? v.toLocaleDateString("pt-BR") : String(v))))].slice(0, 3)
                  : [];
                return (
                  <li key={f.key} className="grid gap-2 px-5 py-4 md:grid-cols-[240px_1fr] md:items-center md:gap-5">
                    <div>
                      <p className="text-[13.5px] font-bold text-ink">
                        {f.label}
                        {f.required && (
                          <span className="ml-1.5 rounded bg-accent-100 px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-accent-700">
                            obrigatório
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[12px] text-ink-soft">{f.hint}</p>
                      {confianca === "partial" && selecionada && (
                        <p className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-semibold text-warn-700">
                          <TriangleAlert size={12} aria-hidden="true" />
                          Sugestão aproximada — confira
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor={`map-${f.key}`} className="sr-only">
                        Coluna da planilha para {f.label}
                      </label>
                      <select
                        id={`map-${f.key}`}
                        value={selecionada}
                        onChange={(e) => {
                          setMappingTocado(true);
                          setMapping((m) => ({ ...m, [f.key]: e.target.value || null }));
                        }}
                        className={clsx(
                          "min-h-11 w-full rounded-xl border bg-surface px-3 text-[13.5px] font-medium text-ink",
                          f.required && !selecionada ? "border-danger-600/60 bg-danger-100/20" : "border-line",
                        )}
                        aria-invalid={f.required && !selecionada}
                      >
                        <option value="">— não importar este campo —</option>
                        {table.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      {amostras.length > 0 && (
                        <p className="mt-1.5 truncate text-[12px] text-ink-soft" title={amostras.join(" · ")}>
                          <span className="font-semibold">Exemplos:</span> {amostras.join(" · ")}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {!canValidate && (
            <div className="card flex items-start gap-2.5 border-danger-600/30 bg-danger-100/40 p-4 text-[13px] leading-relaxed text-danger-700" role="alert">
              <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              Para continuar, associe os campos obrigatórios de uma base operacional ou forneça uma planilha com os blocos específicos e nomes exatos do painel.
            </div>
          )}
          {canValidate && !obrigatoriosOk && snapshotMeaningful && (
            <div className="card flex items-start gap-2.5 border-ok-600/30 bg-ok-100/60 p-4 text-[13px] leading-relaxed text-ok-700" role="status">
              <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              Blocos do dashboard reconhecidos. O mapeamento operacional é opcional para uma importação somente de métricas; os registros de processos não serão criados.
            </div>
          )}

          <WizardNav
            onBack={() => setStep(2)}
            onNext={validar}
            nextLabel={validando ? "Validando…" : "Validar dados"}
            nextDisabled={!canValidate || validando}
            nextBusy={validando}
          />
          {erroEtapa && (
            <p className="card border-danger-600/30 bg-danger-100/40 p-4 text-[13px] font-semibold text-danger-700" role="alert">
              {erroEtapa}
            </p>
          )}
        </section>
      )}

      {/* =============== ETAPA 4: REVISÃO =============== */}
      {step === 4 && combinedInfo && validacao?.resumo && (
        <section aria-label="Revisão da importação" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Linhas válidas" value={fmtInt(validacao.resumo.validos)} tone="ok" />
            <Stat label="Ignoradas (obrigatórios/duplic.)" value={fmtInt(validacao.resumo.ignoradas)} tone={validacao.resumo.ignoradas > 0 ? "warn" : "neutral"} />
            <Stat label="Duplicadas removidas" value={fmtInt(validacao.resumo.duplicadas)} tone={validacao.resumo.duplicadas > 0 ? "warn" : "neutral"} />
            <Stat label="Avisos de interpretação" value={fmtInt(validacao.resumo.avisos)} tone={validacao.resumo.avisos > 0 ? "navy" : "neutral"} />
          </div>

          <div className="card p-5">
            <SectionTitle title="Resumo do que será importado" />
            <dl className="grid gap-x-8 gap-y-3 text-[13.5px] sm:grid-cols-2">
              <ResumoItem label="Arquivos">{combinedInfo.names.join(", ")} ({combinedInfo.sheetsCount} abas)</ResumoItem>
              <ResumoItem label="Base">{KIND_LABEL[kind]} · {natureza === "snapshot" ? "snapshot semanal" : "base operacional"}</ResumoItem>
              <ResumoItem label="Modo">{importMode === "replace" ? `Substituir a base ativa de ${KIND_LABEL[kind]} (a atual vai para o histórico)` : "Combinar com as bases ativas"}</ResumoItem>
              <ResumoItem label="Data de referência">{referenceDate ? referenceDate.split("-").reverse().join("/") : "—"}</ResumoItem>
              <ResumoItem label="Valor estimado total">
                {fmtCurrency(validacao.resumo.valorTotal)}{" "}
                <span className="text-ink-soft">(presente em {fmtInt(validacao.resumo.valorCobertura)} linhas)</span>
              </ResumoItem>
              <ResumoItem label="Itens">
                {fmtInt(validacao.resumo.itensTotal)}{" "}
                <span className="text-ink-soft">(presente em {fmtInt(validacao.resumo.itensCobertura)} linhas)</span>
              </ResumoItem>
              <ResumoItem label="Blocos específicos do dashboard">
                {validacao.snapshotCoverage?.found.length ?? 0} reconhecidos
                {validacao.snapshotCoverage?.found.length ? <span className="text-ink-soft"> · {validacao.snapshotCoverage.found.join(", ")}</span> : null}
              </ResumoItem>
            </dl>
          </div>

          {validacao.resumo.issuesTotal > 0 ? (
            <div className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                <div>
                  <h3 className="text-[14.5px] font-bold text-navy-950">Ocorrências encontradas na validação</h3>
                  <p className="mt-0.5 text-[12.5px] text-ink-soft">
                    Mostrando {fmtInt(Math.min(validacao.resumo.issuesAmostra.length, 60))} de{" "}
                    {fmtInt(validacao.resumo.issuesTotal)}. Baixe o relatório para ver todas — nada é ocultado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={baixarRelatorio}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line px-4 text-[13px] font-semibold text-navy-800 transition-colors hover:bg-navy-50"
                >
                  <Download size={15} aria-hidden="true" />
                  Relatório completo (CSV)
                </button>
              </div>
              <div className="max-h-[380px] overflow-y-auto">
                <table className="w-full text-[13px]">
                  <caption className="sr-only">Ocorrências de validação (amostra)</caption>
                  <thead className="sticky top-0 bg-navy-50">
                    <tr className="border-b border-line text-left">
                      <th scope="col" className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft">Linha</th>
                      <th scope="col" className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft">Tipo</th>
                      <th scope="col" className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft">Coluna</th>
                      <th scope="col" className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft">Ocorrência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validacao.resumo.issuesAmostra.slice(0, 60).map((i, idx) => (
                      <tr key={idx} className="border-b border-line/60 last:border-0">
                        <td className="tnum px-4 py-2.5 font-semibold text-ink">{fmtInt(i.row)}</td>
                        <td className="px-4 py-2.5">
                          {i.severity === "error" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-100 px-2.5 py-1 text-[11.5px] font-semibold text-danger-700">
                              <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-danger-600" />
                              linha ignorada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-100 px-2.5 py-1 text-[11.5px] font-semibold text-warn-700">
                              <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-warn-600" />
                              aviso — linha mantida
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-ink">{i.column}</td>
                        <td className="px-4 py-2.5 leading-snug text-ink">{i.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card flex items-start gap-3 border-ok-600/30 bg-ok-100/60 p-5" role="status">
              <ShieldCheck size={20} className="mt-0.5 shrink-0 text-ok-700" aria-hidden="true" />
              <p className="text-[13.5px] leading-relaxed text-ok-700">
                {validacao.resumo.validos === 0 && validacao.snapshotMeaningful
                  ? "Nenhuma linha operacional foi criada; a validação reconheceu somente os blocos específicos do snapshot."
                  : "Nenhuma ocorrência: todos os campos obrigatórios estão preenchidos, sem duplicidades e sem avisos de interpretação."}
              </p>
            </div>
          )}

          {validacao.resumo.validos === 0 && !validacao.snapshotMeaningful && (
            <div className="card border-danger-600/30 bg-danger-100/40 p-5 text-[13.5px] font-semibold text-danger-700" role="alert">
              Nenhuma linha válida para importar. Volte e ajuste o mapeamento ou corrija a planilha na origem.
            </div>
          )}
          {validacao.resumo.validos === 0 && validacao.snapshotMeaningful && (
            <div className="card border-ok-600/30 bg-ok-100/60 p-5 text-[13.5px] font-semibold text-ok-700" role="status">
              Esta importação contém somente métricas/tabelas do dashboard. Os blocos reconhecidos serão salvos como snapshot e não exigem identificador de processo.
            </div>
          )}

          {erroEtapa && (
            <p className="card border-danger-600/30 bg-danger-100/40 p-4 text-[13px] font-semibold text-danger-700" role="alert">
              {erroEtapa}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-[13.5px] font-semibold text-navy-800 transition-colors hover:bg-navy-50"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Voltar ao mapeamento
            </button>
            <button
              type="button"
              onClick={confirmar}
              disabled={confirmando || (validacao.resumo.validos === 0 && !validacao.snapshotMeaningful)}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent-600 px-6 text-[14.5px] font-bold text-white transition-colors hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-describedby="confirm-hint"
            >
              {confirmando ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}
              {confirmando ? "Importando…" : `Confirmar importação${validacao.resumo.validos > 0 ? ` de ${fmtInt(validacao.resumo.validos)} linhas` : " do snapshot"}`}
            </button>
          </div>
          <p id="confirm-hint" className="text-right text-[12px] text-ink-soft">
            {importMode === "replace"
              ? `A base ativa de ${KIND_LABEL[kind]} será substituída (mantida no histórico).`
              : "As linhas serão somadas às bases ativas."}{" "}
            A gravação local é atômica: ou o dataset é salvo completo, ou nada é alterado.
          </p>
        </section>
      )}

      {/* =============== ETAPA 5: SUCESSO =============== */}
      {step === 5 && validacao?.resumo && (
        <section aria-label="Importação concluída">
          <div className="card flex flex-col items-center gap-4 px-6 py-12 text-center sm:py-16" role="status">
            <span aria-hidden="true" className="grid h-16 w-16 place-items-center rounded-full bg-ok-100 text-ok-700">
              <CircleCheckBig size={32} />
            </span>
            <h2 className="font-display text-[22px] font-bold text-navy-950">Importação concluída</h2>
            <p className="max-w-lg text-[14px] leading-relaxed text-ink-soft">
              <strong className="tnum text-ink">{fmtInt(validacao.resumo.validos)}</strong> registros operacionais foram
              processados e agora alimentam os indicadores e a busca.
              {validacao.snapshotMeaningful && (
                <> Os blocos específicos do dashboard também foram salvos como snapshot local.</>
              )}
              {validacao.resumo.ignoradas > 0 && (
                <>
                  {" "}
                  <strong className="tnum text-ink">{fmtInt(validacao.resumo.ignoradas)}</strong> linhas foram ignoradas
                  e estão listadas no relatório — corrija na origem e reimporte se necessário.
                </>
              )}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="/"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-navy-900 px-5 text-[14px] font-semibold text-white transition-colors hover:bg-navy-700"
              >
                Ver panorama atualizado
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                href="/processos"
                className="inline-flex min-h-11 items-center rounded-xl border border-line bg-surface px-5 text-[14px] font-semibold text-navy-800 transition-colors hover:bg-navy-50"
              >
                Pesquisar processos
              </Link>
              <button
                type="button"
                onClick={recomeçar}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-5 text-[14px] font-semibold text-navy-800 transition-colors hover:bg-navy-50"
              >
                <FileUp size={16} aria-hidden="true" />
                Importar outro arquivo
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

function WizardNav({
  onBack,
  onNext,
  nextLabel,
  nextDisabled = false,
  nextBusy = false,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  nextBusy?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-[13.5px] font-semibold text-navy-800 transition-colors hover:bg-navy-50"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-navy-900 px-5 text-[14px] font-semibold text-white transition-colors hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {nextBusy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
        {nextLabel}
        {!nextBusy && <ArrowRight size={16} aria-hidden="true" />}
      </button>
    </div>
  );
}

function RadioCard({
  name, checked, onChange, title, desc,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  desc: string;
}) {
  return (
    <label
      className={clsx(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
        checked ? "border-navy-500 bg-navy-50" : "border-line hover:border-navy-300",
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-1 h-4 w-4 accent-[#c95a12]" />
      <span>
        <span className="block text-[14px] font-bold text-ink">{title}</span>
        <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-soft">{desc}</span>
      </span>
    </label>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "ok" | "warn" | "neutral" | "navy" }) {
  return (
    <div className="card p-4">
      <p
        className={clsx(
          "tnum font-display text-[24px] font-bold tracking-tight sm:text-[28px]",
          tone === "ok" && "text-ok-700",
          tone === "warn" && "text-warn-700",
          tone === "navy" && "text-navy-700",
          tone === "neutral" && "text-navy-950",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[12px] font-semibold leading-snug text-ink-soft">{label}</p>
    </div>
  );
}

function ResumoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">{label}</dt>
      <dd className="text-[13.5px] font-medium text-ink">{children}</dd>
    </div>
  );
}
