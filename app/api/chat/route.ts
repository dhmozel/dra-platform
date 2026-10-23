
import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Digite uma mensagem válida." },
        { status: 400 }
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
`,
      input: message.trim(),
    });

    return NextResponse.json({ reply: response.output_text });
  } catch (error) {
    console.error("Erro na API da DRA IA:", error);
    const apiError = error as { status?: number; code?: string };
    if (apiError?.code === "insufficient_quota" || apiError?.code === "credit_balance_exhausted") {
      return NextResponse.json({ error: "A API está sem créditos disponíveis. Adicione saldo à conta da API para continuar." }, { status: 402 });
    }
    if (apiError?.status === 401) {
      return NextResponse.json({ error: "A chave da API é inválida ou foi revogada. Atualize OPENAI_API_KEY." }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Erro ao gerar resposta. Verifique a configuração da API." },
      { status: 500 }
    );
  }
}
