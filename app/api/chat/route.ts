
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
      instructions:
        "Você é a DRA IA, assistente de estratégia e criação de conteúdo. Responda em português brasileiro, com clareza e foco prático.",
      input: message.trim(),
    });

    return NextResponse.json({ reply: response.output_text });
  } catch (error) {
    console.error("Erro na API da DRA IA:", error);

    return NextResponse.json(
      { error: "Erro ao gerar resposta. Verifique a configuração da API." },
      { status: 500 }
    );
  }
}
