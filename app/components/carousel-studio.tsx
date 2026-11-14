"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { HistoryRecord } from "../lib/local-history";
import { createZipArchive } from "../lib/zip-archive";

type AspectRatio = "4:5" | "1:1";
type DesignMode = "template" | "custom";
type SlideLayout = "cover" | "editorial" | "split" | "quote" | "closing";
type Palette = {
  background: string;
  primary: string;
  accent: string;
  text: string;
  muted: string;
};
type CarouselDesign = Palette & {
  style: string;
  typography: string;
  composition: string;
};
type CarouselSettings = {
  objective: string;
  audience: string;
  slideCount: number;
  tone: string;
  aspectRatio: AspectRatio;
  designMode: DesignMode;
  template: string;
  palette: Palette;
};
type CarouselSlide = {
  id: string;
  title: string;
  text: string;
  visual: string;
  composition: string;
  layout: SlideLayout;
};
type CarouselProject = {
  version: 1;
  title: string;
  topic: string;
  settings: CarouselSettings;
  strategy: string;
  design: CarouselDesign;
  slides: CarouselSlide[];
};
type GeneratedSlide = Omit<CarouselSlide, "id" | "layout">;
type ProjectRecord = Pick<HistoryRecord, "id" | "title" | "content" | "createdAt">;

const templates: { id: string; name: string; description: string; style: string; typography: string; composition: string; palette: Palette }[] = [
  {
    id: "dra-premium",
    name: "DRA Premium",
    description: "Preto, dourado e creme com acabamento editorial.",
    style: "Editorial premium DRA",
    typography: "Sans-serif geométrica com títulos fortes",
    composition: "Hierarquia editorial com respiro e detalhes dourados",
    palette: { background: "#11100f", primary: "#d5ad62", accent: "#f0d99b", text: "#fffaf0", muted: "#c5bda9" },
  },
  {
    id: "editorial-claro",
    name: "Editorial claro",
    description: "Creme, grafite e vermelho DRA em composição limpa.",
    style: "Editorial jurídico contemporâneo",
    typography: "Serifada editorial nos títulos e sans-serif no texto",
    composition: "Coluna única, margens amplas e acentos em vermelho",
    palette: { background: "#f5f0e7", primary: "#211d19", accent: "#b3282e", text: "#171513", muted: "#635c52" },
  },
  {
    id: "contraste-moderno",
    name: "Contraste moderno",
    description: "Grafite profundo, branco e vermelho em blocos fortes.",
    style: "Moderno e contrastado",
    typography: "Sans-serif condensada nos títulos e sans-serif no corpo",
    composition: "Blocos gráficos assimétricos com leitura direta",
    palette: { background: "#101214", primary: "#ed3b43", accent: "#ff7d67", text: "#f7f7f7", muted: "#c3c6cb" },
  },
  {
    id: "acolhedor",
    name: "Acolhedor",
    description: "Tons quentes e suaves com leitura confortável.",
    style: "Editorial acolhedor",
    typography: "Serifada humanista nos títulos e sans-serif no corpo",
    composition: "Composição equilibrada com formas suaves",
    palette: { background: "#28201e", primary: "#e5aa83", accent: "#f3d9bd", text: "#fff8ef", muted: "#ddc8b7" },
  },
];

const tones = ["profissional", "educativo", "acolhedor", "direto", "formal"] as const;
const layouts: { id: SlideLayout; label: string }[] = [
  { id: "editorial", label: "Editorial" },
  { id: "split", label: "Dividido" },
  { id: "quote", label: "Citação" },
];
const maxSlideCount = 20;

function isPalette(value: unknown): value is Palette {
  if (!value || typeof value !== "object") return false;
  const palette = value as Record<string, unknown>;
  return ["background", "primary", "accent", "text", "muted"].every(
    (key) => typeof palette[key] === "string" && /^#[\da-f]{6}$/i.test(palette[key] as string),
  );
}

function parseProjectRecord(record: ProjectRecord): CarouselProject | null {
  try {
    const parsed: unknown = JSON.parse(record.content);
    if (!parsed || typeof parsed !== "object") return null;
    const project = parsed as CarouselProject;
    if (
      project.version !== 1 ||
      typeof project.title !== "string" ||
      typeof project.topic !== "string" ||
      !Array.isArray(project.slides) ||
      project.slides.length < 1 ||
      !isPalette(project.design) ||
      typeof project.design.style !== "string" ||
      typeof project.design.typography !== "string" ||
      typeof project.design.composition !== "string" ||
      typeof project.strategy !== "string" ||
      !project.settings ||
      typeof project.settings.objective !== "string" ||
      typeof project.settings.audience !== "string" ||
      typeof project.settings.slideCount !== "number" ||
      !Number.isInteger(project.settings.slideCount) ||
      project.settings.slideCount < 5 ||
      project.settings.slideCount > maxSlideCount ||
      !tones.includes(project.settings.tone as (typeof tones)[number]) ||
      !["template", "custom"].includes(project.settings.designMode) ||
      !templates.some((item) => item.id === project.settings.template) ||
      !["4:5", "1:1"].includes(project.settings.aspectRatio) ||
      !isPalette(project.settings.palette) ||
      !project.slides.every((slide) =>
        slide && typeof slide.id === "string" && typeof slide.title === "string" &&
        typeof slide.text === "string" && typeof slide.visual === "string" &&
        typeof slide.composition === "string" &&
        ["cover", "editorial", "split", "quote", "closing"].includes(slide.layout),
      )
    ) return null;
    return project;
  } catch {
    return null;
  }
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(value: string, maxCharacters: number, maxLines: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxCharacters && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = candidate;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    const last = lines[maxLines - 1] ?? "";
    lines[maxLines - 1] = `${last.replace(/[.,;:!?]?$/, "")}…`;
  }
  return lines;
}

