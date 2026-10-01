import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { description, headline, style, format } = body;

    if (!description || !headline) {
      return NextResponse.json(
        { error: "Descrição e título são obrigatórios." },
        { status: 400 }
      );
    }

    const prompt = `
Crie uma thumbnail profissional para YouTube para o escritório DRA ADVOCACIA.

Tema:
${description}

Texto principal:
${headline}

Estilo:
${style}

Formato:
${format}

A thumbnail deve ter aparência profissional, moderna e sofisticada,
alto contraste, composição visual forte, poucos elementos e estética
de conteúdo jurídico premium.
`;

    const result = await openai.images.generate({
      model: "gpt-image-2",
      prompt,
    });

    const imageBase64 = result.data?.[0]?.b64_json;

    if (!imageBase64) {
      throw new Error("A API não retornou a imagem.");
    }

    return NextResponse.json({
      image: `data:image/png;base64,${imageBase64}`,
    });
  } catch (error: any) {
    console.error("ERRO OPENAI:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro desconhecido ao gerar a imagem.",
      },
      { status: 500 }
    );
  }
}