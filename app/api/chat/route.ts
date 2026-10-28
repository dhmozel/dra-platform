import OpenAI, {
  APIConnectionError,
  APIError,
  AuthenticationError,
  BadRequestError,
  NotFoundError,
  PermissionDeniedError,
  RateLimitError,
} from "openai";
import { NextResponse } from "next/server";

type ChatMessage = { role: "user" | "assistant"; text: string };
type WebSource = { title: string; url: string };

const maxMessages = 40;
const maxMessageCharacters = 30_000;
const maxConversationCharacters = 100_000;
const timeZone = "America/Sao_Paulo";

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.text === "string" &&
    message.text.trim().length > 0 &&
    message.text.length <= maxMessageCharacters
  );
}

function getCurrentDate() {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeZone,
  }).format(new Date());
}

function isOnlyAskingForToday(question: string) {
  const normalized = question
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  return /^(que dia e hoje|qual e a data de hoje|que data e hoje|data de hoje)[?!.]*$/.test(normalized);
}

function needsCurrentResearch(question: string, currentYear: number) {
  const normalized = question.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const recentInformation = /\b(agora|atual(?:mente)?|recente(?:s)?|ultima(?:s)?|ultimas? noticias|noticias|novidade(?:s)?|preco(?:s)?|cotacao|valor atual|mudanca recente|mudancas recentes|aconteceu|esta acontecendo|vai acontecer|resultado(?:s)?|quem ganhou|eleito(?:s)?|eleicao|eleicoes|legislacao vigente)\b/.test(normalized);
  const explicitCurrentYear = new RegExp(`\\b${currentYear}\\b`).test(normalized);
  const explicitFutureYear = new RegExp(`\\b(20\\d{2})\\b`).exec(normalized);
  const futureEvent = /\b(quando sera|quando vai|previsto|previsao|futuro|proxima eleicao|proximas eleicoes)\b/.test(normalized);
  const asksAboutElections = /\b(eleicao|eleicoes|presidencial|presidenciais|presidente)\b/.test(normalized);
  const asksForCurrentEvents = /\b(evento|eventos|acontecimento|acontecimentos)\b/.test(normalized);

  return (
    recentInformation ||
    (asksAboutElections && explicitCurrentYear) ||
    (asksAboutElections && explicitFutureYear !== null && Number(explicitFutureYear[1]) >= currentYear) ||
    (futureEvent && (asksAboutElections || asksForCurrentEvents))
  );
}

function getWebSources(response: OpenAI.Responses.Response): {
  searched: boolean;
  searchStatus: string | null;
  sources: WebSource[];
} {
  const sourceByUrl = new Map<string, WebSource>();
  let searched = false;
  let searchStatus: string | null = null;

  for (const item of response.output) {
    if (item.type === "web_search_call") {
      searchStatus = item.status;
      if (item.status === "completed") searched = true;
      const action = item.action;
      if (action.type === "search") {
        for (const source of action.sources ?? []) {
          sourceByUrl.set(source.url, { title: source.url, url: source.url });
        }
      }
    }

    if (item.type === "message") {
      for (const content of item.content) {
        if (content.type !== "output_text") continue;
        for (const annotation of content.annotations) {
          if (annotation.type === "url_citation") {
            sourceByUrl.set(annotation.url, { title: annotation.title, url: annotation.url });
          }
        }
      }
    }
  }

  return { searched, searchStatus, sources: [...sourceByUrl.values()] };
}

function getProviderErrorResponse(error: unknown, requiresWebSearch: boolean) {
  if (error instanceof APIConnectionError) {
    const message = requiresWebSearch
      ? "Não foi possível conectar à OpenAI para pesquisar. Verifique a conexão do servidor e tente novamente."
      : "Não foi possível conectar à OpenAI. Verifique a conexão do servidor e tente novamente.";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      { error: "A OpenAI recusou a autenticação da DRA IA. Verifique a credencial configurada no servidor." },
      { status: 401 }
    );
  }

  if (error instanceof PermissionDeniedError) {
    return NextResponse.json(
      { error: "A conta da OpenAI não tem permissão para usar este modelo ou recurso." },
      { status: 403 }
    );
  }

  if (error instanceof RateLimitError) {
    const code = error.code?.toLowerCase();
    if (code === "insufficient_quota" || code === "credit_balance_exhausted") {
      return NextResponse.json(
        { error: "A conta da OpenAI está sem cota ou créditos disponíveis." },
        { status: 402 }
      );
    }
    return NextResponse.json(
      { error: "A OpenAI limitou temporariamente as solicitações. Aguarde e tente novamente." },
      { status: 429 }
    );
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { error: "O modelo configurado não está disponível para esta conta ou endpoint." },
      { status: 502 }
    );
  }

  if (error instanceof BadRequestError) {
    const rejectedSearchTool = requiresWebSearch &&
      (error.param?.includes("tool") || /web.?search/i.test(error.code ?? ""));
    return NextResponse.json(
      {
        error: rejectedSearchTool
          ? "A OpenAI recusou a ferramenta de pesquisa para esta solicitação. A pesquisa não foi concluída."
          : "A OpenAI recusou o formato desta solicitação da DRA IA.",
      },
      { status: rejectedSearchTool ? 503 : 400 }
    );
  }

  if (error instanceof APIError && error.status !== undefined && error.status >= 500) {
    return NextResponse.json(
      { error: "A OpenAI está temporariamente indisponível. Tente novamente mais tarde." },
      { status: 502 }
    );
  }

  if (requiresWebSearch) {
    return NextResponse.json(
      { error: "A pesquisa não pôde ser concluída. Nenhuma fonte foi apresentada; tente novamente mais tarde." },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: "Erro ao gerar resposta na DRA IA. Tente novamente mais tarde." },
    { status: 500 }
  );
}