function svgLines(text: string, x: number, y: number, lineHeight: number, maxCharacters: number, maxLines: number, className: string) {
  return wrapText(text, maxCharacters, maxLines)
    .map((line, index) => `<tspan x="${x}" y="${y + index * lineHeight}" class="${className}">${escapeXml(line)}</tspan>`)
    .join("");
}

function illustrationFor(description: string, width: number, height: number, primary: string, accent: string) {
  const visual = description.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  const x = width - 190;
  const y = height * 0.47;
  if (/document|papel|arquivo|formulario|processo|pasta/.test(visual)) {
    return `<rect x="${x - 55}" y="${y - 82}" width="110" height="150" rx="8" fill="none" stroke="${primary}" stroke-width="5"/><path d="M${x - 30} ${y - 38}h62m-62 28h62m-62 28h45" stroke="${accent}" stroke-width="5" stroke-linecap="round"/><circle cx="${x + 38}" cy="${y + 60}" r="22" fill="${accent}"/>`;
  }
  if (/balanca|equilibrio|justica/.test(visual)) {
    return `<path d="M${x} ${y - 75}v145m-60 -98h120m-60 -42 12 12-12 12-12-12Z" fill="none" stroke="${primary}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="m${x - 44} ${y - 26}-28 54h56Zm116 0-28 54h56Z" fill="none" stroke="${accent}" stroke-width="5" stroke-linejoin="round"/><path d="M${x - 40} ${y + 74}h80" stroke="${primary}" stroke-width="7" stroke-linecap="round"/>`;
  }
  if (/pessoa|familia|militar|cliente|publico|aposentad/.test(visual)) {
    return `<circle cx="${x}" cy="${y - 42}" r="28" fill="none" stroke="${primary}" stroke-width="6"/><path d="M${x - 52} ${y + 70}c3-42 23-63 52-63s49 21 52 63" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round"/><circle cx="${x + 80}" cy="${y - 10}" r="16" fill="${primary}" opacity=".72"/>`;
  }
  return `<circle cx="${x}" cy="${y}" r="70" fill="none" stroke="${primary}" stroke-width="4" opacity=".8"/><circle cx="${x}" cy="${y}" r="38" fill="none" stroke="${accent}" stroke-width="4"/><path d="M${x - 104} ${y}h208m-104 -104v208" stroke="${primary}" stroke-width="3" opacity=".6"/><circle cx="${x}" cy="${y}" r="11" fill="${accent}"/>`;
}

