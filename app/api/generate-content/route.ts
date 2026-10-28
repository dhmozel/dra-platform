import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const baseInstructions = `
Você é a DRA IA, assistente editorial da D R A · Daniela Rigol Advocacia, escritório de advocacia com atuação tributária e previdenciária militar. Escreva em português brasileiro, com clareza, empatia e linguagem acessível a aposentados, pensionistas e militares da reserva/reforma, frequentemente acima de 45 anos.

REGRAS OBRIGATÓRIAS:
- Não prometa resultados, não garanta direitos sem fatos suficientes e não incentive captação irregular. Respeite a ética profissional da OAB.
- Não invente leis, artigos, requisitos, decisões, números, estatísticas ou fatos. Quando faltarem dados jurídicos confirmados, sinalize [REVISÃO JURÍDICA NECESSÁRIA] e escreva de modo condicional.
- Nunca exponha nome, CPF, número de processo ou outros dados identificáveis de clientes.
- Não repita o mesmo gancho só porque o assunto se repete. Todo roteiro termina com CTA adequado.
- Evite caixa alta excessiva, exclamações em excesso, frases artificiais e excesso de emojis.
- Não invente timestamps. Para vídeo sem transcrição com tempos, diga que os capítulos precisam ser cronometrados no vídeo final.
- Não trate projeto de lei como lei vigente. Explique o que vale hoje, o que pode mudar e para quem.
- Todo conteúdo deve explicar o que o assunto significa na prática e para quem se aplica.
- Não crie estimativas numéricas de CTR ou desempenho sem dados reais. Se sugerir potencial de clique, identifique como avaliação qualitativa, não garantia.
- Entregue os resultados em blocos claramente nomeados, prontos para copiar e revisar.
`;