function appendSources(reply: string, sources: WebSource[]) {
  if (sources.length === 0) return reply;
  const sourceList = sources
    .slice(0, 8)
    .map(({ title, url }) => `- [${title.replace(/[\[\]]/g, "")}](${url})`)
    .join("\n");
  return `${reply.trim()}\n\n**Fontes consultadas:**\n${sourceList}`;
}

export async function POST(request: Request) {
  let requiresWebSearch = false;

  try {
    const body = await request.json();
    const messages = (body as { messages?: unknown } | null)?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Envie o histórico da conversa e uma mensagem válida." },
        { status: 400 }
      );
    }

    if (messages.length > maxMessages) {
      return NextResponse.json(
        { error: "Esta conversa atingiu o limite de mensagens. Inicie uma nova conversa para continuar." },
        { status: 413 }
      );
    }

    if (!messages.every(isChatMessage)) {
      return NextResponse.json(
        { error: "O histórico contém uma mensagem inválida ou muito longa." },
        { status: 400 }
      );
    }

    const conversation = messages as ChatMessage[];
    const conversationCharacters = conversation.reduce((total, message) => total + message.text.length, 0);
    const lastMessage = conversation[conversation.length - 1];

    if (lastMessage.role !== "user") {
      return NextResponse.json(
        { error: "A última mensagem da conversa precisa ser uma mensagem sua." },
        { status: 400 }
      );
    }

    if (conversationCharacters > maxConversationCharacters) {
      return NextResponse.json(
        { error: "O histórico desta conversa ficou muito extenso. Inicie uma nova conversa para continuar." },
        { status: 413 }
      );
    }

    if (isOnlyAskingForToday(lastMessage.text)) {
      return NextResponse.json({ reply: `Hoje é ${getCurrentDate()}.` });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY não configurada." },
        { status: 500 }
      );
    }

    const currentYear = Number(
      new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone }).format(new Date())
    );
    requiresWebSearch = needsCurrentResearch(lastMessage.text, currentYear);

    const openai = new OpenAI({ apiKey });
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      instructions: `
Você é a DRA IA, assistente editorial da D R A · Daniela Rigol Advocacia, com atuação tributária e previdenciária militar. Responda em português brasileiro, com clareza, acolhimento e foco prático para aposentados, pensionistas e militares da reserva/reforma.
Data atual no fuso ${timeZone}: ${getCurrentDate()}. Use essa data como referência temporal atual, sem confundi-la com a data de treinamento ou limite de conhecimento do modelo.
Siga estas regras: não prometa resultados jurídicos; não invente leis, artigos, requisitos, decisões, datas, resultados eleitorais, notícias ou fontes; sinalize o que precisa de revisão jurídica; não exponha dados de clientes; explique para quem uma informação vale e o que ela significa na prática. Diferencie projetos de lei das regras vigentes. Adapte títulos e legendas à plataforma, sem caixa alta excessiva nem pontuação exagerada. Para YouTube longo, capítulos devem ter tempos reais e nunca ser inventados. Para Reels, Shorts e TikTok, adapte os CTAs a cada rede. Quando o usuário pedir conteúdo, entregue blocos claramente nomeados e prontos para copiar.
Para fatos atuais, legislação, preços, notícias, eleições ou eventos futuros, use a pesquisa na web quando disponível. Considere o ano da data atual e diferencie fatos confirmados, previsões e resultados ainda indisponíveis. Baseie afirmações atuais nas fontes consultadas, priorize fontes oficiais e deixe claro quando não conseguir verificar algo.
O histórico abaixo contém a conversa completa em ordem. Ao revisar, resumir ou adaptar um conteúdo anterior, use o conteúdo e o tema já presentes; não peça que sejam reenviados, salvo se estiverem realmente ausentes.
`,
      input: conversation.map(({ role, text }) => ({ role, content: text })),
      tools: [{ type: "web_search", search_context_size: "medium" }],
      tool_choice: requiresWebSearch ? "required" : "auto",
      include: ["web_search_call.action.sources"],
    });

    const { searched, searchStatus, sources } = getWebSources(response);
    if (requiresWebSearch && (!searched || sources.length === 0)) {
      return NextResponse.json(
        {
          error: searchStatus === "failed" || searchStatus === "incomplete"
            ? "A ferramenta de pesquisa não conseguiu concluir a busca. Nenhuma fonte foi apresentada."
            : "A pesquisa não retornou fontes verificáveis. Nenhuma informação atual foi afirmada.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ reply: appendSources(response.output_text, sources) });
  } catch (error) {
    const apiError = error as { status?: number; code?: string };
    // Log only provider metadata; never log the key, request, response body, or raw error.
    console.error("Erro na API da DRA IA", {
      type: error instanceof APIConnectionError
        ? "connection"
        : error instanceof AuthenticationError
          ? "authentication"
          : error instanceof PermissionDeniedError
            ? "permission"
            : error instanceof RateLimitError
              ? "rate_limit_or_quota"
              : error instanceof NotFoundError
                ? "model_or_endpoint"
                : error instanceof BadRequestError
                  ? "request_or_tool"
                  : error instanceof APIError
                    ? "api"
                    : "unexpected",
      status: apiError.status,
      code: apiError.code,
    });
    return getProviderErrorResponse(error, requiresWebSearch);
  }
}
