"use client";

import { useState } from "react";

type Format = "Roteiro normal" | "Roteiro Shorts";
type Output = { title: string; content: string };
type SectionKey = "title" | "objective" | "hook" | "introduction" | "development" | "conclusion" | "cta";

const requiredSections: { key: SectionKey; label: string; aliases: string[] }[] = [
  { key: "title", label: "título", aliases: ["titulo", "title", "titulo de trabalho"] },
  { key: "objective", label: "objetivo", aliases: ["objetivo", "finalidade", "proposito", "publico e objetivo"] },
  { key: "hook", label: "gancho", aliases: ["gancho", "hook", "frase inicial"] },
  { key: "introduction", label: "introdução", aliases: ["introducao", "contextualizacao", "apresentacao", "abertura"] },
  { key: "development", label: "desenvolvimento", aliases: ["desenvolvimento", "corpo do roteiro", "secoes principais", "parte principal"] },
  { key: "conclusion", label: "conclusão", aliases: ["conclusao", "fechamento", "encerramento", "resumo final", "sintese final"] },
  { key: "cta", label: "CTA", aliases: ["cta", "call to action", "chamada", "convite", "proximo passo", "passo seguinte", "proxima acao", "acao final"] },
];

function repairMojibake(value: string) {
  let repaired = value;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const characters = Array.from(repaired);
    if (!characters.every((character) => (character.codePointAt(0) ?? 256) <= 255)) break;
    try {
      const bytes = Uint8Array.from(characters, (character) => character.codePointAt(0) ?? 0);
      const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (decoded === repaired) break;
      repaired = decoded;
    } catch {
      break;
    }
  }
  return repaired;
}

function normalizeText(value: string) {
  return repairMojibake(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f\u00ad]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function validOutputs(value: unknown, requestedText: string): Output[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Output => {
    if (!item || typeof item !== "object") return false;
    const output = item as Record<string, unknown>;
    if (typeof output.title !== "string" || !output.title.trim() || typeof output.content !== "string" || !output.content.trim()) return false;
    return normalizeText(output.content) !== requestedText;
  });
}

function coveredSections(outputs: Output[]): Set<SectionKey> {
  const covered = new Set<SectionKey>();
  for (const output of outputs) {
    const firstContentLine = output.content.trim().split(/\r?\n/, 1)[0] ?? "";
    const outputTitle = normalizeText(output.title);
    const title = /^(bloco|secao|parte|output|conteudo)( [0-9]+)?$/.test(outputTitle)
      ? normalizeText(firstContentLine)
      : outputTitle;
    const content = normalizeText(output.content.slice(0, 180));
    for (const section of requiredSections) {
      const isHookHeading = title.includes("gancho") || title.includes("hook");
      if (section.aliases.some((alias) => title.includes(alias)) && !(section.key === "introduction" && isHookHeading)) covered.add(section.key);
      if (section.key === "cta" && /^(cta|chamada para acao|convite final|proximo passo)\b/.test(content)) covered.add(section.key);
    }
  }
  return covered;
}

function generatedTitle(outputs: Output[]) {
  const titleOutput = outputs.find((output) => coveredSections([output]).has("title"));
  if (!titleOutput) return "";

  const lines = titleOutput.content.trim().split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const rawLine of lines) {
    let line = rawLine.replace(/^#{1,6}\s*/, "").replace(/^\*\*|\*\*$/g, "").trim();
    const normalized = normalizeText(line);
    if (!line || normalized === "titulo" || normalized === "titulo de trabalho" || normalized === "titulo gerado") continue;
    const separator = line.indexOf(":");
    if (separator > 0 && normalizeText(line.slice(0, separator)).startsWith("titulo")) line = line.slice(separator + 1).trim();
    return line.slice(0, 120);
  }
  return "";
}

