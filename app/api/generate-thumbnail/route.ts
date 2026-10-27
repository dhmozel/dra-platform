import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const imageTypes = new Map<string, { mime: string; extension: string }>([
  ["image/png", { mime: "image/png", extension: "png" }],
  ["image/jpeg", { mime: "image/jpeg", extension: "jpg" }],
  ["image/webp", { mime: "image/webp", extension: "webp" }],
]);

const styles = ["Premium", "Impacto Limpo", "Investigativo", "Polêmico"] as const;
const formats = ["YouTube", "Shorts", "Instagram"] as const;
const maxImageBytes = 3 * 1024 * 1024;

function matchesImageSignature(bytes: Uint8Array, mime: string) {
  if (mime === "image/png") {
    return bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  }
  if (mime === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mime === "image/webp") {
    return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

function promptFor(description: string, headline: string, style: string, format: string) {
  const aspect = format === "Shorts" ? "vertical 9:16" : format === "Instagram" ? "square 1:1" : "horizontal 16:9";
  const styles: Record<string, string> = {
    Premium: "editorial premium for Brazilian legal education, elegant black and warm gold palette, refined lighting and polished composition",
    "Impacto Limpo": "clean high-impact editorial design, strong contrast, minimal background, clear focal point, restrained red accents",
    Investigativo: "investigative documentary editorial, dramatic but credible lighting, thoughtful expression, subtle evidence and newsroom atmosphere",
    Polêmico: "bold debate-oriented editorial composition, energetic expression, vivid contrast and visual tension without sensationalism or misleading claims",
  };

  return `Create a finished ${aspect} YouTube/social video thumbnail for DRA, Daniela Rigol Advocacia. Subject: ${description}. The exact headline text to render is: "${headline}". Keep this Portuguese text legible, correctly spelled, prominent, and inside safe margins; do not add other words, logos, watermarks, or legal claims. Visual direction: ${styles[style]}. Use professional art direction, a clear focal subject, strong small-screen readability, and an educational, trustworthy tone. If reference images are supplied, use them only to guide the requested subject, likeness, or visual direction. Composition: ${aspect}.`;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const description = form.get("description");
    const headline = form.get("headline");
    const style = form.get("style");
    const format = form.get("format");

    if (typeof description !== "string" || !description.trim() || description.length > 3000) {
      return NextResponse.json({ error: "Informe uma descrição com até 3.000 caracteres." }, { status: 400 });
    }
    if (typeof headline !== "string" || !headline.trim() || headline.length > 55) {
      return NextResponse.json({ error: "Informe um título de até 55 caracteres." }, { status: 400 });
    }
    if (typeof style !== "string" || !styles.includes(style as (typeof styles)[number])) {
      return NextResponse.json({ error: "Escolha um estilo visual válido." }, { status: 400 });
    }
    if (typeof format !== "string" || !formats.includes(format as (typeof formats)[number])) {
      return NextResponse.json({ error: "Escolha um formato válido." }, { status: 400 });
    }

    const references = form.getAll("references");
    if (references.length > 4) {
      return NextResponse.json({ error: "Envie até quatro imagens de referência válidas." }, { status: 400 });
    }

    const uploadedImages = [];
    for (const [index, reference] of references.entries()) {
      if (!(reference instanceof File)) {
        return NextResponse.json({ error: "Envie apenas arquivos de imagem." }, { status: 400 });
      }
      const file = reference;
      const imageType = imageTypes.get(file.type);
      if (!imageType || file.size === 0 || file.size > maxImageBytes) {
        return NextResponse.json({ error: "Cada referência deve ser PNG, JPG ou WebP e ter até 3 MB." }, { status: 400 });
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!matchesImageSignature(bytes, file.type)) {
        return NextResponse.json({ error: "Uma das referências não corresponde a um arquivo de imagem válido." }, { status: 400 });
      }
      uploadedImages.push(await toFile(bytes, `reference-${index + 1}.${imageType.extension}`, { type: imageType.mime }));
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "A geração de imagens não está configurada. Configure a chave OpenAI no servidor." }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });
    const prompt = promptFor(description.trim(), headline.trim(), style, format);
    const size = format === "Shorts" ? "864x1536" : format === "Instagram" ? "1024x1024" : "1536x864";
    const result = uploadedImages.length
      ? await openai.images.edit({ model: "gpt-image-2.5-flare", image: uploadedImages, prompt, size, quality: "medium", output_format: "png" })
      : await openai.images.generate({ model: "gpt-image-2.5-flare", prompt, size, quality: "medium", output_format: "png", n: 1 });
    const image = result.data?.[0]?.b64_json;
    if (!image) return NextResponse.json({ error: "A OpenAI não retornou uma imagem. Tente novamente." }, { status: 502 });

    return NextResponse.json({ image: `data:image/png;base64,${image}` });
  } catch (error) {
    const apiError = error as { status?: number; code?: string; type?: string };
    if (apiError.code === "insufficient_quota" || apiError.code === "credit_balance_exhausted") {
      return NextResponse.json({ error: "A conta OpenAI está sem saldo disponível para gerar imagens." }, { status: 402 });
    }
    if (apiError.status === 401) return NextResponse.json({ error: "A chave OpenAI do servidor é inválida ou foi revogada." }, { status: 401 });
    if (apiError.status === 403) return NextResponse.json({ error: "A conta OpenAI não tem acesso ao modelo de imagens solicitado." }, { status: 403 });
    if (apiError.status === 429) return NextResponse.json({ error: "O limite de uso da OpenAI foi atingido. Aguarde um pouco e tente novamente." }, { status: 429 });
    console.error("Erro na geração de thumbnail:", error);
    return NextResponse.json({ error: "Não foi possível gerar a thumbnail agora. Confira a disponibilidade da conta OpenAI e tente novamente." }, { status: 500 });
  }
}
