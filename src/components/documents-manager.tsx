"use client";

import { useMemo, useState, type FormEvent } from "react";
import { BookOpen, ExternalLink, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui";

export interface DocItem {
  id: number;
  titulo: string;
  url: string;
  categoria: string;
  descricao: string | null;
}

const CATEGORIAS = ["Procedimento", "Norma", "Manual", "Link SharePoint", "Outro"];

export function DocumentsManager({ documentos, erroInicial }: { documentos: DocItem[]; erroInicial: boolean }) {
  const [docs, setDocs] = useState<DocItem[]>(documentos);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(erroInicial ? "Não foi possível carregar os documentos." : null);
  const [excluindo, setExcluindo] = useState<number | null>(null);

  const filtrados = useMemo(() => {
    const t = busca.toLowerCase().trim();
    if (!t) return docs;
    return docs.filter((d) => `${d.titulo} ${d.descricao ?? ""} ${d.categoria}`.toLowerCase().includes(t));
  }, [docs, busca]);

  const agrupados = useMemo(() => {
    const map = new Map<string, DocItem[]>();
    for (const d of filtrados) {
      const arr = map.get(d.categoria) ?? [];
      arr.push(d);
      map.set(d.categoria, arr);
    }
    return [...map.entries()];
  }, [filtrados]);

  async function excluir(id: number) {
    setExcluindo(id);
    setErro(null);
    try {
      const res = await fetch(`/api/documentos?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).erro ?? "Falha ao excluir.");
      setDocs((ds) => ds.filter((d) => d.id !== id));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao excluir.");
    } finally {
      setExcluindo(null);
    }
  }

  return (
    <>
      <PageHeader
        overline="Apoio"
        title="Documentos e regras"
        description="Manuais, normas, procedimentos e links úteis (ex.: bibliotecas do SharePoint). Os links são cadastrados pela equipe — este painel não acessa o SharePoint automaticamente."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section aria-label="Lista de documentos" className="space-y-4">
          <div className="relative">
            <label htmlFor="busca-doc" className="sr-only">
              Filtrar documentos
            </label>
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              id="busca-doc"
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Filtrar por título, descrição ou categoria…"
              className="min-h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-[14px] text-ink placeholder:text-neutral-500 hover:border-navy-300"
            />
          </div>
          <p aria-live="polite" role="status" className="text-[13px] font-medium text-ink-soft">
            {filtrados.length === 1 ? "1 documento" : `${filtrados.length} documentos`}
            {busca && ` para “${busca}”`}
          </p>

          {erro && (
            <p className="card border-danger-600/30 bg-danger-100/40 p-4 text-[13px] font-semibold text-danger-700" role="alert">
              {erro}
            </p>
          )}

          {agrupados.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
              <BookOpen size={30} className="text-navy-400" aria-hidden="true" />
              <h2 className="font-display text-[17px] font-bold text-navy-950">
                {docs.length === 0 ? "Nenhum documento cadastrado" : "Nenhum documento encontrado"}
              </h2>
              <p className="max-w-md text-[13.5px] leading-relaxed text-ink-soft">
                {docs.length === 0
                  ? "Cadastre ao lado os links de normas, manuais e bibliotecas do SharePoint que a equipe usa no dia a dia."
                  : "Ajuste o termo de busca para encontrar outros documentos."}
              </p>
            </div>
          ) : (
            agrupados.map(([categoria, itens]) => (
              <section key={categoria} aria-label={categoria}>
                <h2 className="overline mb-2.5">{categoria}</h2>
                <ul className="space-y-2.5">
                  {itens.map((d) => (
                    <li key={d.id} className="card flex items-start justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-2 text-[14px] font-bold text-navy-800 hover:text-navy-950"
                        >
                          <span className="underline decoration-navy-300 underline-offset-2 group-hover:decoration-navy-500">
                            {d.titulo}
                          </span>
                          <ExternalLink size={14} aria-hidden="true" className="shrink-0 text-navy-400" />
                          <span className="sr-only">(abre em nova guia)</span>
                        </a>
                        {d.descricao && <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{d.descricao}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => excluir(d.id)}
                        disabled={excluindo === d.id}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line text-danger-700 transition-colors hover:border-danger-600/40 hover:bg-danger-100/40 disabled:opacity-50"
                        aria-label={`Excluir o documento ${d.titulo}`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </section>

        <div className="space-y-5">
          <NovoDocumento onCreated={(d) => setDocs((ds) => [...ds, d].sort((a, b) => a.categoria.localeCompare(b.categoria) || a.titulo.localeCompare(b.titulo)))} />
          <RegrasDePreenchimento />
        </div>
      </div>
    </>
  );
}

function RegrasDePreenchimento() {
  return (
    <div className="card space-y-4 p-5 lg:sticky lg:top-[84px]">
      <h2 className="text-[16px] font-display font-bold text-navy-900">Parâmetros do Mapeamento</h2>
      <div className="space-y-4 text-[12px] text-ink-soft">
        <p><strong className="text-ink">Status “A Renovar”:</strong> Adotada a régua de 100 dias pré-vencimento para garantir margem de tempo na estruturação e renovação dos processos.</p>
        <p><strong className="text-ink">Base “Em Andamento”:</strong> Apurada cruzando a Planilha de Atas em Andamento com o relatório SAP (mapeamento de todos os projetos 7000 criados neste ano sem requisição).</p>
      </div>

      <h2 className="text-[16px] font-display font-bold text-navy-900 mt-6 pt-4 border-t border-line">Regras | Atas em Andamento</h2>
      <ul className="space-y-2 text-[12px] text-ink-soft list-disc pl-4">
        <li><strong className="text-ink">Moeda e Câmbio:</strong> Valores em Reais (R$). Compras internacionais realizem a conversão.</li>
        <li><strong className="text-ink">Atualização de Tarefas:</strong> Sempre alterar a tarefa atual e estimativa de conclusão.</li>
        <li><strong className="text-ink">Atas em Preparação:</strong> Conter a previsão de início e estimativa de conclusão após levantar o spend.</li>
        <li><strong className="text-ink">Ajuste de Quantidades:</strong> Ao excluir itens, revisar a contabilização exata.</li>
      </ul>

      <h2 className="text-[16px] font-display font-bold text-accent-600 mt-6 pt-4 border-t border-line">Regras | Atas Renovação</h2>
      <ul className="space-y-2 text-[12px] text-ink-soft list-disc pl-4">
        <li><strong className="text-ink">Decisão "NOVA ATA":</strong> Informar o número do novo projeto (7000). Acompanhado na aba ATAS EM ANDAMENTO.</li>
        <li><strong className="text-ink">Bloqueio do Contrato no SAP:</strong> Os contratos anteriores foram bloqueados no SAP para não permanecerem contabilizados.</li>
        <li><strong className="text-ink">Cobertura dos Itens:</strong> Atenção aos casos em que a nova ata não contemplou 100% dos itens da ata anterior.</li>
        <li><strong className="text-ink">Renovação pelo Mesmo Processo:</strong> Procurar equipe de Governança para apoio no andamento.</li>
      </ul>
    </div>
  );
}

function NovoDocumento({ onCreated }: { onCreated: (d: DocItem) => void }) {
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [categoria, setCategoria] = useState("Link SharePoint");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    setOk(false);
    try {
      const res = await fetch("/api/documentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, url, categoria, descricao }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "Falha ao salvar.");
      onCreated(data.documento);
      setTitulo("");
      setUrl("");
      setDescricao("");
      setOk(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card h-fit space-y-4 p-5 lg:sticky lg:top-[84px]" aria-label="Cadastrar novo documento">
      <h2 className="flex items-center gap-2 text-[14.5px] font-bold text-navy-950">
        <Plus size={16} aria-hidden="true" />
        Cadastrar documento
      </h2>
      <div>
        <label htmlFor="doc-titulo" className="mb-1.5 block text-[12.5px] font-semibold text-ink">
          Título <span aria-hidden="true" className="text-danger-600">*</span>
        </label>
        <input
          id="doc-titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          maxLength={200}
          className="min-h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[14px] text-ink"
          placeholder="Ex.: Manual de Registro de Preços"
        />
      </div>
      <div>
        <label htmlFor="doc-url" className="mb-1.5 block text-[12.5px] font-semibold text-ink">
          URL <span aria-hidden="true" className="text-danger-600">*</span>
        </label>
        <input
          id="doc-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          maxLength={2000}
          inputMode="url"
          className="min-h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[14px] text-ink"
          placeholder="https://…"
        />
      </div>
      <div>
        <label htmlFor="doc-categoria" className="mb-1.5 block text-[12.5px] font-semibold text-ink">
          Categoria
        </label>
        <select
          id="doc-categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-[14px] text-ink"
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="doc-desc" className="mb-1.5 block text-[12.5px] font-semibold text-ink">
          Descrição <span className="font-normal text-ink-soft">(opcional)</span>
        </label>
        <textarea
          id="doc-desc"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          maxLength={1000}
          className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[14px] text-ink"
          placeholder="Para que serve e quando consultar"
        />
      </div>
      {erro && (
        <p className="rounded-xl bg-danger-100/60 px-4 py-3 text-[13px] font-semibold text-danger-700" role="alert">
          {erro}
        </p>
      )}
      {ok && (
        <p className="rounded-xl bg-ok-100 px-4 py-3 text-[13px] font-semibold text-ok-700" role="status">
          Documento cadastrado com sucesso.
        </p>
      )}
      <button
        type="submit"
        disabled={salvando}
        className="min-h-11 w-full rounded-xl bg-navy-900 text-[14px] font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-60"
      >
        {salvando ? "Salvando…" : "Salvar documento"}
      </button>
    </form>
  );
}