export default function ScriptGenerator({ onGenerated }: { onGenerated?: (entry: { title: string; content: string }) => void }) {
  const [idea, setIdea] = useState("");
  const [keyword, setKeyword] = useState("");
  const [format, setFormat] = useState<Format>("Roteiro normal");
  const [duration, setDuration] = useState("10 minutos");
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  async function postGeneration(body: Record<string, unknown>) {
    const response = await fetch("/api/generate-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Não foi possível gerar o roteiro.");
    return data as { outputs?: unknown };
  }

  async function generate() {
    if (!idea.trim() || loading) {
      if (!idea.trim()) setError("Descreva a ideia do vídeo.");
      return;
    }

    setLoading(true);
    setCompleting(false);
    setError("");
    setOutputs([]);

    try {
      const request = { format, topic: idea.trim(), goal: keyword.trim(), duration };
      const requestedText = normalizeText(idea);
      const generated = await postGeneration(request);
      let scriptOutputs = validOutputs(generated.outputs, requestedText);
      if (scriptOutputs.length === 0) throw new Error("A IA não retornou conteúdo gerado válido. Nenhum pedido foi salvo como resultado.");

      const covered = coveredSections(scriptOutputs);
      const missing = requiredSections.filter((section) => !covered.has(section.key)).map((section) => section.key);

      if (missing.length > 0) {
        setCompleting(true);
        const completion = await postGeneration({
          ...request,
          mode: "complete-missing-script-sections",
          missingSections: missing,
          existingOutputs: scriptOutputs,
        });
        const completionOutputs = validOutputs(completion.outputs, requestedText);
        const missingSet = new Set(missing);
        const additions = completionOutputs.filter((output) => {
          const sectionsInOutput = coveredSections([output]);
          return sectionsInOutput.size > 0 && [...sectionsInOutput].every((key) => missingSet.has(key));
        });
        scriptOutputs = [...scriptOutputs, ...additions];
      }

      const finalCoverage = coveredSections(scriptOutputs);
      const remaining = requiredSections.filter((section) => !finalCoverage.has(section.key));
      if (remaining.length > 0) {
        throw new Error(`A IA não conseguiu completar: ${remaining.map((section) => section.label).join(", ")}. O roteiro não foi salvo; tente gerar novamente.`);
      }

      const title = generatedTitle(scriptOutputs);
      const completeScript = scriptOutputs.map((output) => `## ${output.title.trim()}\n\n${output.content.trim()}`).join("\n\n");
      if (!title || !completeScript.trim() || normalizeText(completeScript) === requestedText) {
        throw new Error("A resposta não contém um roteiro completo válido. O pedido não foi salvo como resultado.");
      }

      setOutputs(scriptOutputs);
      onGenerated?.({ title, content: completeScript });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro inesperado ao gerar o roteiro.");
    } finally {
      setLoading(false);
      setCompleting(false);
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
      <p className="text-xs font-bold uppercase tracking-[.2em] text-red-400">Produção editorial</p>
      <h1 className="mt-2 text-3xl font-black sm:text-4xl">Gerador de roteiros</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">Estruture vídeos para YouTube com a IA e as orientações editoriais DRA. Revise afirmações jurídicas antes de publicar.</p>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-5 rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 sm:p-7">
          <div>
            <label htmlFor="script-format" className="mb-2 block text-sm font-semibold">Tipo de vídeo</label>
            <select id="script-format" value={format} onChange={(event) => setFormat(event.target.value as Format)} className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm outline-none focus:border-red-500">
              <option value="Roteiro normal">Vídeo normal</option>
              <option value="Roteiro Shorts">YouTube Shorts</option>
            </select>
          </div>
          <div>
            <label htmlFor="script-idea" className="mb-2 block text-sm font-semibold">Ideia do vídeo *</label>
            <textarea id="script-idea" value={idea} onChange={(event) => setIdea(event.target.value)} maxLength={5000} rows={4} placeholder="Descreva o assunto, o público e o que a pessoa deve entender." className="w-full resize-y rounded-xl border border-white/10 bg-black p-3 text-sm leading-6 outline-none placeholder:text-white/25 focus:border-red-500" />
          </div>
          <div>
            <label htmlFor="script-keyword" className="mb-2 block text-sm font-semibold">Palavra-chave</label>
            <input id="script-keyword" value={keyword} onChange={(event) => setKeyword(event.target.value)} maxLength={2000} placeholder="Ex.: isenção de imposto de renda" className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm outline-none placeholder:text-white/25 focus:border-red-500" />
          </div>
          <div>
            <label htmlFor="script-duration" className="mb-2 block text-sm font-semibold">Duração desejada</label>
            <select id="script-duration" value={duration} onChange={(event) => setDuration(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm outline-none focus:border-red-500">
              <option>1 minuto</option><option>1 minuto e 30 segundos</option><option>3 minutos</option><option>5 minutos</option><option>10 minutos</option><option>15 minutos</option>
            </select>
          </div>
          {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
          <button onClick={generate} disabled={loading || !idea.trim()} className="w-full rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">{completing ? "Completando as seções ausentes…" : loading ? "Gerando roteiro…" : "✦ Gerar roteiro"}</button>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5">
            <h2 className="font-bold">Estrutura incluída</h2>
            <ul className="mt-3 space-y-2 text-sm leading-5 text-white/55"><li>Título e objetivo</li><li>Gancho e introdução</li><li>Desenvolvimento por seções</li><li>Conclusão e CTA</li></ul>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[.05] p-5">
            <h2 className="font-bold text-amber-200">Revisão antes de publicar</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">A IA pode errar. Confira leis, requisitos e afirmações jurídicas com a equipe.</p>
          </div>
        </aside>
      </div>

      {outputs.length > 0 && <div className="mt-8 space-y-4">
        <h2 className="text-2xl font-black">Roteiro gerado</h2>
        {outputs.map((output, index) => <article key={`${output.title}-${index}`} className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold">{output.title}</h3><button onClick={() => copy(output.content, output.title)} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold hover:border-red-500/60">{copied === output.title ? "Copiado!" : "Copiar roteiro"}</button></div>
          <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-white/75">{output.content}</pre>
        </article>)}
      </div>}
    </section>
  );
}
