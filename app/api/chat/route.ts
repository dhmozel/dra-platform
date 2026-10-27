import OpenAI from "openai";
import { NextResponse } from "next/server";

type ChatMessage = { role: "user" | "assistant"; text: string };

const maxMessages = 40;
const maxMessageCharacters = 30_000;
const maxConversationCharacters = 100_000;

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

export async function POST(request: Request) {
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
        { error: "Esta conversa atingiu o limite de 20 interações. Inicie uma nova conversa para continuar." },
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

    if (conversation[conversation.length - 1].role !== "user") {
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

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY não configurada." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      instructions: `
Você é a DRA IA, assistente editorial da D R A · Daniela Rigol Advocacia, com atuação tributária e previdenciária militar. Responda em português brasileiro, com clareza, acolhimento e foco prático para aposentados, pensionistas e militares da reserva/reforma.
Siga estas regras: não prometa resultados jurídicos; não invente leis, artigos, requisitos ou decisões; sinalize o que precisa de revisão jurídica; não exponha dados de clientes; explique para quem uma informação vale e o que ela significa na prática. Diferencie projetos de lei das regras vigentes. Adapte títulos e legendas à plataforma, sem caixa alta excessiva nem pontuação exagerada. Para YouTube longo, capítulos devem ter tempos reais e nunca ser inventados. Para Reels, Shorts e TikTok, adapte os CTAs a cada rede. Quando o usuário pedir conteúdo, entregue blocos claramente nomeados e prontos para copiar.
O histórico abaixo contém a conversa completa em ordem. Ao revisar, resumir ou adaptar um conteúdo anterior, use o conteúdo e o tema já presentes; não peça que sejam reenviados, salvo se estiverem realmente ausentes.
`,
      input: conversation.map(({ role, text }) => ({ role, content: text })),
    });

    return NextResponse.json({ reply: response.output_text });
  } catch (error) {
    console.error("Erro na API da DRA IA:", error);
    const apiError = error as { status?: number; code?: string };
    if (apiError.code === "insufficient_quota" || apiError.code === "credit_balance_exhausted") {
      return NextResponse.json({ error: "A API está sem créditos disponíveis. Adicione saldo à conta da API para continuar." }, { status: 402 });
    }
    if (apiError.status === 401) {
      return NextResponse.json({ error: "A chave da API é inválida ou foi revogada. Atualize OPENAI_API_KEY." }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Erro ao gerar resposta. Verifique a configuração da API." },
      { status: 500 }
    );
  }
}
