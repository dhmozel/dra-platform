
"use client";

import { useState } from "react";

type Page =
  | "Início"
  | "Thumbnail"
  | "Conteúdo"
  | "Roteiro"
  | "DRA IA"
  | "Palavras-chave"
  | "Histórico"
  | "Meu Perfil";

const navigation: { name: Page; icon: string }[] = [
  { name: "Início", icon: "⌂" },
  { name: "Thumbnail", icon: "▧" },
  { name: "Conteúdo", icon: "✎" },
  { name: "Roteiro", icon: "▤" },
  { name: "DRA IA", icon: "✦" },
  { name: "Palavras-chave", icon: "⌕" },
  { name: "Histórico", icon: "◷" },
  { name: "Meu Perfil", icon: "⚙" },
];

const tools = [
  {
    name: "Thumbnail",
    description: "Planeje capas profissionais",
    icon: "▧",
  },
  {
    name: "Conteúdo",
    description: "Organize suas publicações",
    icon: "✎",
  },
  {
    name: "Roteiro",
    description: "Estruture vídeos e ideias",
    icon: "▤",
  },
  {
    name: "DRA IA",
    description: "Converse com sua assistente",
    icon: "✦",
  },
  {
    name: "Palavras-chave",
    description: "Encontre termos estratégicos",
    icon: "⌕",
  },
  {
    name: "Histórico",
    description: "Consulte suas atividades",
    icon: "◷",
  },
] as const;

