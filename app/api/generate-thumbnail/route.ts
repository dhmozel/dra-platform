
import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "A chave da OpenAI não está configurada." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const message = body.message;

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Envie uma mensagem válida." },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      instructions:
        "Você é a DRA IA, assistente de criação e estratégia de conteúdo. Responda em português brasileiro, com clareza, organização e foco prático.",
      input: message.trim(),
    });

    return NextResponse.json({
      reply: response.output_text,
    });
  } catch (error) {
    console.error("Erro na rota da DRA IA:", error);

    return NextResponse.json(
      { error: "Não foi possível gerar a resposta. Confira a API e tente novamente." },
      { status: 500 }
    );
  }
}
