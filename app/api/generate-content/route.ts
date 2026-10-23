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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { format, topic, goal, duration, transcript } = body ?? {};
    const allowed = ["YouTube longo", "Reels", "YouTube Shorts", "TikTok", "Stories", "Comunidade WhatsApp", "Carrossel"];

    if (typeof format !== "string" || !allowed.includes(format)) {
      return NextResponse.json({ error: "Escolha um formato válido." }, { status: 400 });
    }
    if (typeof topic !== "string" || !topic.trim() || topic.length > 5000) {
      return NextResponse.json({ error: "Informe um assunto de até 5.000 caracteres." }, { status: 400 });
    }
    if (typeof goal === "string" && goal.length > 2000 || typeof transcript === "string" && transcript.length > 30000) {
      return NextResponse.json({ error: "O contexto enviado é muito longo." }, { status: 400 });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Configure OPENAI_API_KEY nas variáveis de ambiente do projeto." }, { status: 500 });

    const openai = new OpenAI({ apiKey });
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      instructions: baseInstructions,
      input: promptFor(format, topic.trim(), typeof goal === "string" ? goal : "", typeof duration === "string" ? duration : "10 minutos", typeof transcript === "string" ? transcript : ""),
    });
    const raw = response.output_text.trim();
    const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    let parsed: { outputs?: OutputShape[] };
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return NextResponse.json({ error: "A IA retornou um formato inesperado. Tente gerar novamente." }, { status: 502 });
    }
    const outputs = Array.isArray(parsed.outputs)
      ? parsed.outputs.filter((item) => item && typeof item.title === "string" && typeof item.content === "string").slice(0, 12)
      : [];
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

type OutputShape = { title: string; content: string };