function promptFor(format: string, topic: string, goal: string, duration: string, transcript: string) {
  const context = `FORMATO: ${format}\nASSUNTO: ${topic}\nOBJETIVO/PALAVRA-CHAVE: ${goal || "não especificado"}\nDURAÇÃO: ${duration}\nTRANSCRIÇÃO/CONTEXTO: ${transcript || "Não fornecido."}`;
  const prompts: Record<string, string> = {
    "Roteiro normal": `Crie um roteiro estruturado para vídeo normal de YouTube com a duração solicitada. Entregue blocos: título de trabalho; objetivo e público; gancho de abertura; introdução; desenvolvimento em seções com falas naturais e transições; conclusão; CTA adequado. Desenvolva o suficiente para a duração, sinalize afirmações que precisam de revisão jurídica e não invente leis ou resultados.`,
    "Roteiro Shorts": `Crie um roteiro estruturado para YouTube Shorts com a duração solicitada. Entregue blocos: gancho para os primeiros segundos; fala completa em frases naturais; desenvolvimento objetivo; conclusão e CTA adequado. Mantenha ritmo vertical e foco em uma única ideia. Sinalize afirmações que precisam de revisão jurídica; não invente leis ou resultados.`,
    "YouTube longo": `Crie pacote editorial para vídeo longo horizontal do YouTube. Gere 3 títulos com até 70 caracteres, sem caixa alta e com o assunto no início; uma descrição seguindo este padrão: abertura explicando o assunto e benefício possível sem prometer resultado, seção "📌 ACOMPANHE O NOSSO TRABALHO: • Instagram: @dradanielarigol", seção "⏱️ CAPÍTULOS DO VÍDEO:" com 8 a 10 capítulos que contam a história do vídeo, primeiro capítulo em 00:00, e 5 hashtags minúsculas. Se não houver transcrição com timestamps, NÃO invente tempos: deixe os tempos como "[CRONOMETRAR]" exceto 00:00 e sinalize que precisam ser conferidos. Gere também 3 opções de texto de thumbnail com pelo menos 3 palavras em maiúsculas e uma direção visual 16:9: Dra. de um lado, texto do outro, alto contraste dourado/amarelo e branco, cenário e expressão variados. Inclua checklist de revisão antes de publicar.`,
    "Reels": `Crie um roteiro vertical de ${duration}, com gancho forte nos 3 primeiros segundos, fala completa em frases naturais, desenvolvimento claro, CTA final e legenda do Reels. A legenda deve seguir o padrão: "Se você é aposentado, pensionista ou militar da reserva/reforma e [situação ligada ao assunto], atenção."; parágrafo curto explicando o tema; frase de virada; CTA com palavra-chave de comentário coerente com a automação (sugira uma e marque para confirmar); fechamento "Siga @dradanielarigol para acompanhar informações sobre seus direitos." Não use hashtags na legenda-modelo, não prometa resultados nem exponha clientes. Gere também 3 opções de capa, pelo menos 3 palavras em maiúsculas, texto e rosto dentro da área central 3:4 do formato 9:16.`,
    "YouTube Shorts": `Crie pacote para YouTube Shorts com roteiro vertical de ${duration} (se solicitado), 3 títulos com até 60 caracteres, sem caixa alta e com assunto primeiro, descrição de 2 linhas + "📌 Instagram: @dradanielarigol" + #shorts #direitomilitar #isençãodeir. O vídeo não deve ter marca d'água de outra plataforma. Não prometa resultados nem exponha clientes.`,
    "TikTok": `Crie roteiro vertical de ${duration} (se solicitado) e 3 opções de legenda TikTok com 2 a 4 linhas: primeira linha pergunta/frase de busca com assunto + militar + imposto de renda quando relevante; resposta simples sem juridiquês; CTA para comentar ou compartilhar com a família; 3 a 5 hashtags específicas. Gere 3 ganchos de tela de até 6 palavras para os primeiros 2 segundos. Não use #fyp/#viral, "dê dois toques na tela" ou CTA de comentário automático sem confirmar que há automação TikTok.`,
    "Stories": `Crie um Story prioritário único, com começo, meio e fim no mesmo story: gancho, informação útil e um único CTA. O público não conhece o tema: explique o que significa para a pessoa e para quem vale. Se for notícia/projeto, separe o que vale hoje do que pode mudar. Sugira sticker real do Instagram, sem desenhar caixinha ou botão na arte. Arte: vertical 9:16, título estilo Playfair Display negrito, texto estilo Lora, agenda DRA à direita ocupando cerca de 1/3 da altura, couro preto-café fosco, espiral cobre, DRA dourado, sobrancelhas brancas, dois olhos pretos abertos, sorriso simples, mãos brancas e tênis pretos com sola branca. Deixe área livre para sticker; sem elementos importantes nos 250 px superiores e 300 px inferiores. Gere texto e prompt visual completo. IA no máximo 2 vezes por semana e mascote no máximo 1 vez por semana, quando esse histórico for conhecido.`,
    "Comunidade WhatsApp": `Crie uma postagem de WhatsApp com começo, desenvolvimento, conclusão e uma interação no final. Uma ou duas postagens por dia de segunda a sexta, alternando assuntos. Explique o significado para o cliente, para quem vale e o próximo passo. Para novidades, diga o que vale hoje e o que muda. Não inclua campos em aberto sem marcá-los claramente para revisão. Sugira texto puro, enquete ou PDF informativo conforme o tema. A Comunidade é só para clientes; sentenças e tutelas devem ser totalmente anonimizadas. Se sugerir arte, use formato vertical 9:16, fundo claro, título preto e dourado estilo Playfair Display, texto Lora, agenda fosca padronizada, logo DRA e rodapé "CONFIANÇA QUE GERA RESULTADOS".`,
    "Carrossel": `Crie um carrossel original, evitando clichês e repetição previsível. Entregue: conceito, público, objetivo, texto slide a slide (capa, desenvolvimento e conclusão/CTA), legenda, prompt visual completo para cada slide e checklist de revisão. Use linguagem acessível, sem prometer resultado jurídico e sem dados de clientes. Visual DRA premium, preto/café, dourado e creme, título estilo Playfair Display e texto estilo Lora. Marque afirmações legais que exigem revisão jurídica.`
  };
  return `${context}\n\nTAREFA:\n${prompts[format] || prompts["YouTube longo"]}\n\nRetorne JSON válido neste formato: {"outputs":[{"title":"Nome do bloco","content":"Texto completo"}]}. Crie blocos separados para cada entrega.`;
}

