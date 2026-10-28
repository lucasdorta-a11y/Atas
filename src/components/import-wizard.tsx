"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  CircleCheckBig,
  Download,
  FileSpreadsheet,
  FileUp,
  Loader2,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import clsx from "clsx";
import { PageHeader, SectionTitle } from "@/components/ui";
import {
  parseMultipleFiles,
  ParseError,
  MAX_FILE_MB,
  type SheetTable,
  type SourceSheet,
} from "@/lib/client-parse";
import {
  type DatasetKind,
  type DatasetNatureza,
  type ImportMode,
  type Issue,
  type ValidationResult,
} from "@/lib/domain";
import { buildCsv } from "@/lib/csv";
import { fmtCurrency, fmtInt, todayISO } from "@/lib/format";
import { notifyBaseUpdated } from "@/components/datasets-panel";
import { saveDataset } from "@/lib/static-store";
import {
  extractSnapshotPayload,
  hasSnapshotPayloadMeaningfulData,
  SNAPSHOT_BLOCK_KEYS,
  SNAPSHOT_BLOCKS,
  snapshotBlockLabel,
  type DashboardSnapshotPayload,
} from "@/lib/dashboard-snapshot";

/* ------------------------------------------------------------------ */

const STEPS = [
  { n: 1, label: "Arquivo" },
  { n: 2, label: "Tipo de base" },
  { n: 3, label: "Resumo automático" },
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

function metricPair(atas: number | null, itens: number | null): string | null {
  const parts = [
    atas === null ? null : `${fmtInt(atas)} atas`,
    itens === null ? null : `${fmtInt(itens)} itens`,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

function snapshotBlockDetail(payload: DashboardSnapshotPayload, key: string): string | null {
  switch (key) {
    case "kpis-leitura":
      return metricPair(payload.kpis.concluidasAtas, payload.kpis.concluidasItens)
        ?? metricPair(payload.kpis.andamentoAtas, payload.kpis.andamentoItens);
    case "valores-por-area": {
      const count = Object.values(payload.valueAreas).filter((area) => area.valor !== null).length;
      return count ? `${fmtInt(count)} áreas com valor reconhecido` : null;
    }
    case "saving": {
      const value = payload.savingTotal.valorSaving ?? payload.savingTotal.savingHist ?? payload.savingTotal.savingProp;
      return value === null ? null : `Saving ${fmtCurrency(value)}`;
    }
    case "top-compradores": {
      const count = Object.values(payload.topCompradores).reduce((sum, area) => sum + area.buyers.length, 0);
      return count ? `${fmtInt(count)} compradores listados` : null;
    }
    case "fornecedores": {
      const count = payload.fornecedoresGeral.length
        || Object.values(payload.fornecedores).reduce((sum, area) => sum + area.length, 0);
      return count ? `${fmtInt(count)} fornecedores listados` : null;
    }
    case "evolucao": {
      const count = Object.values(payload.evolucao).filter((area) =>
        Object.values(area).some((value) => value !== null),
      ).length;
      return count ? `${fmtInt(count)} áreas reconhecidas` : null;
    }
    case "previsao-faixas": {
      const count = Object.values(payload.previsoes).reduce(
        (sum, band) => sum + Object.values(band).filter((area) => area.atas !== null || area.itens !== null).length,
        0,
      );
      return count ? `${fmtInt(count)} faixas com dados` : null;
    }
    case "previsao-meses": {
      const count = Object.values(payload.previsaoMeses).reduce((sum, area) => sum + area.rows.length, 0);
      return count ? `${fmtInt(count)} linhas mensais` : null;
    }
    case "previsoes-cruzadas": {
      const count = Object.values(payload.previsoes).reduce(
        (sum, band) => sum + Object.values(band).reduce((areaSum, area) => areaSum + area.buyers.length, 0),
        0,
      );
      return count ? `${fmtInt(count)} compradores com previsão` : null;
    }
    case "atas-concluidas":
      return payload.atasConcluidas.length ? `${fmtInt(payload.atasConcluidas.length)} atas finalizadas` : null;
    case "contratos-fornecedores": {
      const count = Object.keys(payload.fornecedoresPorContrato).length;
      return count ? `${fmtInt(count)} contratos relacionados` : null;
    }
    case "status-atas": {
      const count = Object.values(payload.statusAtas).filter(Boolean).length;
      return count ? `${fmtInt(count)} áreas reconhecidas` : null;
    }
    default:
      return null;
  }
}

export function ImportWizard() {
  const [step, setStep] = useState(1);

  // A tabela combinada é mantida apenas para metadados e para preservar o
  // tamanho original da leitura. Os dados do Giro são extraídos pelas abas
  // nomeadas, sem mapeamento manual de colunas operacionais.
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

  // Mantidos como metadados compatíveis com o IndexedDB. Não são decisões
  // expostas ao usuário: a leitura consolidada é sempre um snapshot automático.
  const kind: DatasetKind = "outro";
  const natureza: DatasetNatureza = "snapshot";
  const [importMode, setImportMode] = useState<ImportMode>("replace");
  const [referenceDate, setReferenceDate] = useState(todayISO());

  const [validacao, setValidacao] = useState<ValidateResponse | null>(null);
  const [resultadoValidacao, setResultadoValidacao] = useState<ValidationResult | null>(null);
  const [resultadoSnapshot, setResultadoSnapshot] = useState<DashboardSnapshotPayload | null>(null);
  const [validando, setValidando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [erroEtapa, setErroEtapa] = useState<string | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

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
      setResultadoValidacao(null);
      setResultadoSnapshot(null);
      setErroEtapa(null);
      try {
        const info = await parseMultipleFiles(files);
        setCombinedInfo(info);
        announce(`${info.filesCount} arquivos lidos com sucesso. ${info.sheetsCount} abas processadas.`);
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

  const table: SheetTable | null = combinedInfo?.combinedTable ?? null;

  /* ---------------- Snapshot automático ---------------- */

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
  const canValidate = Boolean(snapshotMeaningful);
  const recognizedBlocks = snapshotPreview?.coverage.found ?? [];
  const missingBlocks = snapshotPreview?.coverage.missing ?? [];

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
      const meaningful = hasSnapshotPayloadMeaningfulData(snapshot);
      if (!meaningful) {
        throw new Error("Nenhum bloco consolidado das abas GIRO 01–07 foi reconhecido. Confira se a planilha contém os nomes exatos das abas e do layout esperado.");
      }
      // A importação consolidada não cria registros operacionais por inferência.
      // Linhas de processos permanecem zero quando a fonte traz somente o snapshot.
      const result: ValidationResult = { records: [], issues: [], skipped: 0, duplicates: 0, warnings: 0 };
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
      announce(`Validação concluída: ${snapshot.coverage.found.length.toLocaleString("pt-BR")} blocos específicos reconhecidos.`);
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
    if (!meaningfulSnapshot) return;
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
        snapshot: resultadoSnapshot,
      });
      setValidacao((current) => current ? { ...current, datasetId: dataset.id } : current);
      setStep(5);
      notifyBaseUpdated();
      announce(`Importação concluída. ${meaningfulSnapshot ? "Leitura automática do painel" : "Nenhum snapshot"} salva neste navegador.`);
    } catch (e) {
      setErroEtapa(e instanceof Error ? e.message : "Falha ao salvar a importação neste navegador.");
      announce("Falha na importação.");
    } finally {
      setConfirmando(false);
    }
  }

  function baixarRelatorio() {
    if (!table) return;
    const result = resultadoValidacao ?? { records: [], issues: [], skipped: 0, duplicates: 0, warnings: 0 };
    const csv = buildCsv(
      ["Linha na planilha", "Coluna", "Tipo", "Ocorrência"],
      result.issues.map((i) => [i.row, i.column, i.severity === "error" ? "linha ignorada" : "aviso", i.message]),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-importacao.csv";
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
    setImportMode("replace");
    setReferenceDate(todayISO());
    if (inputFileRef.current) inputFileRef.current.value = "";
  }

  /* ================================ RENDER */

  return (
    <>
      <PageHeader
        overline="Dados"
        title="Importar planilha"
        description={`Leia arquivos .xlsx, .xls ou .csv de até ${MAX_FILE_MB} MB. A leitura das abas GIRO é automática e o arquivo permanece no seu navegador após a confirmação.`}
      />

      <div ref={liveRef} role="status" aria-live="polite" className="sr-only" />

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
              Todas as abas nomeadas do Giro serão lidas e resumidas automaticamente.
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
                    <p className="text-[15px] font-bold text-navy-950">{combinedInfo.filesCount} {combinedInfo.filesCount === 1 ? "arquivo selecionado" : "arquivos selecionados"}</p>
                    <p className="mt-0.5 text-[12.5px] text-ink-soft">{combinedInfo.names.join(", ")}</p>
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
          <div className="card border-navy-200 bg-navy-50/60 p-5">
            <p className="text-[14px] font-bold text-navy-950">Snapshot consolidado do Giro</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
              A leitura das abas consolidadas é automática. Área, natureza e campos operacionais não são escolhidos nesta importação.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <fieldset className="card p-5">
              <legend className="text-[12.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">
                Como tratar a base
              </legend>
              <div className="mt-3 space-y-2">
                <RadioCard
                  name="modo"
                  checked={importMode === "replace"}
                  onChange={() => setImportMode("replace")}
                  title="Substituir"
                  desc="Usa esta leitura como a base atual e mantém a anterior no histórico local."
                />
                <RadioCard
                  name="modo"
                  checked={importMode === "combine"}
                  onChange={() => setImportMode("combine")}
                  title="Combinar"
                  desc="Mantém a leitura ativa e adiciona esta importação como outra base local."
                />
              </div>
            </fieldset>

            <div className="card p-5">
              <label htmlFor="ref-date" className="text-[12.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">
                Data de referência
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
                Identifica a leitura no panorama e no histórico local. O cálculo de vencidos e a vencer usa a data atual do sistema.
              </p>
            </div>
          </div>

          <WizardNav
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            nextLabel="Ver resumo automático"
          />
        </section>
      )}

      {/* =============== ETAPA 3: RESUMO AUTOMÁTICO =============== */}
      {step === 3 && combinedInfo && snapshotPreview && (
        <section aria-label="Resumo automático do snapshot" className="space-y-4">
          <div className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-accent-700">Leitura automática</p>
                <h3 className="mt-1 text-[18px] font-bold text-navy-950">Resumo do snapshot reconhecido</h3>
                <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ink-soft">
                  Os blocos abaixo foram procurados pelos nomes exatos das abas e tabelas. Nenhuma coluna operacional precisa ser associada manualmente.
                </p>
              </div>
              <div className="rounded-xl bg-navy-50 px-4 py-3 text-right">
                <p className="tnum text-[23px] font-bold text-navy-900">{fmtInt(recognizedBlocks.length)}</p>
                <p className="text-[11.5px] font-semibold text-ink-soft">blocos reconhecidos</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Referência" value={referenceDate ? referenceDate.split("-").reverse().join("/") : "—"} tone="navy" />
            <Stat label="Abas processadas" value={fmtInt(combinedInfo.sheetsCount)} tone="neutral" />
            <Stat label="Linhas lidas" value={fmtInt(combinedInfo.combinedTable.totalRows)} tone="neutral" />
            <Stat label="Fonte" value="Snapshot" tone="ok" />
          </div>

          {snapshotMeaningful && (
            <div className="card p-5">
              <SectionTitle title="Indicadores identificados" />
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Concluídas", metricPair(snapshotPreview.kpis.concluidasAtas, snapshotPreview.kpis.concluidasItens)],
                  ["Em andamento", metricPair(snapshotPreview.kpis.andamentoAtas, snapshotPreview.kpis.andamentoItens)],
                  ["A vencer", metricPair(snapshotPreview.kpis.aVencerAtas, snapshotPreview.kpis.aVencerItens)],
                  ["Vencidas", metricPair(snapshotPreview.kpis.vencidasAtas, snapshotPreview.kpis.vencidasItens)],
                ].map(([label, value]) => value ? (
                  <div key={label} className="rounded-xl border border-line bg-surface px-3.5 py-3">
                    <p className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink-soft">{label}</p>
                    <p className="mt-1 text-[13.5px] font-semibold text-navy-900">{value}</p>
                  </div>
                ) : null)}
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="border-b border-line px-5 py-4">
              <SectionTitle title="Blocos da leitura" />
              <p className="mt-1 text-[12.5px] text-ink-soft">
                Reconhecidos: {fmtInt(recognizedBlocks.length)} de {fmtInt(SNAPSHOT_BLOCK_KEYS.length)} blocos esperados.
              </p>
            </div>
            <ul className="grid gap-2 p-4 sm:grid-cols-2">
              {SNAPSHOT_BLOCK_KEYS.map((key) => {
                const found = recognizedBlocks.includes(key);
                const detail = found ? snapshotBlockDetail(snapshotPreview, key) : null;
                return (
                  <li
                    key={key}
                    className={clsx(
                      "rounded-xl border px-3.5 py-3",
                      found ? "border-ok-600/25 bg-ok-100/50" : "border-line bg-neutral-50/70",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span className={clsx("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold", found ? "bg-ok-600 text-white" : "bg-neutral-200 text-neutral-600")} aria-hidden="true">
                        {found ? "✓" : "—"}
                      </span>
                      <div className="min-w-0">
                        <p className={clsx("text-[13px] font-bold", found ? "text-ok-700" : "text-ink-soft")}>{snapshotBlockLabel(key)}</p>
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-soft">
                          {found ? (detail ?? "Bloco reconhecido; sem métrica resumida disponível.") : SNAPSHOT_BLOCKS[key].esperado}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {missingBlocks.length > 0 && (
            <div className="card flex items-start gap-2.5 border-warn-600/30 bg-warn-100/50 p-4 text-[13px] leading-relaxed text-warn-700" role="status">
              <TriangleAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>
                {fmtInt(missingBlocks.length)} bloco(s) não foram encontrado(s). Eles permanecem ausentes, sem preenchimento artificial; os blocos reconhecidos serão importados normalmente.
              </p>
            </div>
          )}

          {!canValidate && (
            <div className="card flex items-start gap-2.5 border-danger-600/30 bg-danger-100/40 p-4 text-[13px] leading-relaxed text-danger-700" role="alert">
              <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              Nenhum bloco reconhecido. Volte ao arquivo e confirme as abas GIRO 01–07 e os nomes exatos do layout.
            </div>
          )}

          <WizardNav
            onBack={() => setStep(2)}
            onNext={validar}
            nextLabel={validando ? "Validando…" : "Validar snapshot"}
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
          {(() => {
            const snapshotOnly = Boolean(validacao.snapshotMeaningful && validacao.resumo.validos === 0);
            return (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <Stat label="Blocos reconhecidos" value={fmtInt(validacao.snapshotCoverage?.found.length ?? 0)} tone="ok" />
                  <Stat label="Linhas operacionais" value={fmtInt(validacao.resumo.validos)} tone="neutral" />
                  <Stat label="Linhas ignoradas" value={fmtInt(validacao.resumo.ignoradas)} tone={validacao.resumo.ignoradas > 0 ? "warn" : "neutral"} />
                  <Stat label="Avisos" value={fmtInt(validacao.resumo.avisos)} tone={validacao.resumo.avisos > 0 ? "navy" : "neutral"} />
                </div>

                <div className="card p-5">
                  <SectionTitle title="Resumo do que será importado" />
                  <dl className="grid gap-x-8 gap-y-3 text-[13.5px] sm:grid-cols-2">
                    <ResumoItem label="Arquivos">{combinedInfo.names.join(", ")} ({combinedInfo.sheetsCount} abas)</ResumoItem>
                    <ResumoItem label="Tipo de leitura">Snapshot consolidado · leitura automática</ResumoItem>
                    <ResumoItem label="Modo">{importMode === "replace" ? "Substituir a leitura ativa (a anterior vai para o histórico)" : "Combinar com as bases ativas"}</ResumoItem>
                    <ResumoItem label="Data de referência">{referenceDate ? referenceDate.split("-").reverse().join("/") : "—"}</ResumoItem>
                    <ResumoItem label="Blocos específicos">
                      {fmtInt(validacao.snapshotCoverage?.found.length ?? 0)} reconhecidos
                      {validacao.snapshotCoverage?.found.length ? <span className="text-ink-soft"> · {validacao.snapshotCoverage.found.map(snapshotBlockLabel).join(", ")}</span> : null}
                    </ResumoItem>
                    <ResumoItem label="Linhas operacionais">
                      {snapshotOnly ? "Nenhuma — a fonte contém somente o snapshot automático" : fmtInt(validacao.resumo.validos)}
                    </ResumoItem>
                    <ResumoItem label="Histórico local">Preservado no IndexedDB deste navegador</ResumoItem>
                  </dl>
                </div>

                {validacao.resumo.issuesTotal > 0 ? (
                  <div className="card overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                      <div>
                        <h3 className="text-[14.5px] font-bold text-navy-950">Ocorrências encontradas na validação</h3>
                        <p className="mt-0.5 text-[12.5px] text-ink-soft">
                          Mostrando {fmtInt(Math.min(validacao.resumo.issuesAmostra.length, 60))} de {fmtInt(validacao.resumo.issuesTotal)}. Baixe o relatório para ver todas.
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
                          {validacao.resumo.issuesAmostra.slice(0, 60).map((issue, index) => (
                            <tr key={index} className="border-b border-line/60 last:border-0">
                              <td className="tnum px-4 py-2.5 font-semibold text-ink">{fmtInt(issue.row)}</td>
                              <td className="px-4 py-2.5">
                                <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold", issue.severity === "error" ? "bg-danger-100 text-danger-700" : "bg-warn-100 text-warn-700")}>
                                  <span aria-hidden="true" className={clsx("h-[7px] w-[7px] rounded-full", issue.severity === "error" ? "bg-danger-600" : "bg-warn-600")} />
                                  {issue.severity === "error" ? "linha ignorada" : "aviso — linha mantida"}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 font-medium text-ink">{issue.column}</td>
                              <td className="px-4 py-2.5 leading-snug text-ink">{issue.message}</td>
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
                      {snapshotOnly
                        ? "Nenhuma linha operacional foi criada: esta leitura será salva somente como snapshot, sem inventar processos ou rateios."
                        : "Nenhuma ocorrência na validação."}
                    </p>
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
                    Voltar ao resumo
                  </button>
                  <button
                    type="button"
                    onClick={confirmar}
                    disabled={confirmando || !validacao.snapshotMeaningful}
                    className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent-600 px-6 text-[14.5px] font-bold text-white transition-colors hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-describedby="confirm-hint"
                  >
                    {confirmando ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}
                    {confirmando ? "Importando…" : "Confirmar importação do snapshot"}
                  </button>
                </div>
                <p id="confirm-hint" className="text-right text-[12px] text-ink-soft">
                  {importMode === "replace"
                    ? "A leitura ativa será substituída e a anterior continuará disponível no histórico."
                    : "A nova leitura será combinada com as bases locais ativas."}{" "}
                  A gravação local é atômica: ou o dataset é salvo completo, ou nada é alterado.
                </p>
              </>
            );
          })()}
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
              O snapshot automático de <strong className="tnum text-ink">{fmtInt(validacao.snapshotCoverage?.found.length ?? 0)}</strong> blocos foi salvo localmente.
              Nenhuma linha operacional foi criada por inferência; dados ausentes continuam ausentes.
              {validacao.resumo.ignoradas > 0 && (
                <>
                  {" "}<strong className="tnum text-ink">{fmtInt(validacao.resumo.ignoradas)}</strong> linhas foram ignoradas e estão listadas no relatório.
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
