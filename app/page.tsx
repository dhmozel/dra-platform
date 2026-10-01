"use client";

import { useEffect, useState } from "react";

type Page =
  | "Início"
  | "Meu Perfil"
  | "Thumbnail"
  | "Conteúdo"
  | "Roteiro"
  | "DRA IA"
  | "Palavras-chave"
  | "Histórico";

const menuPrincipal = [
  { name: "Início", icon: "⌂" },
  { name: "Meu Perfil", icon: "♙" },
];

const menuCriacao = [
  { name: "Conteúdo", icon: "✎" },
  { name: "Roteiro", icon: "▤" },
  { name: "Thumbnail", icon: "▧" },
  { name: "DRA IA", icon: "✦" },
];

export default function Home() {
  const [page, setPage] = useState<Page>("Início");

  return (
    <div className="min-h-screen bg-[#060606] text-white">
      <Sidebar page={page} setPage={setPage} />

      <div className="ml-[245px] min-h-screen">
        <Topbar />

        {page === "Início" && <Dashboard setPage={setPage} />}
        {page === "Meu Perfil" && <Profile />}
        {page === "Thumbnail" && <Thumbnail />}
        {page === "Conteúdo" && <ContentGenerator />}
        {page === "Roteiro" && <ScriptGenerator />}
        {page === "DRA IA" && <DraAI />}
        {page === "Palavras-chave" && <Keywords />}
        {page === "Histórico" && <History />}
      </div>
    </div>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
  page,
  setPage,
}: {
  page: Page;
  setPage: (page: Page) => void;
}) {
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[245px] flex-col border-r border-white/10 bg-[#050505]">
      {/* LOGO */}
      <div className="flex h-[72px] items-center border-b border-white/10 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-lg font-bold">
            D
          </div>

          <div className="text-xl font-bold">
            DRA<span className="text-red-500">.IA</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-7">
        {/* PRINCIPAL */}
        <SectionTitle>PRINCIPAL</SectionTitle>

        <div className="space-y-1">
          {menuPrincipal.map((item) => (
            <SidebarButton
              key={item.name}
              active={page === item.name}
              icon={item.icon}
              label={item.name}
              onClick={() => setPage(item.name as Page)}
            />
          ))}
        </div>

        {/* CRIAÇÃO */}
        <SectionTitle>CRIAÇÃO</SectionTitle>

        <div className="space-y-1">
          {menuCriacao.map((item) => (
            <SidebarButton
              key={item.name}
              active={page === item.name}
              icon={item.icon}
              label={item.name}
              onClick={() => setPage(item.name as Page)}
            />
          ))}
        </div>

        {/* ANÁLISE */}
        <SectionTitle>ANÁLISE</SectionTitle>

        <SidebarButton
          active={page === "Palavras-chave"}
          icon="⌕"
          label="Palavras-chave"
          badge="NOVO"
          onClick={() => setPage("Palavras-chave")}
        />

        {/* BIBLIOTECA */}
        <SectionTitle>BIBLIOTECA</SectionTitle>

        <SidebarButton
          active={page === "Histórico"}
          icon="◷"
          label="Histórico"
          onClick={() => setPage("Histórico")}
        />
      </div>

      {/* SAIR */}
      <div className="border-t border-white/10 p-4">
        <button
          onClick={() => alert("Até logo!")}
          className="w-full rounded-lg px-4 py-3 text-left text-sm text-red-500 transition hover:bg-red-500/10"
        >
          ↪ Sair
        </button>
      </div>
    </aside>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 mt-7 px-3 text-[10px] font-bold tracking-[0.2em] text-zinc-500 first:mt-0">
      {children}
    </p>
  );
}