function normalizeGeneratedText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
}

type ScriptSectionKey = "title" | "objective" | "hook" | "introduction" | "development" | "conclusion" | "cta";
type OutputShape = { title: string; content: string };
type TitleCaptionOptions = {
  audience: string;
  objective: "engajamento" | "autoridade" | "educação" | "alcance" | "conversão";
  platform: "Instagram" | "Reels" | "Stories" | "LinkedIn";
  tone: "profissional" | "educativo" | "persuasivo" | "descontraído";
  titleCount: number;
  captionLength: "curto" | "médio" | "longo";
  additionalContext: string;
};

const titleCaptionObjectives = ["engajamento", "autoridade", "educação", "alcance", "conversão"] as const;
const titleCaptionPlatforms = ["Instagram", "Reels", "Stories", "LinkedIn"] as const;
const titleCaptionTones = ["profissional", "educativo", "persuasivo", "descontraído"] as const;
const titleCaptionLengths = ["curto", "médio", "longo"] as const;

const scriptSectionKeys: ScriptSectionKey[] = ["title", "objective", "hook", "introduction", "development", "conclusion", "cta"];

function isOutputShape(value: unknown): value is OutputShape {
  if (!value || typeof value !== "object") return false;
  const output = value as Record<string, unknown>;
  return typeof output.title === "string" && !!output.title.trim() && typeof output.content === "string" && !!output.content.trim();
}

function parseOutputs(raw: string, echoedRequests: Set<string>): OutputShape[] {
  const jsonText = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let parsed: { outputs?: unknown };
  try {
    parsed = JSON.parse(jsonText) as { outputs?: unknown };
  } catch {
    return [];
  }
  if (!Array.isArray(parsed.outputs)) return [];
  return parsed.outputs
    .filter(isOutputShape)
    .filter((output) => !echoedRequests.has(normalizeGeneratedText(output.content)))
    .slice(0, 12);
}

function isTitleCaptionOptions(value: unknown): value is TitleCaptionOptions {
  if (!value || typeof value !== "object") return false;
  const options = value as Record<string, unknown>;
  return (
    typeof options.audience === "string" && options.audience.trim().length > 0 && options.audience.length <= 300 &&
    typeof options.objective === "string" && titleCaptionObjectives.includes(options.objective as TitleCaptionOptions["objective"]) &&
    typeof options.platform === "string" && titleCaptionPlatforms.includes(options.platform as TitleCaptionOptions["platform"]) &&
    typeof options.tone === "string" && titleCaptionTones.includes(options.tone as TitleCaptionOptions["tone"]) &&
    typeof options.titleCount === "number" && Number.isInteger(options.titleCount) && options.titleCount >= 2 && options.titleCount <= 10 &&
    typeof options.captionLength === "string" && titleCaptionLengths.includes(options.captionLength as TitleCaptionOptions["captionLength"]) &&
    typeof options.additionalContext === "string" && options.additionalContext.length <= 5000
  );
}

function promptForTitleCaption(topic: string, options: TitleCaptionOptions) {
  return `
Crie um pacote de títulos e legenda para a D R A · Daniela Rigol Advocacia.

TEMA: ${topic}
PÚBLICO-ALVO: ${options.audience}
OBJETIVO: ${options.objective}
PLATAFORMA: ${options.platform}
TOM: ${options.tone}
TAMANHO DA LEGENDA: ${options.captionLength}
CONTEXTO ADICIONAL: ${options.additionalContext || "Não fornecido."}

Gere exatamente ${options.titleCount} opções de título, distintas entre si e coerentes com o tema, o público, o objetivo e a plataforma. Evite promessas, garantias, sensacionalismo, caixa alta excessiva e títulos repetidos com pequenas variações.
Escreva uma legenda com abertura atrativa, desenvolvimento claro e chamada para ação adequada ao objetivo e à plataforma. Respeite o tamanho solicitado sem perder clareza.
Gere hashtags relacionadas ao tema, ao público e à plataforma, sem hashtags genéricas ou alegações de alcance garantido.
Use português brasileiro e a linguagem acessível, responsável e profissional da Dra. Daniela Rigol. Não invente fatos, estatísticas, leis, decisões, fontes ou requisitos. Não prometa resultados jurídicos. Se o tema exigir confirmação jurídica, use [REVISÃO JURÍDICA NECESSÁRIA] junto à afirmação que precisa de validação. Use somente informações fornecidas no tema/contexto.

Retorne JSON válido com a chave "outputs". Cada título deve ser um bloco separado chamado "Título 1", "Título 2" e assim sucessivamente. Inclua exatamente um bloco chamado "Legenda" e um chamado "Hashtags". O campo content de cada bloco deve conter somente o texto daquele item, sem copiar estas instruções. Formato:
{"outputs":[{"title":"Título 1","content":"..."},{"title":"Legenda","content":"Abertura...\\n\\nDesenvolvimento...\\n\\nCTA..."},{"title":"Hashtags","content":"#... #..."}]}
`;
}