export default function Home() {
  const [page, setPage] = useState<Page>("Início");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileName, setProfileName] = useState("Daniela Rigol");
  const [email, setEmail] = useState("");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);
  const [idea, setIdea] = useState("");
  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState<
    { title: string; category: string; date: string }[]
  >([]);

  function navigate(nextPage: Page) {
    setPage(nextPage);
    setMenuOpen(false);
  }

  function addItem(category: string, title: string) {
    if (!title.trim()) return;

    setItems((current) => [
      {
        title: title.trim(),
        category,
        date: new Date().toLocaleDateString("pt-BR"),
      },
      ...current,
    ]);
    setIdea("");
  }

  function sendMessage() {
    if (!prompt.trim()) return;

    const question = prompt.trim();

    setMessages((current) => [
      ...current,
      { role: "user", text: question },
      {
        role: "assistant",
        text:
          "Esta é a versão inicial da DRA IA. A interface está pronta, mas a inteligência artificial ainda precisa ser conectada a uma API para gerar respostas reais. Sua mensagem foi registrada nesta sessão.",
      },
    ]);

    setPrompt("");
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {menuOpen && (
        <button
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-white/10 bg-[#090909] transition-transform duration-200 md:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-6">
          <button
            onClick={() => navigate("Início")}
            className="text-2xl font-black tracking-tight"
          >
            DRA<span className="text-red-500">.IA</span>
          </button>

          <button
            onClick={() => setMenuOpen(false)}
            className="rounded-lg px-3 py-2 text-xl text-white/60 hover:bg-white/10 md:hidden"
            aria-label="Fechar navegação"
          >
            ×
          </button>
        </div>

        <div className="px-5 pt-7">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[.22em] text-white/35">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => navigate(item.name)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                  page === item.name
                    ? "bg-red-500/10 font-semibold text-red-400"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="w-5 text-center text-lg">
                  {item.icon}
                </span>
                {item.name}
                {page === item.name && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-500" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-xs font-semibold">DRA IA</span>
            </div>
            <p className="text-xs leading-5 text-white/40">
              Seu espaço para criar, planejar e organizar.
            </p>
          </div>
        </div>
      </aside>

      <div className="min-h-screen md:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-white/10 bg-[#080808]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/5 md:hidden"
              aria-label="Abrir menu"
            >
              ☰ <span className="ml-1">Menu</span>
            </button>

            <div className="hidden text-sm text-white/40 sm:block">
              Workspace <span className="mx-2">/</span>
              <span className="text-white">{page}</span>
            </div>

            <span className="text-sm font-semibold sm:hidden">{page}</span>
          </div>

          <button
            onClick={() => navigate("Meu Perfil")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-sm font-bold"
            aria-label="Abrir perfil"
          >
            {profileName.charAt(0).toUpperCase() || "D"}
          </button>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          {page === "Início" && (
            <div className="space-y-8">
              <section className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-[#300b0d] via-[#170809] to-[#0b0b0b] p-6 sm:p-10 lg:p-14">
                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-red-600/10 blur-3xl" />

                <div className="relative max-w-2xl">
                  <span className="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-red-400">
                    Central DRA
                  </span>

                  <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                    Sua estratégia começa{" "}
                    <span className="text-red-500">aqui.</span>
                  </h1>

                  <p className="mt-4 max-w-xl text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
                    Crie conteúdos, organize ideias e gerencie suas
                    ferramentas em um único lugar.
                  </p>

                  <button
                    onClick={() => navigate("DRA IA")}
                    className="mt-7 inline-flex items-center gap-3 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold transition hover:bg-red-500"
                  >
                    Abrir DRA IA <span>→</span>
                  </button>
                </div>
              </section>

              <section>
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold uppercase tracking-[.15em]">
                    Ferramentas
                  </h2>
                  <span className="text-xs text-white/40">
                    Acesso rápido
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {tools.map((tool) => (
                    <button
                      key={tool.name}
                      onClick={() => navigate(tool.name)}
                      className="group rounded-2xl border border-white/[.08] bg-[#0e0e0e] p-5 text-left transition hover:-translate-y-0.5 hover:border-red-500/30 hover:bg-[#121010] sm:p-6"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-xl text-red-400 transition group-hover:bg-red-500/20">
                        {tool.icon}
                      </span>

                      <h3 className="mt-5 font-bold">{tool.name}</h3>
                      <p className="mt-2 text-sm text-white/45">
                        {tool.description}
                      </p>

                      <p className="mt-5 text-sm font-semibold text-red-400">
                        Abrir <span className="ml-1">→</span>
                      </p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { label: "Itens no histórico", value: items.length },
                  { label: "Conversas nesta sessão", value: messages.length / 2 },
                  { label: "Ferramentas disponíveis", value: tools.length },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5"
                  >
                    <p className="text-sm text-white/45">{stat.label}</p>
                    <p className="mt-3 text-3xl font-black">{stat.value}</p>
                  </div>
                ))}
              </section>
            </div>
          )}

          {page === "Thumbnail" && (
            <section className="mx-auto max-w-3xl">
              <Heading
                eyebrow="Criação visual"
                title="Thumbnail"
                description="Organize ideias para suas capas e peças visuais."
              />

              <div className="mt-8 rounded-2xl border border-white/10 bg-[#0e0e0e] p-5 sm:p-8">
                <label className="text-sm font-medium">Ideia da capa</label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Descreva o tema, o público e a mensagem da capa..."
                  className="mt-3 min-h-36 w-full resize-y rounded-xl border border-white/10 bg-black p-4 text-sm outline-none transition placeholder:text-white/25 focus:border-red-500/60"
                />
                <button
                  onClick={() => addItem("Thumbnail", idea)}
                  className="mt-4 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold hover:bg-red-500"
                >
                  Salvar ideia
                </button>
                <p className="mt-4 text-xs leading-5 text-white/35">
                  Esta versão registra a ideia no histórico da sessão.
                  A geração de imagens ainda precisa ser integrada.
                </p>
              </div>
            </section>
          )}

          {page === "Conteúdo" && (
            <section className="mx-auto max-w-3xl">
              <Heading
                eyebrow="Planejamento"
                title="Conteúdo"
                description="Registre ideias para suas próximas publicações."
              />

              <div className="mt-8 rounded-2xl border border-white/10 bg-[#0e0e0e] p-5 sm:p-8">
                <label className="text-sm font-medium">Nova publicação</label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Assunto, objetivo, formato ou chamada..."
                  className="mt-3 min-h-36 w-full resize-y rounded-xl border border-white/10 bg-black p-4 text-sm outline-none placeholder:text-white/25 focus:border-red-500/60"
                />
                <button
                  onClick={() => addItem("Conteúdo", idea)}
                  className="mt-4 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold hover:bg-red-500"
                >
                  Salvar conteúdo
                </button>
              </div>
            </section>
          )}

          {page === "Roteiro" && (
            <section className="mx-auto max-w-3xl">
              <Heading
                eyebrow="Produção"
                title="Roteiro"
                description="Estruture a ideia principal do seu próximo vídeo."
              />

              <div className="mt-8 rounded-2xl border border-white/10 bg-[#0e0e0e] p-5 sm:p-8">
                <label className="text-sm font-medium">Tema do roteiro</label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Informe o tema, o público e o resultado desejado..."
                  className="mt-3 min-h-36 w-full resize-y rounded-xl border border-white/10 bg-black p-4 text-sm outline-none placeholder:text-white/25 focus:border-red-500/60"
                />
                <button
                  onClick={() => addItem("Roteiro", idea)}
                  className="mt-4 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold hover:bg-red-500"
                >
                  Salvar roteiro
                </button>
              </div>
            </section>
          )}

          {page === "DRA IA" && (
            <section className="mx-auto flex min-h-[65vh] max-w-4xl flex-col">
              <Heading
                eyebrow="Assistente"
                title="DRA IA"
                description="Centralize suas perguntas e ideias em uma conversa."
              />

              <div className="mt-7 flex flex-1 flex-col rounded-2xl border border-white/10 bg-[#0d0d0d]">
                <div className="flex items-center gap-3 border-b border-white/10 p-4 sm:p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-lg text-red-400">
                    ✦
                  </span>
                  <div>
                    <p className="text-sm font-bold">Assistente DRA</p>
                    <p className="mt-1 text-xs text-white/40">
                      Interface inicial
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
                  {messages.length === 0 && (
                    <div className="m-auto max-w-md py-10 text-center">
                      <span className="text-4xl text-red-500">✦</span>
                      <h3 className="mt-4 text-xl font-bold">
                        Como posso ajudar?
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/45">
                        Envie uma mensagem para testar a interface.
                      </p>
                    </div>
                  )}

                  {messages.map((message, index) => (
                    <div
                      key={`${index}-${message.role}`}
                      className={`max-w-[90%] rounded-2xl p-4 text-sm leading-6 sm:max-w-[80%] ${
                        message.role === "user"
                          ? "ml-auto bg-red-600 text-white"
                          : "border border-white/10 bg-white/[.04] text-white/75"
                      }`}
                    >
                      {message.text}
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="border-t border-white/10 p-3 sm:p-5"
                >
                  <div className="flex items-end gap-2">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !e.shiftKey &&
                          !e.nativeEvent.isComposing
                        ) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      rows={2}
                      placeholder="Escreva sua mensagem..."
                      className="max-h-36 min-h-12 flex-1 resize-y rounded-xl border border-white/10 bg-black p-3 text-sm outline-none placeholder:text-white/30 focus:border-red-500/60"
                    />
                    <button
                      type="submit"
                      disabled={!prompt.trim()}
                      className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Enviar
                    </button>
                  </div>
                  <p className="mt-3 text-center text-[11px] text-white/30">
                    A conexão com um modelo de IA ainda não foi configurada.
                  </p>
                </form>
              </div>
            </section>
          )}

          {page === "Palavras-chave" && (
            <section className="mx-auto max-w-3xl">
              <Heading
                eyebrow="Pesquisa"
                title="Palavras-chave"
                description="Organize os termos importantes para seu conteúdo."
              />

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addItem("Palavra-chave", keyword);
                  setKeyword("");
                }}
                className="mt-8 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0e0e0e] p-5 sm:flex-row sm:p-8"
              >
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Digite uma palavra-chave..."
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-red-500/60"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold hover:bg-red-500"
                >
                  Salvar termo
                </button>
              </form>
            </section>
          )}

          {page === "Histórico" && (
            <section>
              <Heading
                eyebrow="Registros"
                title="Histórico"
                description="Consulte os itens criados durante esta sessão."
              />

              <div className="mt-8 space-y-3">
                {items.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-[#0e0e0e] p-8 text-center">
                    <p className="font-semibold">Seu histórico está vazio.</p>
                    <p className="mt-2 text-sm text-white/40">
                      Quando você salvar uma ideia, ela aparecerá aqui.
                    </p>
                  </div>
                ) : (
                  items.map((item, index) => (
                    <article
                      key={`${item.date}-${index}`}
                      className="rounded-2xl border border-white/10 bg-[#0e0e0e] p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                          {item.category}
                        </span>
                        <span className="text-xs text-white/35">
                          {item.date}
                        </span>
                      </div>
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/75">
                        {item.title}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}

          {page === "Meu Perfil" && (
            <section className="mx-auto max-w-2xl">
              <Heading
                eyebrow="Configurações"
                title="Meu Perfil"
                description="Edite as informações exibidas nesta interface."
              />

              <div className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-[#0e0e0e] p-5 sm:p-8">
                <div>
                  <label className="text-sm font-medium">Nome</label>
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-red-500/60"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">E-mail</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    type="email"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-red-500/60"
                  />
                </div>

                <p className="text-xs leading-5 text-white/35">
                  Os dados ficam apenas no estado desta sessão. Login,
                  armazenamento permanente e sincronização ainda não foram
                  configurados.
                </p>
              </div>
            </section>
          )}
        </main>

        <footer className="border-t border-white/10 px-4 py-6 text-center text-xs text-white/30 sm:px-6">
          DRA IA · Painel de inteligência e criação
        </footer>
      </div>
    </div>
  );
}

function Heading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[.22em] text-red-400">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50 sm:text-base">
        {description}
      </p>
    </div>
  );
}
