"use client";

import { useState } from "react";
import type { ContentStudioEntry } from "./content-studio";

type Objective = "engajamento" | "autoridade" | "educação" | "alcance" | "conversão";
type Platform = "Instagram" | "Reels" | "Stories" | "LinkedIn";
type Tone = "profissional" | "educativo" | "persuasivo" | "descontraído";
type CaptionLength = "curto" | "médio" | "longo";
type TitleCaptionOptions = {
  audience: string;
  objective: Objective;
  platform: Platform;
  tone: Tone;
  titleCount: number;
  captionLength: CaptionLength;
  additionalContext: string;
};
type GeneratedContent = { titles: string[]; caption: string; hashtags: string };
type ApiOutput = { title: string; content: string };

const inputClassName = "w-full rounded-xl border border-white/10 bg-black p-3 text-sm outline-none focus:border-red-500";
const selectClassName = `${inputClassName} cursor-pointer`;

function normalizeLabel(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

function parseOutputs(value: unknown, titleCount: number): GeneratedContent {
  if (!Array.isArray(value)) throw new Error("A resposta da IA veio em um formato inesperado.");
  const outputs = value.filter((item): item is ApiOutput =>
    !!item && typeof item === "object" &&
    typeof (item as ApiOutput).title === "string" &&
    typeof (item as ApiOutput).content === "string" &&
    !!(item as ApiOutput).content.trim()
  );

  const titleBlocks = outputs
    .map((output) => ({ output, match: /^(?:opcao de )?titulo\s*(\d+)$/i.exec(normalizeLabel(output.title)) }))
    .filter((item): item is { output: ApiOutput; match: RegExpExecArray } => item.match !== null)
    .sort((left, right) => Number(left.match[1]) - Number(right.match[1]));
  const titles = titleBlocks.slice(0, titleCount).map(({ output }) => output.content.trim());
  const caption = outputs.find((output) => /^legenda(?: completa)?$/i.test(normalizeLabel(output.title)))?.content.trim();
  const hashtags = outputs.find((output) => /^hashtags?$/i.test(normalizeLabel(output.title)))?.content.trim();

  if (titles.length !== titleCount || !caption || !hashtags) {
    throw new Error("A IA não retornou todos os títulos, a legenda e as hashtags. Tente gerar novas variações.");
  }
  return { titles, caption, hashtags };
}

export function formatTitleCaptionRecord(topic: string, content: GeneratedContent) {
  return [
    `TEMA\n${topic.trim()}`,
    `OPÇÕES DE TÍTULOS\n${content.titles.map((title, index) => `${index + 1}. ${title}`).join("\n")}`,
    `LEGENDA\n${content.caption}`,
    `HASHTAGS\n${content.hashtags}`,
  ].join("\n\n");
}

export default function TitleCaptionGenerator({
  onGenerated,
}: {
  onGenerated?: (entry: ContentStudioEntry) => void | boolean | Promise<void | boolean>;
}) {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("Aposentados, pensionistas e militares da reserva ou reforma");
  const [objective, setObjective] = useState<Objective>("educação");
  const [platform, setPlatform] = useState<Platform>("Instagram");
  const [tone, setTone] = useState<Tone>("educativo");
  const [titleCount, setTitleCount] = useState(5);
  const [captionLength, setCaptionLength] = useState<CaptionLength>("médio");
  const [additionalContext, setAdditionalContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState("");
  const [result, setResult] = useState<GeneratedContent | null>(null);

  async function generate() {
    if (!topic.trim()) {
      setError("Informe o tema ou assunto do conteúdo.");
      setSuccess("");
      return;
    }
    if (!audience.trim()) {
      setError("Informe o público-alvo.");
      setSuccess("");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setCopied("");

    try {
      const options: TitleCaptionOptions = {
        audience: audience.trim(),
        objective,
        platform,
        tone,
        titleCount,
        captionLength,
        additionalContext: additionalContext.trim(),
      };
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "Títulos e Legendas", topic: topic.trim(), titleCaption: options }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Não foi possível gerar o conteúdo.");

      const generated = parseOutputs(data.outputs, titleCount);
      setResult(generated);
      const saved = await onGenerated?.({
        title: topic.trim(),
        content: formatTitleCaptionRecord(topic, generated),
        category: "Títulos e Legendas",
      });
      if (saved === false) {
        setError("O resultado foi gerado, mas não foi possível salvá-lo no histórico deste dispositivo.");
        return;
      }
      setSuccess(saved === undefined ? "Resultado gerado." : "Resultado gerado e salvo no histórico deste dispositivo.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ocorreu um erro inesperado ao gerar o conteúdo.");
    } finally {
      setLoading(false);
    }
  }

  async function copy(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setError("");
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setError("Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.");
    }
  }

  const copyEverything = result ? formatTitleCaptionRecord(topic, result) : "";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <form
          className="space-y-5 rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 sm:p-7"
          onSubmit={(event) => { event.preventDefault(); void generate(); }}
        >
          <div>
            <label htmlFor="title-caption-topic" className="mb-2 block text-sm font-semibold">Tema ou assunto *</label>
            <textarea id="title-caption-topic" value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={5000} rows={3}
              placeholder="Ex.: planejamento financeiro para militares da reserva"
              className={`${inputClassName} resize-y leading-6 placeholder:text-white/25`} />
          </div>
          <div>
            <label htmlFor="title-caption-audience" className="mb-2 block text-sm font-semibold">Público-alvo *</label>
            <input id="title-caption-audience" value={audience} onChange={(event) => setAudience(event.target.value)} maxLength={300}
              className={inputClassName} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="title-caption-objective" className="mb-2 block text-sm font-semibold">Objetivo</label>
              <select id="title-caption-objective" value={objective} onChange={(event) => setObjective(event.target.value as Objective)} className={selectClassName}>
                <option value="engajamento">Engajamento</option><option value="autoridade">Autoridade</option><option value="educação">Educação</option><option value="alcance">Alcance</option><option value="conversão">Conversão</option>
              </select>
            </div>
            <div>
              <label htmlFor="title-caption-platform" className="mb-2 block text-sm font-semibold">Plataforma</label>
              <select id="title-caption-platform" value={platform} onChange={(event) => setPlatform(event.target.value as Platform)} className={selectClassName}>
                <option>Instagram</option><option>Reels</option><option>Stories</option><option>LinkedIn</option>
              </select>
            </div>
            <div>
              <label htmlFor="title-caption-tone" className="mb-2 block text-sm font-semibold">Tom</label>
              <select id="title-caption-tone" value={tone} onChange={(event) => setTone(event.target.value as Tone)} className={selectClassName}>
                <option value="profissional">Profissional</option><option value="educativo">Educativo</option><option value="persuasivo">Persuasivo</option><option value="descontraído">Descontraído</option>
              </select>
            </div>
            <div>
              <label htmlFor="title-caption-count" className="mb-2 block text-sm font-semibold">Quantidade de títulos</label>
              <select id="title-caption-count" value={titleCount} onChange={(event) => setTitleCount(Number(event.target.value))} className={selectClassName}>
                {[3, 5, 7, 10].map((count) => <option key={count} value={count}>{count} opções</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="title-caption-length" className="mb-2 block text-sm font-semibold">Tamanho da legenda</label>
              <select id="title-caption-length" value={captionLength} onChange={(event) => setCaptionLength(event.target.value as CaptionLength)} className={selectClassName}>
                <option value="curto">Curto</option><option value="médio">Médio</option><option value="longo">Longo</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="title-caption-context" className="mb-2 block text-sm font-semibold">Contexto adicional (opcional)</label>
            <textarea id="title-caption-context" value={additionalContext} onChange={(event) => setAdditionalContext(event.target.value)} maxLength={5000} rows={4}
              placeholder="Inclua informações confirmadas que devem aparecer ou detalhes que ajudem a contextualizar."
              className={`${inputClassName} resize-y leading-6 placeholder:text-white/25`} />
          </div>
          {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
          {success && <p role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-200">{success}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold transition hover:bg-red-500 disabled:cursor-wait disabled:opacity-50">
            {loading ? "Gerando títulos e legenda…" : result ? "Gerar novas variações" : "✦ Gerar títulos e legenda"}
          </button>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5">
            <h2 className="font-bold">Padrão DRA aplicado</h2>
            <ul className="mt-3 space-y-2 text-sm leading-5 text-white/55">
              <li>• Linguagem clara e adequada ao público.</li>
              <li>• Títulos variados e legenda com abertura, desenvolvimento e CTA.</li>
              <li>• Hashtags relacionadas ao tema e à plataforma.</li>
              <li>• Sem promessas de resultado ou fatos jurídicos inventados.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[.05] p-5">
            <h2 className="font-bold text-amber-200">Revisão antes de publicar</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">Revise informações jurídicas e afirmações específicas antes de publicar.</p>
          </div>
        </aside>
      </div>

      {result && <section aria-labelledby="title-caption-result-title" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-red-400">Resultado</p>
            <h2 id="title-caption-result-title" className="mt-2 text-2xl font-black">Títulos e legenda gerados</h2>
          </div>
          <button type="button" onClick={() => void copy("tudo", copyEverything)} className="rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold hover:bg-red-500">
            {copied === "tudo" ? "Tudo copiado!" : "Copiar tudo"}
          </button>
        </div>
        <div className="grid gap-4">
          {result.titles.map((title, index) => {
            const label = `título-${index + 1}`;
            return <article key={`${label}-${title}`} className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs font-bold uppercase tracking-wider text-white/40">Título {index + 1}</p><p className="mt-2 font-semibold leading-6">{title}</p></div>
                <button type="button" onClick={() => void copy(label, title)} className="shrink-0 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold hover:border-red-500/60">
                  {copied === label ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </article>;
          })}
          <article className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold">Legenda</h3><button type="button" onClick={() => void copy("legenda", result.caption)} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold hover:border-red-500/60">{copied === "legenda" ? "Copiado!" : "Copiar legenda"}</button></div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/75">{result.caption}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold">Hashtags</h3><button type="button" onClick={() => void copy("hashtags", result.hashtags)} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold hover:border-red-500/60">{copied === "hashtags" ? "Copiado!" : "Copiar hashtags"}</button></div>
            <p className="mt-4 break-words text-sm leading-6 text-white/75">{result.hashtags}</p>
          </article>
        </div>
        <p aria-live="polite" className="sr-only">{copied ? "Conteúdo copiado." : ""}</p>
      </section>}
    </div>
  );
}