function titleCaptionOutputFormat(options: TitleCaptionOptions) {
  const titleLabels = Array.from({ length: options.titleCount }, (_, index) => `Título ${index + 1}`);
  return {
    type: "json_schema" as const,
    name: "dra_titles_legendas",
    strict: true,
    schema: {
      type: "object",
      properties: {
        outputs: {
          type: "array",
          minItems: options.titleCount + 2,
          maxItems: options.titleCount + 2,
          items: {
            type: "object",
            properties: {
              title: { type: "string", enum: [...titleLabels, "Legenda", "Hashtags"] },
              content: { type: "string" },
            },
            required: ["title", "content"],
            additionalProperties: false,
          },
        },
      },
      required: ["outputs"],
      additionalProperties: false,
    },
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { format, topic, goal, duration, transcript, mode, missingSections, existingOutputs, titleCaption } = body ?? {};
    const allowed = ["YouTube longo", "Roteiro normal", "Roteiro Shorts", "Reels", "YouTube Shorts", "TikTok", "Stories", "Comunidade WhatsApp", "Carrossel", "Títulos e Legendas"];

    if (typeof format !== "string" || !allowed.includes(format)) {
      return NextResponse.json({ error: "Escolha um formato válido." }, { status: 400 });
    }
    if (typeof topic !== "string" || !topic.trim() || topic.length > 5000) {
      return NextResponse.json({ error: "Informe um assunto de até 5.000 caracteres." }, { status: 400 });
    }
    if (format === "Títulos e Legendas" && !isTitleCaptionOptions(titleCaption)) {
      return NextResponse.json({ error: "Revise público, objetivo, plataforma, tom, quantidade de títulos e tamanho da legenda." }, { status: 400 });
    }
    const durations = ["1 minuto", "1 minuto e 30 segundos", "3 minutos", "5 minutos", "10 minutos", "15 minutos"];
    if (duration !== undefined && (typeof duration !== "string" || !durations.includes(duration))) {
      return NextResponse.json({ error: "Escolha uma duração de vídeo válida." }, { status: 400 });
    }
    if (typeof goal === "string" && goal.length > 2000 || typeof transcript === "string" && transcript.length > 30000) {
      return NextResponse.json({ error: "O contexto enviado é muito longo." }, { status: 400 });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Configure OPENAI_API_KEY nas variáveis de ambiente do projeto." }, { status: 500 });

    const openai = new OpenAI({ apiKey });

    if (mode === "complete-missing-script-sections") {
      if ((format !== "Roteiro normal" && format !== "Roteiro Shorts") || !Array.isArray(missingSections) || missingSections.length === 0 || missingSections.length > scriptSectionKeys.length || !missingSections.every((section: unknown) => typeof section === "string" && scriptSectionKeys.includes(section as ScriptSectionKey))) {
        return NextResponse.json({ error: "Os dados para completar as seções do roteiro são inválidos." }, { status: 400 });
      }
      if (!Array.isArray(existingOutputs) || existingOutputs.length === 0 || existingOutputs.length > 12 || !existingOutputs.every(isOutputShape)) {
        return NextResponse.json({ error: "O roteiro existente não tem uma estrutura válida para completar." }, { status: 400 });
      }
      const existingTextLength = (existingOutputs as OutputShape[]).reduce((total, output) => total + output.title.length + output.content.length, 0);
      if (existingTextLength > 60_000) return NextResponse.json({ error: "O roteiro existente é longo demais para completar." }, { status: 413 });

      const missingLabels = (missingSections as ScriptSectionKey[]).join(", ");
      const completionPrompt = `Complete somente estas seções ausentes: ${missingLabels}. Não reescreva, repita nem altere as seções já existentes. Preserve o tema e a duração. Para CTA, produza uma chamada adequada e ética, sem prometer resultados jurídicos.\n\nFORMATO: ${format}\nASSUNTO: ${topic.trim()}\nOBJETIVO/PALAVRA-CHAVE: ${typeof goal === "string" ? goal : "não especificado"}\nDURAÇÃO: ${typeof duration === "string" ? duration : "10 minutos"}\n\nSEÇÕES JÁ GERADAS (apenas contexto; não as repita):\n${JSON.stringify(existingOutputs)}\n\nRetorne JSON válido no formato {"outputs":[{"title":"Nome da seção ausente","content":"Texto gerado para essa seção"}]}. Gere somente as seções pedidas.`;
      const completion = await openai.responses.create({
        model: "gpt-4.1-mini",
        instructions: `${baseInstructions}\nComplete apenas as seções explicitamente pedidas pelo usuário desta chamada. Não devolva as seções que já foram fornecidas como contexto.`,
        input: completionPrompt,
      });
      const echoedRequests = new Set([completionPrompt, topic.trim()].map(normalizeGeneratedText));
      const completedOutputs = parseOutputs(completion.output_text, echoedRequests);
      if (completedOutputs.length === 0) return NextResponse.json({ error: "A IA não conseguiu completar as seções ausentes." }, { status: 502 });
      return NextResponse.json({ outputs: completedOutputs });
    }

    if (mode !== undefined) return NextResponse.json({ error: "Modo de geração inválido." }, { status: 400 });

    const basePrompt = format === "Títulos e Legendas"
      ? promptForTitleCaption(topic.trim(), titleCaption as TitleCaptionOptions)
      : promptFor(format, topic.trim(), typeof goal === "string" ? goal : "", typeof duration === "string" ? duration : "10 minutos", typeof transcript === "string" ? transcript : "");
    const scriptSectionsInstruction = format === "Roteiro normal" || format === "Roteiro Shorts"
      ? "\nPara roteiros, inclua blocos distintos para título de trabalho, objetivo e público, gancho de abertura, introdução, desenvolvimento com todas as seções necessárias, conclusão e CTA. O campo content de cada bloco deve conter texto efetivamente gerado; não copie estas instruções ou o pedido do usuário como resultado."
      : "";
    const generationPrompt = `${basePrompt}${scriptSectionsInstruction}`;
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      instructions: baseInstructions,
      input: generationPrompt,
      ...(format === "Títulos e Legendas" && isTitleCaptionOptions(titleCaption)
        ? { text: { format: titleCaptionOutputFormat(titleCaption) } }
        : {}),
    });
    const echoedRequests = new Set([topic.trim(), generationPrompt].map(normalizeGeneratedText));
    const outputs = parseOutputs(response.output_text, echoedRequests);
    if (!outputs.length) return NextResponse.json({ error: "A IA não retornou conteúdo utilizável." }, { status: 502 });
    return NextResponse.json({ outputs });
  } catch (error) {
    console.error("Erro ao gerar conteúdo DRA:", error);
    const apiError = error as { status?: number; code?: string; type?: string };
    if (apiError?.code === "insufficient_quota" || apiError?.code === "credit_balance_exhausted") {
      return NextResponse.json({ error: "A API está sem créditos disponíveis. Adicione saldo à conta da API para gerar conteúdo." }, { status: 402 });
    }
    if (apiError?.status === 401) return NextResponse.json({ error: "A chave da API é inválida ou foi revogada. Atualize OPENAI_API_KEY." }, { status: 401 });
    return NextResponse.json({ error: "Não foi possível gerar conteúdo agora. Verifique a configuração da API e tente novamente." }, { status: 500 });
  }
}
