 "use client";

import { useState } from "react";
import TitleCaptionGenerator from "./title-caption-generator";
import type { HistoryRecord } from "../lib/local-history";

type Format = "YouTube longo" | "Reels" | "YouTube Shorts" | "TikTok" | "Stories" | "Comunidade WhatsApp" | "Carrossel";
type Output = { title: string; content: string };
export type ContentStudioEntry = { title: string; content: string; category?: HistoryRecord["category"] };

const formats: Format[] = ["YouTube longo", "Reels", "YouTube Shorts", "TikTok", "Stories", "Comunidade WhatsApp", "Carrossel"];

export default function ContentStudio({ onGenerated }: { onGenerated?: (entry: ContentStudioEntry) => void | boolean | Promise<void | boolean> }) {
  const [activeArea, setActiveArea] = useState<"content" | "titles">("content");
  const [format, setFormat] = useState<Format>("YouTube longo");
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("10 minutos");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [copied, setCopied] = useState("");

  async function generate() {
    if (!topic.trim()) {
      setError("Digite o assunto do conteúdo.");
      return;
    }
    setLoading(true);
    setError("");
    setOutputs([]);
    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, topic: topic.trim(), goal: goal.trim(), duration, transcript: transcript.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível gerar o conteúdo.");
      if (!Array.isArray(data.outputs)) throw new Error("A resposta da IA veio em um formato inesperado.");
      setOutputs(data.outputs);
      for (const output of data.outputs as Output[]) onGenerated?.({ title: output.title, content: output.content });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string, title: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(title);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setError("Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.");
    }
  }

  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-red-400">Produção editorial</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Estúdio de Conteúdo DRA</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">
          Gere materiais adaptados a cada plataforma, seguindo o padrão editorial da Dra. Daniela Rigol.
          Revise informações jurídicas e tempos de capítulos antes de publicar.
        </p>
      </div>

      <div role="tablist" aria-label="Ferramentas do Estúdio de Conteúdo" className="mb-6 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-[#0d0d0d] p-2">
        <button type="button" role="tab" aria-selected={activeArea === "content"} onClick={() => setActiveArea("content")}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${activeArea === "content" ? "bg-red-600 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
          Gerador de conteúdo
        </button>
        <button type="button" role="tab" aria-selected={activeArea === "titles"} onClick={() => setActiveArea("titles")}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${activeArea === "titles" ? "bg-red-600 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
          Títulos e Legendas
        </button>
      </div>

      {activeArea === "titles" ? <TitleCaptionGenerator onGenerated={onGenerated} /> : <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-5 rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 sm:p-7">
          <div>
            <label htmlFor="format" className="mb-2 block text-sm font-semibold">Formato de publicação</label>
            <select id="format" value={format} onChange={(e) => setFormat(e.target.value as Format)}
              className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm outline-none focus:border-red-500">
              {formats.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="topic" className="mb-2 block text-sm font-semibold">Assunto do conteúdo *</label>
            <textarea id="topic" value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex.: isenção de Imposto de Renda para militar reformado com doença grave"
              rows={3} className="w-full resize-y rounded-xl border border-white/10 bg-black p-3 text-sm leading-6 outline-none placeholder:text-white/25 focus:border-red-500" />
          </div>
          <div>
            <label htmlFor="goal" className="mb-2 block text-sm font-semibold">Objetivo ou palavra-chave</label>
            <input id="goal" value={goal} onChange={(e) => setGoal(e.target.value)}
              placeholder="Ex.: explicar requisitos e incentivar a pessoa a buscar orientação"
              className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm outline-none placeholder:text-white/25 focus:border-red-500" />
          </div>
          {(format === "YouTube longo" || format === "Reels" || format === "YouTube Shorts" || format === "TikTok") && (
            <div>
              <label htmlFor="duration" className="mb-2 block text-sm font-semibold">Duração desejada</label>
              <select id="duration" value={duration} onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm outline-none focus:border-red-500">
                <option>1 minuto</option><option>1 minuto e 30 segundos</option><option>3 minutos</option><option>5 minutos</option><option>10 minutos</option><option>15 minutos</option>
              </select>
            </div>
          )}
          <div>
            <label htmlFor="transcript" className="mb-2 block text-sm font-semibold">Transcrição ou contexto adicional (opcional)</label>
            <textarea id="transcript" value={transcript} onChange={(e) => setTranscript(e.target.value)}
              placeholder="Cole uma transcrição, pontos que precisam aparecer ou informações já verificadas."
              rows={5} className="w-full resize-y rounded-xl border border-white/10 bg-black p-3 text-sm leading-6 outline-none placeholder:text-white/25 focus:border-red-500" />
          </div>
          {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
          <button onClick={generate} disabled={loading || !topic.trim()}
            className="w-full rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Gerando conteúdo..." : "✦ Gerar conteúdo"}
          </button>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5">
            <h2 className="font-bold">Padrão DRA aplicado</h2>
            <ul className="mt-3 space-y-2 text-sm leading-5 text-white/55">
              <li>• Português claro para o público da DRA.</li>
              <li>• Gancho, desenvolvimento e CTA apropriados à rede.</li>
              <li>• Sem promessas de resultado jurídico.</li>
              <li>• Sem dados identificáveis de clientes.</li>
              <li>• Títulos sem excesso de caixa alta ou pontuação.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[.05] p-5">
            <h2 className="font-bold text-amber-200">Revisão antes de publicar</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">
              A IA não confirma a legislação nem os tempos reais de um vídeo. Revise leis, requisitos, capítulos e afirmações jurídicas com a equipe.
            </p>
          </div>
        </aside>
      </div>

      {outputs.length > 0 && <div className="mt-8 space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-red-400">Resultado</p>
          <h2 className="mt-2 text-2xl font-black">Conteúdo gerado</h2>
        </div>
        {outputs.map((item, index) => <article key={`${item.title}-${index}`} className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-bold">{item.title}</h3>
            <button onClick={() => copy(item.content, item.title)} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold hover:border-red-500/60">
              {copied === item.title ? "Copiado!" : "Copiar texto"}
            </button>
          </div>
          <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-white/75">{item.content}</pre>
        </article>)}
      </div>}
      </>}
    </section>
  );
}