function SidebarButton({
  active,
  icon,
  label,
  badge,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition ${
        active
          ? "border-l-2 border-red-500 bg-red-500/10 text-white"
          : "text-zinc-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span
        className={`w-5 text-center text-lg ${
          active ? "text-red-500" : "text-zinc-500"
        }`}
      >
        {icon}
      </span>

      <span>{label}</span>

      {badge && (
        <span className="ml-auto text-[8px] font-bold text-red-500">
          {badge}
        </span>
      )}
    </button>
  );
}

/* =========================================================
   TOPBAR
========================================================= */

function Topbar() {
  return (
    <header className="flex h-[72px] items-center justify-end gap-6 border-b border-white/10 px-8">
      <button className="text-sm text-zinc-400 transition hover:text-white">
        ♧ Suporte
      </button>

      <button className="text-xl text-zinc-400 hover:text-white">
        ♧
      </button>

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 font-bold">
          D
        </div>

        <span className="text-sm">Daniela Rigol</span>

        <span className="text-zinc-500">⌄</span>
      </div>
    </header>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({ setPage }: { setPage: (page: Page) => void }) {
  return (
    <main className="mx-auto max-w-[1500px] p-8">
      {/* BANNER */}
      <section className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-[#350b0b] via-[#180707] to-[#080808] p-10">
        <div className="absolute right-[-100px] top-[-100px] h-[350px] w-[350px] rounded-full bg-red-600/10 blur-3xl" />

        <div className="relative">
          <p className="mb-3 text-xs font-bold tracking-[0.2em] text-red-500">
            PAINEL DRA
          </p>

          <h1 className="text-4xl font-bold">
            Bem-vinda de volta,{" "}
            <span className="text-red-500">Daniela</span>
          </h1>

          <p className="mt-3 max-w-2xl text-zinc-400">
            Sua central de inteligência artificial para conteúdo, estratégia e
            gestão da DRA.
          </p>

          <button
            onClick={() => setPage("DRA IA")}
            className="mt-7 rounded-lg bg-red-600 px-6 py-3 font-semibold transition hover:bg-red-500"
          >
            Falar com a DRA IA →
          </button>
        </div>
      </section>

      {/* FERRAMENTAS */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-[0.15em]">
            FERRAMENTAS RÁPIDAS
          </h2>

          <span className="text-xs text-zinc-500">Acesso rápido</span>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <ToolCard
            icon="▧"
            title="Thumbnail"
            description="Crie capas profissionais para seus vídeos"
            onClick={() => setPage("Thumbnail")}
          />

          <ToolCard
            icon="✎"
            title="Conteúdo"
            description="Títulos, descrições e ideias estratégicas"
            onClick={() => setPage("Conteúdo")}
          />

          <ToolCard
            icon="▤"
            title="Roteiro"
            description="Crie roteiros completos com inteligência artificial"
            onClick={() => setPage("Roteiro")}
          />
        </div>
      </section>

      {/* IA + CRÉDITOS */}
      <section className="mt-5 grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-xl border border-white/10 bg-[#0c0c0c] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">DRA IA</h2>

              <p className="mt-1 text-sm text-zinc-500">
                Sua assistente estratégica
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600/10 text-2xl text-red-500">
              ✦
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-white/10 bg-black p-4">
            <p className="text-sm text-zinc-500">
              Pergunte sobre conteúdo, métricas, estratégia ou documentos...
            </p>
          </div>

          <button
            onClick={() => setPage("DRA IA")}
            className="mt-4 text-sm font-semibold text-red-500"
          >
            Abrir DRA IA →
          </button>
        </div>

        <Credits />
      </section>

      {/* RESUMO */}
      <section className="mt-5 grid grid-cols-4 gap-5">
        <Stat title="Conteúdos" value="50" subtitle="Gerados" />
        <Stat title="Roteiros" value="24" subtitle="Este mês" />
        <Stat title="Thumbnails" value="18" subtitle="Este mês" />
        <Stat title="Palavras-chave" value="32" subtitle="Analisadas" />
      </section>
    </main>
  );
}

/* =========================================================
   THUMBNAIL
========================================================= */

function Thumbnail() {
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("Premium");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    const urls = images.map((image) => URL.createObjectURL(image));

    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  function handleImages(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files) return;

    const selected = Array.from(event.target.files).slice(0, 4);

    setImages(selected);
  }

  return (
    <main className="mx-auto max-w-[1500px] p-8">
      <PageHeader
        eyebrow="CRIAÇÃO"
        title={
          <>
            Crie thumbnails que{" "}
            <span className="text-red-500">chamam atenção</span>
          </>
        }
        description="Crie capas profissionais para os conteúdos da DRA com inteligência artificial."
      />

      <div className="grid grid-cols-[1fr_360px] gap-6">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c]">
          <div className="border-b border-white/10 px-6 py-5">
            <h3 className="font-semibold">Criar nova thumbnail</h3>
          </div>

          <div className="p-6">
            <label className="text-sm font-medium">
              Descreva sua thumbnail
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex.: Daniela apontando para um documento, texto grande 'VOCÊ TEM DIREITO?', fundo vermelho e preto..."
              maxLength={1000}
              className="mt-3 h-40 w-full resize-none rounded-xl border border-white/10 bg-[#080808] p-4 text-sm outline-none placeholder:text-zinc-600 focus:border-red-500/60"
            />

            <div className="mt-2 text-right text-xs text-zinc-600">
              {description.length}/1000
            </div>

            {/* UPLOAD */}
            <div className="mt-7">
              <label className="text-sm font-medium">
                Imagens de referência
              </label>

              <div className="mt-3 rounded-xl border border-dashed border-white/15 p-6 text-center transition hover:border-red-500/40">
                <input
                  id="thumbnail-images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImages}
                  className="hidden"
                />

                <label
                  htmlFor="thumbnail-images"
                  className="block cursor-pointer"
                >
                  <div className="mb-3 text-3xl">＋</div>

                  <p className="text-sm text-zinc-300">
                    Adicionar imagens
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    Até 4 imagens de referência
                  </p>
                </label>
              </div>

              {previews.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {previews.map((preview, index) => (
                    <div
                      key={preview}
                      className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-black"
                    >
                      <img
                        src={preview}
                        alt={`Referência ${index + 1}`}
                        className="h-full w-full object-cover"
                      />

                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                        <span className="text-[10px]">
                          Referência {index + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ESTILOS */}
            <div className="mt-8">
              <label className="text-sm font-medium">
                Estilo da thumbnail
              </label>

              <div className="mt-3 grid grid-cols-4 gap-3">
                {[
                  ["Premium", "Visual sofisticado e profissional"],
                  ["Impacto", "Alto contraste e destaque"],
                  ["Investigativo", "Estilo documental e informativo"],
                  ["Institucional", "Visual elegante para advocacia"],
                ].map(([name, description]) => (
                  <button
                    key={name}
                    onClick={() => setStyle(name)}
                    className={`rounded-xl border p-4 text-left transition ${
                      style === name
                        ? "border-red-500 bg-red-500/10"
                        : "border-white/10 bg-[#090909] hover:border-white/20"
                    }`}
                  >
                    <div
                      className={`mb-4 flex h-9 w-9 items-center justify-center rounded-lg ${
                        style === name
                          ? "bg-red-600"
                          : "bg-white/5"
                      }`}
                    >
                      ✦
                    </div>

                    <p className="text-sm font-semibold">{name}</p>

                    <p className="mt-1 text-[11px] text-zinc-500">
                      {description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-end border-t border-white/10 pt-6">
              <button
                disabled={!description.trim()}
                onClick={() => setGenerated(true)}
                className="rounded-lg bg-red-600 px-7 py-3 text-sm font-semibold transition hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600"
              >
                Gerar thumbnail →
              </button>
            </div>

            {generated && (
              <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-red-500">
                  Prévia da geração
                </p>

                <div className="mt-4 flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-red-950 via-black to-red-900">
                  <div className="px-8 text-center">
                    <p className="text-xs font-bold uppercase text-red-400">
                      DRA ADVOCACIA
                    </p>

                    <h3 className="mt-3 text-3xl font-black uppercase">
                      {description.slice(0, 70)}
                    </h3>

                    <p className="mt-4 text-sm text-zinc-400">
                      Estilo: {style}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-zinc-500">
                  Esta é uma prévia local. A geração de imagem por IA será
                  conectada posteriormente.
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <Tips />

          <Credits />
        </aside>
      </div>
    </main>
  );
}

/* =========================================================
   CONTEÚDO
========================================================= */

function ContentGenerator() {
  const [subject, setSubject] = useState("");
  const [keyword, setKeyword] = useState("");
  const [objective, setObjective] = useState("");
  const [generated, setGenerated] = useState(false);

  return (
    <main className="mx-auto max-w-[1500px] p-8">
      <PageHeader
        eyebrow="CRIAÇÃO"
        title={
          <>
            Crie conteúdos que{" "}
            <span className="text-red-500">conectam</span>
          </>
        }
        description="Títulos, descrições, CTAs e ideias estratégicas para a DRA."
      />

      <div className="grid grid-cols-[1fr_360px] gap-6">
        <section className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-6">
          <h3 className="text-lg font-semibold">Criar novo conteúdo</h3>

          <Field label="Assunto do vídeo">
            <textarea
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex.: Isenção de Imposto de Renda para militares da reserva"
              className="h-32 w-full resize-none rounded-xl border border-white/10 bg-[#080808] p-4 text-sm outline-none focus:border-red-500/60"
            />
          </Field>

          <Field label="Palavra-chave principal">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Ex.: isenção imposto de renda militar"
              className="w-full rounded-xl border border-white/10 bg-[#080808] p-4 text-sm outline-none focus:border-red-500/60"
            />
          </Field>

          <Field label="Objetivo do vídeo">
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Explique o que o público deve entender ao final do vídeo..."
              className="h-32 w-full resize-none rounded-xl border border-white/10 bg-[#080808] p-4 text-sm outline-none focus:border-red-500/60"
            />
          </Field>

          <div className="flex justify-end border-t border-white/10 pt-6">
            <button
              disabled={!subject.trim() || !keyword.trim()}
              onClick={() => setGenerated(true)}
              className="rounded-lg bg-red-600 px-7 py-3 text-sm font-semibold disabled:bg-zinc-800 disabled:text-zinc-600"
            >
              Gerar conteúdo →
            </button>
          </div>

          {generated && (
            <GeneratedContent
              subject={subject}
              keyword={keyword}
              objective={objective}
            />
          )}
        </section>

        <TipsContent />
      </div>
    </main>
  );
}

function GeneratedContent({
  subject,
  keyword,
  objective,
}: {
  subject: string;
  keyword: string;
  objective: string;
}) {
  return (
    <div className="mt-6 space-y-4 rounded-xl border border-red-500/20 bg-red-500/5 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-red-500">
        Conteúdo gerado
      </p>

      <div>
        <p className="text-xs text-zinc-500">Título sugerido</p>
        <h3 className="mt-1 text-xl font-bold">
          {subject}: o que você precisa saber
        </h3>
      </div>

      <div>
        <p className="text-xs text-zinc-500">Descrição</p>
        <p className="mt-1 text-sm text-zinc-300">
          Neste conteúdo, a DRA explica de forma clara os principais pontos
          sobre {subject.toLowerCase()}.
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">Palavra-chave</p>
        <span className="mt-2 inline-block rounded-full bg-white/5 px-3 py-1 text-xs">
          {keyword}
        </span>
      </div>

      <div>
        <p className="text-xs text-zinc-500">Objetivo</p>
        <p className="mt-1 text-sm text-zinc-300">
          {objective || "Informar e orientar o público."}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   ROTEIRO
========================================================= */

function ScriptGenerator() {
  const [idea, setIdea] = useState("");
  const [focus, setFocus] = useState("");
  const [type, setType] = useState("Vídeo Normal");
  const [duration, setDuration] = useState("8 minutos");
  const [generated, setGenerated] = useState(false);

  return (
    <main className="mx-auto max-w-[1500px] p-8">
      <PageHeader
        eyebrow="CRIAÇÃO"
        title={
          <>
            Crie roteiros que{" "}
            <span className="text-red-500">prendem</span>
          </>
        }
        description="Roteiros profissionais a partir das ideias da DRA."
      />

      <div className="grid grid-cols-[1fr_360px] gap-6">
        <section className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-6">
          <h3 className="text-lg font-semibold">Criar roteiro</h3>

          <Field label="Descreva sua ideia">
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Ex.: Quero explicar quem pode solicitar isenção de Imposto de Renda..."
              className="h-40 w-full resize-none rounded-xl border border-white/10 bg-[#080808] p-4 text-sm outline-none focus:border-red-500/60"
            />
          </Field>

          <Field label="Palavra-chave / foco">
            <input
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Palavra-chave principal"
              className="w-full rounded-xl border border-white/10 bg-[#080808] p-4 text-sm outline-none focus:border-red-500/60"
            />
          </Field>

          <Field label="Tipo de vídeo">
            <div className="grid grid-cols-2 gap-4">
              {["Vídeo Normal", "YouTube Shorts"].map((item) => (
                <button
                  key={item}
                  onClick={() => setType(item)}
                  className={`rounded-xl border p-5 text-left ${
                    type === item
                      ? "border-red-500 bg-red-500/10"
                      : "border-white/10 bg-[#080808]"
                  }`}
                >
                  <p className="font-semibold">{item}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {item === "Vídeo Normal"
                      ? "Conteúdo completo e detalhado"
                      : "Conteúdo rápido e direto"}
                  </p>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Duração do vídeo">
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#080808] p-4 text-sm outline-none"
            >
              <option>3 minutos</option>
              <option>5 minutos</option>
              <option>8 minutos</option>
              <option>10 minutos</option>
              <option>15 minutos</option>
              <option>20 minutos</option>
            </select>
          </Field>

          <div className="flex justify-end border-t border-white/10 pt-6">
            <button
              disabled={!idea.trim()}
              onClick={() => setGenerated(true)}
              className="rounded-lg bg-red-600 px-7 py-3 text-sm font-semibold disabled:bg-zinc-800 disabled:text-zinc-600"
            >
              Gerar roteiro →
            </button>
          </div>

          {generated && (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-red-500">
                Roteiro gerado
              </p>

              <h3 className="mt-4 text-xl font-bold">
                {idea.slice(0, 100)}
              </h3>

              <div className="mt-5 space-y-4">
                <ScriptBlock
                  title="GANCHO"
                  text="Você sabia que muitas pessoas podem ter um direito e simplesmente não sabem disso?"
                />

                <ScriptBlock
                  title="INTRODUÇÃO"
                  text={`Neste vídeo vamos explicar de forma simples o tema: ${idea}`}
                />

                <ScriptBlock
                  title="DESENVOLVIMENTO"
                  text="Apresente os pontos principais, exemplos e informações necessárias para o público compreender o assunto."
                />

                <ScriptBlock
                  title="CTA"
                  text="Se este conteúdo foi útil para você, acompanhe a DRA para mais informações."
                />
              </div>

              <p className="mt-5 text-xs text-zinc-500">
                Tipo: {type} • Duração: {duration}
              </p>
            </div>
          )}
        </section>

        <TipsScript />
      </div>
    </main>
  );
}

/* =========================================================
   DRA IA
========================================================= */

function DraAI() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    { user: boolean; text: string }[]
  >([]);

  function sendMessage() {
    if (!message.trim()) return;

    const current = message;

    setMessages((prev) => [
      ...prev,
      { user: true, text: current },
      {
        user: false,
        text: "Entendi. A DRA IA está preparada para analisar esse assunto. Nesta primeira versão estamos usando uma resposta demonstrativa. Depois vamos conectar a inteligência artificial real e o contexto completo da DRA.",
      },
    ]);

    setMessage("");
  }

  return (
    <main className="mx-auto max-w-[1200px] p-8">
      <PageHeader
        eyebrow="INTELIGÊNCIA ARTIFICIAL"
        title={
          <>
            Olá, sou a <span className="text-red-500">DRA IA</span>.
          </>
        }
        description="Sua assistente estratégica para conteúdo, marketing e gestão da DRA."
      />

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0b]">
        <div className="flex min-h-[600px] flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-8">
            {messages.length === 0 && (
              <div className="flex min-h-[450px] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 text-3xl">
                  ✦
                </div>

                <h2 className="mt-5 text-2xl font-bold">
                  Como posso ajudar?
                </h2>

                <p className="mt-2 max-w-lg text-sm text-zinc-500">
                  Pergunte sobre conteúdo, estratégia, métricas, roteiros,
                  documentos ou planejamento.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-3">
                  {[
                    "Analise meu conteúdo",
                    "Crie uma ideia de Reel",
                    "Monte um roteiro",
                    "Analise minhas métricas",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setMessage(suggestion)}
                      className="rounded-lg border border-white/10 bg-black px-4 py-3 text-sm text-zinc-300 transition hover:border-red-500/40"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((item, index) => (
              <div
                key={index}
                className={`flex ${
                  item.user ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-xl px-5 py-4 text-sm ${
                    item.user
                      ? "bg-red-600 text-white"
                      : "border border-white/10 bg-black text-zinc-300"
                  }`}
                >
                  {item.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 p-5">
            <div className="flex gap-3">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="Pergunte à DRA IA..."
                className="flex-1 rounded-xl border border-white/10 bg-black px-5 py-4 text-sm outline-none focus:border-red-500/60"
              />

              <button
                onClick={sendMessage}
                className="rounded-xl bg-red-600 px-6 font-semibold transition hover:bg-red-500"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   PALAVRAS-CHAVE
========================================================= */

function Keywords() {
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState(false);

  return (
    <main className="mx-auto max-w-[1500px] p-8">
      <PageHeader
        eyebrow="ANÁLISE"
        title={
          <>
            Inspetor de <span className="text-red-500">Palavras-chave</span>
          </>
        }
        description="Analise termos e descubra oportunidades para conteúdo."
      />

      <section className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-8">
        <div className="flex gap-3">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Digite uma palavra-chave. Ex.: isenção imposto de renda"
            className="flex-1 rounded-xl border border-white/10 bg-[#080808] px-5 py-4 text-sm outline-none focus:border-red-500/60"
          />

          <button
            onClick={() => setResult(true)}
            disabled={!keyword.trim()}
            className="rounded-xl bg-red-600 px-7 font-semibold disabled:bg-zinc-800 disabled:text-zinc-600"
          >
            Analisar
          </button>
        </div>

        {!result ? (
          <div className="flex h-[350px] items-center justify-center text-center">
            <div>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-2xl text-red-500">
                ⌕
              </div>

              <h3 className="mt-5 font-semibold">
                Pesquise uma palavra-chave para começar
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Digite um termo acima e veja uma análise demonstrativa.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-4 gap-4">
            <AnalysisCard title="Volume" value="Alto" />
            <AnalysisCard title="Concorrência" value="Média" />
            <AnalysisCard title="Oportunidade" value="8.4 / 10" />
            <AnalysisCard title="Intenção" value="Informacional" />

            <div className="col-span-4 mt-4 rounded-xl border border-white/10 bg-black p-6">
              <p className="text-xs text-zinc-500">PALAVRA ANALISADA</p>

              <h3 className="mt-2 text-xl font-bold">{keyword}</h3>

              <p className="mt-4 text-sm text-zinc-400">
                Sugestão: criar um conteúdo explicativo, uma versão curta
                para redes sociais e uma pergunta frequente relacionada ao
                termo.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

/* =========================================================
   HISTÓRICO
========================================================= */

function History() {
  const contents = [
    {
      title:
        "Isenção de Imposto de Renda por Doença Grave: quem pode ter direito?",
      date: "01/10/2026",
      type: "Conteúdo",
    },
    {
      title:
        "Militar da reserva pode ter direito à isenção de imposto?",
      date: "30/09/2026",
      type: "Roteiro",
    },
    {
      title: "Checklist antes de falar com um advogado",
      date: "29/09/2026",
      type: "Conteúdo",
    },
    {
      title: "Alta médica e direitos do trabalhador",
      date: "28/09/2026",
      type: "Thumbnail",
    },
  ];

  return (
    <main className="mx-auto max-w-[1500px] p-8">
      <PageHeader
        eyebrow="BIBLIOTECA"
        title={
          <>
            Histórico de <span className="text-red-500">conteúdo</span>
          </>
        }
        description="Acesse e gerencie tudo que foi criado anteriormente."
      />

      <div className="grid grid-cols-4 gap-5">
        <Stat title="Total" value="50" subtitle="Itens" />
        <Stat title="Semana" value="8" subtitle="Itens" />
        <Stat title="Mês" value="24" subtitle="Itens" />
        <Stat title="Favoritos" value="6" subtitle="Itens" />
      </div>

      <section className="mt-6 rounded-2xl border border-white/10 bg-[#0c0c0c] p-6">
        <div className="flex gap-3">
          <input
            placeholder="Buscar por título ou descrição..."
            className="flex-1 rounded-xl border border-white/10 bg-black px-5 py-3 text-sm outline-none"
          />

          <select className="rounded-xl border border-white/10 bg-black px-4 text-sm">
            <option>Todos os períodos</option>
            <option>Hoje</option>
            <option>Esta semana</option>
            <option>Este mês</option>
          </select>

          <select className="rounded-xl border border-white/10 bg-black px-4 text-sm">
            <option>Todos os tipos</option>
            <option>Conteúdo</option>
            <option>Roteiro</option>
            <option>Thumbnail</option>
          </select>
        </div>

        <div className="mt-6 space-y-3">
          {contents.map((content) => (
            <div
              key={content.title}
              className="rounded-xl border border-white/10 bg-black p-5 transition hover:border-red-500/20"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{content.title}</h3>

                    <span className="rounded-full bg-red-500/10 px-3 py-1 text-[10px] text-red-400">
                      {content.type}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-zinc-500">
                    {content.date}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5">
                    ♡
                  </button>

                  <button className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5">
                    ⧉
                  </button>

                  <button className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5">
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   PERFIL
========================================================= */

function Profile() {
  return (
    <main className="mx-auto max-w-[1500px] p-8">
      <PageHeader
        eyebrow="CONTA"
        title={
          <>
            Meu <span className="text-red-500">Perfil</span>
          </>
        }
        description="Gerencie suas informações e configurações."
      />

      <div className="grid grid-cols-[1fr_380px] gap-6">
        <section className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-7">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Informações pessoais</h2>

            <button className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold">
              Editar
            </button>
          </div>

          <Field label="Nome completo">
            <input
              defaultValue="Daniela Rigol"
              className="w-full rounded-xl border border-white/10 bg-black p-4 text-sm outline-none"
            />
          </Field>

          <Field label="E-mail">
            <input
              defaultValue="contato@dra.com.br"
              className="w-full rounded-xl border border-white/10 bg-black p-4 text-sm outline-none"
            />
          </Field>

          <Field label="Senha">
            <input
              type="password"
              placeholder="Nova senha"
              className="w-full rounded-xl border border-white/10 bg-black p-4 text-sm outline-none"
            />
          </Field>

          <Field label="Sobre">
            <textarea
              placeholder="Informações sobre a DRA..."
              className="h-32 w-full resize-none rounded-xl border border-white/10 bg-black p-4 text-sm outline-none"
            />
          </Field>
        </section>

        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-6">
            <h2 className="text-lg font-semibold">Plano atual</h2>

            <div className="mt-6 rounded-lg bg-red-500/10 p-4 text-center">
              <p className="font-bold text-red-400">DRA PRO</p>
              <p className="mt-1 text-xs text-zinc-500">
                Plano personalizado
              </p>
            </div>
          </div>

          <Credits />
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   COMPONENTES
========================================================= */

function TopTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return <h2 className="text-2xl font-bold">{children}</h2>;
}

function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
}) {
  return (
    <div className="mb-8">
      <p className="mb-3 text-xs font-bold tracking-[0.2em] text-red-500">
        {eyebrow}
      </p>

      <h1 className="text-4xl font-bold">{title}</h1>

      <p className="mt-3 text-zinc-400">{description}</p>
    </div>
  );
}

function ToolCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-xl border border-white/10 bg-[#0d0d0d] p-6 text-left transition hover:border-red-500/40 hover:bg-[#111]"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-600/10 text-xl text-red-500 transition group-hover:bg-red-600 group-hover:text-white">
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-semibold">{title}</h3>

      <p className="mt-1 text-sm text-zinc-500">{description}</p>

      <p className="mt-6 text-sm font-semibold text-red-500">
        Abrir →
      </p>
    </button>
  );
}

function Credits() {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0c0c0c] p-6">
      <h2 className="font-semibold">Créditos de IA</h2>

      <div className="mt-6 flex justify-between text-sm">
        <span className="text-zinc-500">Utilizados</span>
        <span>0 / 250</span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full w-[4%] rounded-full bg-red-600" />
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        250 créditos disponíveis
      </p>
    </div>
  );
}

function Stat({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0c0c0c] p-5">
      <p className="text-xs text-zinc-500">{title}</p>

      <p className="mt-3 text-3xl font-bold">{value}</p>

      <p className="mt-1 text-xs text-zinc-600">{subtitle}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-7">
      <label className="text-sm font-medium">{label}</label>

      <div className="mt-3">{children}</div>
    </div>
  );
}

function Tips() {
  const tips = [
    ["Pouco texto", "Use uma mensagem curta e fácil de ler."],
    ["Alto contraste", "Faça o elemento principal se destacar."],
    ["Expressão e contexto", "Use elementos que comuniquem a ideia."],
    ["Identidade DRA", "Mantenha consistência visual."],
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-6">
      <h3 className="font-semibold">💡 Dicas para thumbnails</h3>

      <div className="mt-6 space-y-5">
        {tips.map(([title, text]) => (
          <div key={title} className="flex gap-3">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-xs text-red-500">
              ✓
            </div>

            <div>
              <p className="text-sm font-medium">{title}</p>

              <p className="mt-1 text-xs text-zinc-500">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TipsContent() {
  return (
    <aside className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-6">
      <h3 className="font-semibold">💡 Dicas para conteúdo</h3>

      <div className="mt-6 space-y-5">
        <TipItem
          title="Palavras-chave estratégicas"
          text="Escolha termos relacionados ao público."
        />

        <TipItem
          title="Títulos curiosos"
          text="Desperte interesse sem prometer algo que o conteúdo não entrega."
        />

        <TipItem
          title="CTA"
          text="Oriente o público sobre o próximo passo."
        />

        <TipItem
          title="Estrutura clara"
          text="Organize a informação em uma sequência fácil de acompanhar."
        />
      </div>
    </aside>
  );
}

function TipsScript() {
  return (
    <aside className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-6">
      <h3 className="font-semibold">💡 Dicas para roteiros</h3>

      <div className="mt-6 space-y-5">
        <TipItem
          title="Gancho forte"
          text="Prenda a atenção logo no começo."
        />

        <TipItem
          title="Storytelling"
          text="Organize a explicação de forma envolvente."
        />

        <TipItem
          title="CTA"
          text="Mostre ao público qual é o próximo passo."
        />

        <TipItem
          title="Ritmo"
          text="Evite partes longas sem informação relevante."
        />
      </div>
    </aside>
  );
}

function TipItem({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-xs text-red-500">
        ✓
      </div>

      <div>
        <p className="text-sm font-medium">{title}</p>

        <p className="mt-1 text-xs text-zinc-500">{text}</p>
      </div>
    </div>
  );
}

function ScriptBlock({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black p-4">
      <p className="text-xs font-bold text-red-500">{title}</p>

      <p className="mt-2 text-sm leading-6 text-zinc-300">{text}</p>
    </div>
  );
}

function AnalysisCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black p-5">
      <p className="text-xs text-zinc-500">{title}</p>

      <p className="mt-3 text-xl font-bold">{value}</p>
    </div>
  );
}