function renderSlideSvg(project: CarouselProject, slide: CarouselSlide, index: number) {
  const width = 1080;
  const height = project.settings.aspectRatio === "4:5" ? 1350 : 1080;
  const { background, primary, accent, text, muted } = project.design;
  const isCover = slide.layout === "cover" || index === 0;
  const isClosing = slide.layout === "closing" || index === project.slides.length - 1;
  const isSplit = slide.layout === "split";
  const isQuote = slide.layout === "quote";
  const left = isSplit ? 112 : 92;
  const titleY = isCover ? height * 0.3 : height * 0.26;
  const titleSize = isCover ? 76 : 66;
  const titleLineHeight = titleSize * 1.15;
  const titleTextLines = wrapText(slide.title, isCover ? 23 : 26, 3);
  const bodyY = titleY + Math.max(2, titleTextLines.length) * titleLineHeight + 66;
  const titleLines = titleTextLines.map((line, lineIndex) => `<tspan x="${left}" y="${titleY + lineIndex * titleLineHeight}" class="headline">${escapeXml(line)}</tspan>`).join("");
  const bodyLines = svgLines(slide.text, left, bodyY, 46, 39, project.settings.aspectRatio === "1:1" ? 5 : 8, "body");
  const pageNumber = `${String(index + 1).padStart(2, "0")} / ${String(project.slides.length).padStart(2, "0")}`;
  const art = `${isSplit ? `<rect x="${width - 270}" y="0" width="270" height="${height}" fill="${primary}" opacity=".14"/>` : ""}${isQuote ? `<path d="M${width - 210} ${height * 0.26}h92v92" fill="none" stroke="${accent}" stroke-width="8" opacity=".8"/>` : ""}${illustrationFor(slide.visual, width, height, primary, accent)}`;
  const displayFont = project.design.typography.toLowerCase().includes("serif") ? "Georgia,serif" : "Arial,Helvetica,sans-serif";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="${width}" height="${height}" fill="${background}"/>
<path d="M0 0H${width}V${height * 0.2}C${width * 0.68} ${height * 0.28} ${width * 0.32} ${height * 0.15} 0 ${height * 0.32}Z" fill="${primary}" opacity=".09"/>
<rect x="0" y="0" width="16" height="${height}" fill="${primary}"/>
${art}
<text x="${left}" y="94" class="brand">DRA <tspan fill="${accent}">·</tspan> CONTEÚDO EDUCATIVO</text>
<text x="${left}" y="178" class="kicker">${isCover ? "GUIA INFORMATIVO" : isClosing ? "EM RESUMO" : `PONTO ${String(index + 1).padStart(2, "0")}`}</text>
<text>${titleLines}</text>
<text>${bodyLines}</text>
<path d="M${left} ${height - 145}h${width - left * 2}" stroke="${primary}" stroke-width="2" opacity=".55"/>
<text x="${left}" y="${height - 92}" class="footer">DRA · INFORMAÇÃO COM RESPONSABILIDADE</text>
<text x="${width - left}" y="${height - 92}" text-anchor="end" class="number">${pageNumber}</text>
<style>
  .brand{font:700 26px ${displayFont};letter-spacing:4px;fill:${text}}
  .kicker{font:700 20px ${displayFont};letter-spacing:5px;fill:${primary}}
  .headline{font:700 ${titleSize}px ${displayFont};letter-spacing:-2px;fill:${text}}
  .body{font:400 36px Arial,Helvetica,sans-serif;fill:${muted}}
  .footer{font:400 18px Arial,Helvetica,sans-serif;fill:${muted}}
  .number{font:700 18px Arial,Helvetica,sans-serif;letter-spacing:2px;fill:${primary}}
</style>
</svg>`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function renderPng(project: CarouselProject, slide: CarouselSlide, index: number) {
  const width = 1080;
  const height = project.settings.aspectRatio === "4:5" ? 1350 : 1080;
  const svgBlob = new Blob([renderSlideSvg(project, slide, index)], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  try {
    const image = new window.Image();
    image.src = svgUrl;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Este navegador não disponibilizou o canvas para exportação.");
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Não foi possível converter o slide em PNG.")), "image/png");
    });
    return blob;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function serializeProject(project: CarouselProject) {
  return JSON.stringify(project);
}

export default function CarouselStudio({
  projects,
  onSave,
  onDeleteProject,
  onRegisterFlush,
  storageError,
}: {
  projects: ProjectRecord[];
  onSave: (id: string | null, title: string, content: string) => Promise<string | null>;
  onDeleteProject: (id: string) => Promise<void>;
  onRegisterFlush: (flush: () => Promise<boolean>) => () => void;
  storageError: string;
}) {
  const [topic, setTopic] = useState("");
  const [objective, setObjective] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<(typeof tones)[number]>("educativo");
  const [slideCount, setSlideCount] = useState("7");
  const [customCount, setCustomCount] = useState(12);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("4:5");
  const [designMode, setDesignMode] = useState<DesignMode>("template");
  const [template, setTemplate] = useState(templates[0].id);
  const [project, setProject] = useState<CarouselProject | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [largePreview, setLargePreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const latestProject = useRef<CarouselProject | null>(null);
  const selectedTemplate = templates.find((item) => item.id === template) ?? templates[0];
  const selectedSlide = project?.slides.find((slide) => slide.id === selectedSlideId) ?? project?.slides[0] ?? null;
  const validProjects = useMemo(() => projects.map((record) => ({ record, project: parseProjectRecord(record) })).filter(
    (item): item is { record: ProjectRecord; project: CarouselProject } => item.project !== null,
  ), [projects]);

  const settings = useCallback((): CarouselSettings => ({
    objective: objective.trim(),
    audience: audience.trim(),
    slideCount: slideCount === "custom" ? customCount : Number(slideCount),
    tone,
    aspectRatio,
    designMode,
    template,
    palette: selectedTemplate.palette,
  }), [objective, audience, slideCount, customCount, tone, aspectRatio, designMode, template, selectedTemplate.palette]);

  useEffect(() => {
    latestProject.current = project;
  }, [project]);

  const persist = useCallback(async (nextProject: CarouselProject, id: string | null) => {
    setSaving(true);
    const nextId = await onSave(id, nextProject.title.trim() || "Carrossel sem título", serializeProject(nextProject));
    setSaving(false);
    if (!nextId) {
      setError("O carrossel está disponível, mas não foi possível salvá-lo no histórico deste dispositivo.");
      return null;
    }
    setProjectId(nextId);
    setDirty(false);
    setNotice("Carrossel salvo neste dispositivo.");
    return nextId;
  }, [onSave]);

  const flushPendingChanges = useCallback(async () => {
    if (!project || !dirty) return true;
    return !!(await persist(project, projectId));
  }, [project, dirty, persist, projectId]);

  useEffect(() => onRegisterFlush(flushPendingChanges), [onRegisterFlush, flushPendingChanges]);

  useEffect(() => {
    if (!project || !projectId || !dirty || saving) return;
    const snapshot = serializeProject(project);
    const timer = window.setTimeout(() => {
      void (async () => {
        setSaving(true);
        const result = await onSave(projectId, project.title.trim() || "Carrossel sem título", snapshot);
        setSaving(false);
        if (!result) {
          setError("Não foi possível salvar as alterações. Tente salvar novamente.");
          return;
        }
        if (latestProject.current && serializeProject(latestProject.current) === snapshot) {
          setDirty(false);
          setNotice("Alterações salvas automaticamente.");
        }
      })();
    }, 900);
    return () => window.clearTimeout(timer);
  }, [project, projectId, dirty, saving, onSave]);

  useEffect(() => {
    if (!dirty) return;
    const warnBeforeClose = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeClose);
    return () => window.removeEventListener("beforeunload", warnBeforeClose);
  }, [dirty]);

  function updateProject(update: (current: CarouselProject) => CarouselProject) {
    setProject((current) => current ? update(current) : current);
    setDirty(true);
    setNotice("");
  }

  async function generate() {
    if (!topic.trim()) {
      setError("Informe o tema do carrossel.");
      return;
    }
    if (!objective.trim() || !audience.trim()) {
      setError("Preencha o objetivo e o público-alvo para orientar os slides.");
      return;
    }
    const config = settings();
    if (config.slideCount < 5 || config.slideCount > maxSlideCount) {
      setError(`Escolha entre 5 e ${maxSlideCount} slides.`);
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "Carrosséis", topic: topic.trim(), carousel: config }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message = data && typeof data === "object" && "error" in data && typeof data.error === "string"
          ? data.error
          : "Não foi possível gerar o carrossel.";
        throw new Error(message);
      }
      if (!data || typeof data !== "object" || !("slides" in data) || !Array.isArray(data.slides) ||
        !("design" in data) || !data.design || typeof data.design !== "object" ||
        !("strategy" in data) || typeof data.strategy !== "string") {
        throw new Error("A resposta da IA não contém um carrossel completo.");
      }

      const rawSlides = data.slides as GeneratedSlide[];
      const rawDesign = data.design as CarouselDesign;
      if (rawSlides.length !== config.slideCount ||
        !rawSlides.every((slide) => slide && typeof slide.title === "string" && typeof slide.text === "string" && typeof slide.visual === "string" && typeof slide.composition === "string") ||
        !isPalette(rawDesign) || typeof rawDesign.style !== "string" || typeof rawDesign.typography !== "string" || typeof rawDesign.composition !== "string") {
        throw new Error("A IA retornou uma estrutura incompleta. Tente gerar novamente.");
      }

      const generatedProject: CarouselProject = {
        version: 1,
        title: topic.trim().slice(0, 90),
        topic: topic.trim(),
        settings: config,
        strategy: data.strategy,
        design: {
          ...rawDesign,
          ...(config.designMode === "template"
            ? {
              ...selectedTemplate.palette,
              style: selectedTemplate.style,
              typography: selectedTemplate.typography,
              composition: selectedTemplate.composition,
            }
            : {}),
        },
        slides: rawSlides.map((slide, index) => ({
          ...slide,
          id: crypto.randomUUID(),
          layout: index === 0 ? "cover" : index === rawSlides.length - 1 ? "closing" : "editorial",
        })),
      };
      setProject(generatedProject);
      setProjectId(null);
      setSelectedSlideId(generatedProject.slides[0]?.id ?? null);
      setDirty(true);
      const savedId = await persist(generatedProject, null);
      if (savedId) setDirty(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível gerar o carrossel.");
    } finally {
      setLoading(false);
    }
  }

  async function loadProject(record: ProjectRecord, saved: CarouselProject) {
    if (dirty && project && !(await flushPendingChanges())) return;
    setProject(saved);
    setProjectId(record.id);
    setTopic(saved.topic);
    setObjective(saved.settings.objective);
    setAudience(saved.settings.audience);
    setTone(saved.settings.tone as (typeof tones)[number]);
    setSlideCount(saved.settings.slideCount >= 5 && saved.settings.slideCount <= 10 ? String(saved.settings.slideCount) : "custom");
    setCustomCount(saved.settings.slideCount);
    setAspectRatio(saved.settings.aspectRatio);
    setDesignMode(saved.settings.designMode);
    setTemplate(saved.settings.template);
    setSelectedSlideId(saved.slides[0]?.id ?? null);
    setDirty(false);
    setError("");
    setNotice(`Projeto “${record.title}” aberto.`);
  }

  async function duplicateProject() {
    if (!project) return;
    const duplicate = { ...project, title: `${project.title} (cópia)`, slides: project.slides.map((slide) => ({ ...slide, id: crypto.randomUUID() })) };
    setProject(duplicate);
    setProjectId(null);
    setSelectedSlideId(duplicate.slides[0]?.id ?? null);
    setDirty(true);
    const savedId = await persist(duplicate, null);
    if (savedId) setNotice("Cópia criada e salva no histórico.");
  }

  async function deleteSavedProject(id: string) {
    await onDeleteProject(id);
    if (id === projectId) {
      setProjectId(null);
      setDirty(true);
      setNotice("Projeto excluído. A cópia aberta continua disponível; salve-a para preservá-la.");
    }
  }

  async function regenerateSlide() {
    if (!project || !selectedSlide || regenerating) return;
    setRegenerating(true);
    setError("");
    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "Carrosséis",
          mode: "regenerate-carousel-slide",
          topic: project.topic,
          carousel: project.settings,
          carouselDesign: project.design,
          carouselSlides: project.slides,
          slideIndex: project.slides.findIndex((slide) => slide.id === selectedSlide.id),
        }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message = data && typeof data === "object" && "error" in data && typeof data.error === "string"
          ? data.error
          : "Não foi possível regenerar este slide.";
        throw new Error(message);
      }
      if (!data || typeof data !== "object" || !("slide" in data) || !data.slide || typeof data.slide !== "object") {
        throw new Error("A resposta da IA não contém um slide válido.");
      }
      const next = data.slide as GeneratedSlide;
      if (![next.title, next.text, next.visual, next.composition].every((value) => typeof value === "string")) {
        throw new Error("A IA retornou um slide incompleto.");
      }
      updateProject((current) => ({
        ...current,
        slides: current.slides.map((slide) => slide.id === selectedSlide.id ? { ...slide, ...next } : slide),
      }));
      setNotice("Slide regenerado. A identidade visual do carrossel foi preservada.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível regenerar este slide.");
    } finally {
      setRegenerating(false);
    }
  }

  async function downloadSlide(slide: CarouselSlide, index: number) {
    if (!project) return;
    setExporting(true);
    setError("");
    try {
      const png = await renderPng(project, slide, index);
      downloadBlob(png, `dra-carrossel-${String(index + 1).padStart(2, "0")}.png`);
      setNotice(`Slide ${index + 1} exportado em PNG (${project.settings.aspectRatio === "4:5" ? "1080×1350" : "1080×1080"}).`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível exportar o slide.");
    } finally {
      setExporting(false);
    }
  }

  async function downloadAllSlides() {
    if (!project) return;
    setExporting(true);
    setError("");
    try {
      const files: { name: string; data: Uint8Array }[] = [];
      for (const [index, slide] of project.slides.entries()) {
        const png = await renderPng(project, slide, index);
        files.push({ name: `slide-${String(index + 1).padStart(2, "0")}.png`, data: new Uint8Array(await png.arrayBuffer()) });
      }
      downloadBlob(createZipArchive(files), "dra-carrossel-slides.zip");
      setNotice(`${files.length} slides exportados em PNG dentro de um arquivo ZIP.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível exportar os slides.");
    } finally {
      setExporting(false);
    }
  }

  function duplicateSlide(slide: CarouselSlide) {
    if (!project || project.slides.length >= maxSlideCount) return;
    const index = project.slides.findIndex((item) => item.id === slide.id);
    const copy = { ...slide, id: crypto.randomUUID(), title: `${slide.title} (cópia)`, layout: "editorial" as const };
    updateProject((current) => ({
      ...current,
      settings: { ...current.settings, slideCount: current.slides.length + 1 },
      slides: [...current.slides.slice(0, index + 1), copy, ...current.slides.slice(index + 1)],
    }));
    setSelectedSlideId(copy.id);
  }

  function deleteSlide(slide: CarouselSlide) {
    if (!project || project.slides.length <= 5) return;
    const index = project.slides.findIndex((item) => item.id === slide.id);
    const nextSlides = project.slides.filter((item) => item.id !== slide.id);
    updateProject((current) => ({
      ...current,
      settings: { ...current.settings, slideCount: nextSlides.length },
      slides: nextSlides,
    }));
    setSelectedSlideId(nextSlides[Math.max(0, index - 1)]?.id ?? nextSlides[0]?.id ?? null);
  }

  function moveSlide(slide: CarouselSlide, direction: -1 | 1) {
    if (!project) return;
    const index = project.slides.findIndex((item) => item.id === slide.id);
    const destination = index + direction;
    if (destination < 0 || destination >= project.slides.length) return;
    updateProject((current) => {
      const reordered = [...current.slides];
      [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
      return {
        ...current,
        slides: reordered.map((item, position) => ({
          ...item,
          layout: position === 0 ? "cover" : position === reordered.length - 1 ? "closing" : item.layout === "cover" || item.layout === "closing" ? "editorial" : item.layout,
        })),
      };
    });
  }

  function updateSlide(update: Partial<CarouselSlide>) {
    if (!selectedSlide) return;
    updateProject((current) => ({
      ...current,
      slides: current.slides.map((slide) => slide.id === selectedSlide.id ? { ...slide, ...update } : slide),
    }));
  }

  return (
    <section className="mx-auto max-w-6xl">
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-red-400">Produção visual</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Criador de Carrosséis</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">
          Planeje, edite e exporte carrosséis educativos com identidade visual consistente. O conteúdo é salvo neste navegador.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5 rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 sm:p-7">
          <div>
            <label htmlFor="carousel-topic" className="mb-2 block text-sm font-semibold">Tema ou assunto *</label>
            <textarea id="carousel-topic" value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={5000} rows={2}
              placeholder="Ex.: como entender as regras de isenção de imposto de renda"
              className="w-full resize-y rounded-xl border border-white/10 bg-black p-3 text-sm leading-6 outline-none placeholder:text-white/25 focus:border-red-500" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="carousel-objective" className="mb-2 block text-sm font-semibold">Objetivo da publicação *</label>
              <textarea id="carousel-objective" value={objective} onChange={(event) => setObjective(event.target.value)} maxLength={1000} rows={3}
                placeholder="O que o público deve aprender?"
                className="w-full resize-y rounded-xl border border-white/10 bg-black p-3 text-sm leading-6 outline-none placeholder:text-white/25 focus:border-red-500" />
            </div>
            <div>
              <label htmlFor="carousel-audience" className="mb-2 block text-sm font-semibold">Público-alvo *</label>
              <textarea id="carousel-audience" value={audience} onChange={(event) => setAudience(event.target.value)} maxLength={1000} rows={3}
                placeholder="Ex.: militares da reserva e pensionistas"
                className="w-full resize-y rounded-xl border border-white/10 bg-black p-3 text-sm leading-6 outline-none placeholder:text-white/25 focus:border-red-500" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="carousel-count" className="mb-2 block text-sm font-semibold">Quantidade de slides</label>
              <select id="carousel-count" value={slideCount} onChange={(event) => setSlideCount(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm outline-none focus:border-red-500">
                {Array.from({ length: 6 }, (_, index) => index + 5).map((count) => <option key={count} value={count}>{count} slides</option>)}
                <option value="custom">Personalizada</option>
              </select>
              {slideCount === "custom" && <input aria-label="Quantidade personalizada de slides" type="number" min={5} max={maxSlideCount} value={customCount} onChange={(event) => setCustomCount(Math.max(5, Math.min(maxSlideCount, Number(event.target.value) || 5)))} className="mt-2 w-full rounded-xl border border-white/10 bg-black p-3 text-sm outline-none focus:border-red-500" />}
            </div>
            <div>
              <label htmlFor="carousel-tone" className="mb-2 block text-sm font-semibold">Tom de comunicação</label>
              <select id="carousel-tone" value={tone} onChange={(event) => setTone(event.target.value as (typeof tones)[number])}
                className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm outline-none focus:border-red-500">
                {tones.map((item) => <option key={item} value={item}>{item[0]?.toUpperCase()}{item.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="carousel-ratio" className="mb-2 block text-sm font-semibold">Formato</label>
              <select id="carousel-ratio" value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value as AspectRatio)}
                className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm outline-none focus:border-red-500">
                <option value="4:5">Instagram vertical · 4:5</option>
                <option value="1:1">Instagram quadrado · 1:1</option>
              </select>
            </div>
            <div>
              <label htmlFor="carousel-design-mode" className="mb-2 block text-sm font-semibold">Tipo de design</label>
              <select id="carousel-design-mode" value={designMode} onChange={(event) => setDesignMode(event.target.value as DesignMode)}
                className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm outline-none focus:border-red-500">
                <option value="template">Modelo pronto</option>
                <option value="custom">Personalizado com IA</option>
              </select>
            </div>
          </div>

          {designMode === "template" ? (
            <div>
              <p className="mb-3 text-sm font-semibold">Biblioteca de modelos</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {templates.map((item) => (
                  <button type="button" key={item.id} onClick={() => setTemplate(item.id)}
                    aria-pressed={template === item.id}
                    className={`rounded-xl border p-3 text-left transition ${template === item.id ? "border-red-500/60 bg-red-500/[.08]" : "border-white/10 bg-black/30 hover:border-white/25"}`}>
                    <span className="flex items-center gap-2">
                      {Object.values(item.palette).slice(0, 4).map((color, index) => <i key={`${item.id}-${index}`} aria-hidden="true" className="h-5 w-5 rounded-full border border-white/20" style={{ backgroundColor: color }} />)}
                      <strong className="ml-1 text-sm">{item.name}</strong>
                    </span>
                    <span className="mt-2 block text-xs leading-5 text-white/45">{item.description}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-violet-500/20 bg-violet-500/[.06] p-3 text-sm leading-6 text-violet-100/80">
              A IA vai propor paleta, estilo, tipografia e composição próprios para o tema. Você poderá ajustar cores e elementos depois da geração.
            </p>
          )}

          {!project && error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
          {!project && notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
          {storageError && <p role="status" className="text-xs text-amber-200">Histórico local: {storageError}</p>}
          <button type="button" onClick={() => void generate()} disabled={loading || !topic.trim()}
            className="w-full rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Criando estratégia e slides..." : "✦ Gerar carrossel"}
          </button>
          {loading && <p className="text-center text-xs text-white/40">Organizando a sequência, a identidade visual e os textos de cada slide…</p>}
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5">
            <h2 className="font-bold">Projetos salvos</h2>
            {validProjects.length === 0 ? (
              <p className="mt-2 text-sm leading-6 text-white/45">Carrosséis salvos neste navegador aparecerão aqui.</p>
            ) : (
              <div className="mt-3 max-h-80 space-y-2 overflow-auto">
                {validProjects.map(({ record, project: saved }) => (
                  <div key={record.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                    <p className="truncate text-sm font-semibold">{record.title}</p>
                    <p className="mt-1 text-xs text-white/40">{saved.slides.length} slides · {saved.settings.aspectRatio}</p>
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => void loadProject(record, saved)} className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs hover:border-red-500/50">Abrir</button>
                      <button type="button" onClick={() => void deleteSavedProject(record.id)} className="rounded-lg border border-red-500/25 px-2.5 py-1.5 text-xs text-red-200 hover:bg-red-500/10">Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[.05] p-5">
            <h2 className="font-bold text-amber-100">Revisão editorial</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">A IA não substitui a revisão jurídica. Confirme leis, requisitos e afirmações específicas antes de publicar.</p>
          </section>
        </aside>
      </div>

      {project && (
        <section className="mt-9 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-red-400">Editor visual</p>
              <label htmlFor="carousel-project-title" className="sr-only">Nome do projeto</label>
              <input id="carousel-project-title" value={project.title} onChange={(event) => updateProject((current) => ({ ...current, title: event.target.value }))}
                className="mt-2 w-full max-w-2xl border-b border-white/15 bg-transparent py-2 text-2xl font-black outline-none focus:border-red-500 sm:text-3xl" />
              <p className="mt-2 text-sm text-white/45">{project.slides.length} slides · {project.settings.aspectRatio === "4:5" ? "1080×1350 px" : "1080×1080 px"} · {project.design.style}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void persist(project, projectId)} disabled={saving} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold hover:border-red-500/50 disabled:opacity-50">{saving ? "Salvando…" : dirty ? "Salvar alterações" : "Salvo"}</button>
              <button type="button" onClick={() => void duplicateProject()} disabled={saving} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold hover:border-red-500/50">Duplicar projeto</button>
              <button type="button" onClick={() => void downloadAllSlides()} disabled={exporting} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold hover:bg-red-500 disabled:opacity-50">{exporting ? "Exportando…" : "Exportar ZIP"}</button>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
            <div className="min-w-0">
              <p className="mb-3 rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm leading-6 text-white/60"><strong className="text-white">Estratégia:</strong> {project.strategy}</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-4">
                {project.slides.map((slide, index) => (
                  <article key={slide.id} className={`min-w-0 rounded-xl border p-2 transition ${selectedSlide?.id === slide.id ? "border-red-500/70 bg-red-500/[.04]" : "border-white/10 bg-[#0d0d0d]"}`}>
                    <button type="button" onClick={() => setSelectedSlideId(slide.id)} aria-label={`Editar slide ${index + 1}`}
                      className="block w-full overflow-hidden rounded-lg bg-black text-left">
                      <Image src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderSlideSvg(project, slide, index))}`} alt={`Prévia do slide ${index + 1}: ${slide.title}`}
                        width={1080} height={project.settings.aspectRatio === "4:5" ? 1350 : 1080} unoptimized className="block h-auto w-full" />
                    </button>
                    <p className="mt-2 truncate text-xs font-semibold">{String(index + 1).padStart(2, "0")} · {slide.title}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <button type="button" onClick={() => moveSlide(slide, -1)} disabled={index === 0} aria-label={`Mover slide ${index + 1} para cima`} className="rounded-md border border-white/10 px-2 py-1 text-xs disabled:opacity-30">↑</button>
                      <button type="button" onClick={() => moveSlide(slide, 1)} disabled={index === project.slides.length - 1} aria-label={`Mover slide ${index + 1} para baixo`} className="rounded-md border border-white/10 px-2 py-1 text-xs disabled:opacity-30">↓</button>
                      <button type="button" onClick={() => duplicateSlide(slide)} disabled={project.slides.length >= maxSlideCount} className="rounded-md border border-white/10 px-2 py-1 text-xs disabled:opacity-30">Duplicar</button>
                      <button type="button" onClick={() => deleteSlide(slide)} disabled={project.slides.length <= 5} className="rounded-md border border-red-500/20 px-2 py-1 text-xs text-red-200 disabled:opacity-30">Excluir</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {selectedSlide && (
              <aside className="h-fit space-y-4 rounded-2xl border border-white/10 bg-[#0d0d0d] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-bold">Editar slide {project.slides.findIndex((slide) => slide.id === selectedSlide.id) + 1}</h2>
                  <button type="button" onClick={() => setLargePreview(true)} className="rounded-lg border border-white/15 px-3 py-2 text-xs hover:border-red-500/50">Ampliar</button>
                </div>
                <div>
                  <label htmlFor="edit-slide-title" className="mb-2 block text-xs font-semibold text-white/65">Título</label>
                  <textarea id="edit-slide-title" value={selectedSlide.title} onChange={(event) => updateSlide({ title: event.target.value })} rows={2} maxLength={200} className="w-full resize-y rounded-xl border border-white/10 bg-black p-3 text-sm outline-none focus:border-red-500" />
                </div>
                <div>
                  <label htmlFor="edit-slide-text" className="mb-2 block text-xs font-semibold text-white/65">Texto do slide</label>
                  <textarea id="edit-slide-text" value={selectedSlide.text} onChange={(event) => updateSlide({ text: event.target.value })} rows={5} maxLength={1200} className="w-full resize-y rounded-xl border border-white/10 bg-black p-3 text-sm leading-6 outline-none focus:border-red-500" />
                </div>
                <div>
                  <label htmlFor="edit-slide-visual" className="mb-2 block text-xs font-semibold text-white/65">Ideia visual / elementos</label>
                  <textarea id="edit-slide-visual" value={selectedSlide.visual} onChange={(event) => updateSlide({ visual: event.target.value })} rows={2} maxLength={300} className="w-full resize-y rounded-xl border border-white/10 bg-black p-3 text-sm leading-5 outline-none focus:border-red-500" />
                </div>
                <div>
                  <label htmlFor="edit-slide-composition" className="mb-2 block text-xs font-semibold text-white/65">Orientação de composição</label>
                  <textarea id="edit-slide-composition" value={selectedSlide.composition} onChange={(event) => updateSlide({ composition: event.target.value })} rows={2} maxLength={300} className="w-full resize-y rounded-xl border border-white/10 bg-black p-3 text-sm leading-5 outline-none focus:border-red-500" />
                </div>
                <div>
                  <label htmlFor="edit-slide-layout" className="mb-2 block text-xs font-semibold text-white/65">Composição do slide</label>
                  <select id="edit-slide-layout" value={selectedSlide.layout} onChange={(event) => updateSlide({ layout: event.target.value as SlideLayout })} className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm outline-none focus:border-red-500">
                    <option value="cover">Capa</option>
                    {layouts.map((layout) => <option key={layout.id} value={layout.id}>{layout.label}</option>)}
                    <option value="closing">Fechamento</option>
                  </select>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-white/65">Cores do carrossel</p>
                  <div className="grid grid-cols-5 gap-2">
                    {([
                      ["background", "Fundo"],
                      ["primary", "Primária"],
                      ["accent", "Destaque"],
                      ["text", "Texto"],
                      ["muted", "Secundária"],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="flex min-w-0 flex-col items-center gap-1 text-[10px] text-white/45">
                        <input type="color" aria-label={`Cor ${label}`} value={project.design[key]} onChange={(event) => updateProject((current) => ({ ...current, design: { ...current.design, [key]: event.target.value } }))} className="h-9 w-full cursor-pointer rounded border border-white/15 bg-black p-1" />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => void regenerateSlide()} disabled={regenerating} className="rounded-xl border border-violet-400/30 px-3 py-2.5 text-xs font-semibold text-violet-100 hover:bg-violet-400/10 disabled:opacity-50">{regenerating ? "Regenerando…" : "✦ Regenerar com IA"}</button>
                  <button type="button" onClick={() => void downloadSlide(selectedSlide, project.slides.findIndex((slide) => slide.id === selectedSlide.id))} disabled={exporting} className="rounded-xl border border-white/15 px-3 py-2.5 text-xs font-semibold hover:border-red-500/50 disabled:opacity-50">Exportar PNG</button>
                </div>
                <p className="text-[11px] leading-5 text-white/35">Textos, cores e organização são salvos automaticamente. A exportação contém somente a arte do slide.</p>
              </aside>
            )}
          </div>

          {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
          {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
        </section>
      )}

      {largePreview && project && selectedSlide && (
        <div role="presentation" onClick={() => setLargePreview(false)} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4">
          <div role="dialog" aria-modal="true" aria-label="Pré-visualização ampliada do slide" onClick={(event) => event.stopPropagation()} className="relative max-h-full max-w-3xl overflow-auto rounded-2xl border border-white/15 bg-[#0d0d0d] p-3">
            <button type="button" onClick={() => setLargePreview(false)} className="mb-3 rounded-lg border border-white/15 px-3 py-2 text-xs">Fechar</button>
            <Image src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderSlideSvg(project, selectedSlide, project.slides.findIndex((slide) => slide.id === selectedSlide.id)))}`} alt={`Slide ampliado: ${selectedSlide.title}`} width={1080} height={project.settings.aspectRatio === "4:5" ? 1350 : 1080} unoptimized className="block h-auto max-h-[82vh] w-auto max-w-full" />
          </div>
        </div>
      )}
    </section>
  );
}
