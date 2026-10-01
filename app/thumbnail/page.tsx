"use client";

import { ChangeEvent, useEffect, useState } from "react";

type StyleType =
  | "Premium"
  | "Impacto Limpo"
  | "Investigativo"
  | "Polêmico";

type FormatType = "YouTube" | "Shorts" | "Instagram";

export default function ThumbnailPage() {
  const [description, setDescription] = useState("");
  const [headline, setHeadline] = useState("");
  const [style, setStyle] = useState<StyleType>("Premium");
  const [format, setFormat] = useState<FormatType>("YouTube");

  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [generated, setGenerated] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const [credits, setCredits] = useState(20);

  useEffect(() => {
    return () => {
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageUrls]);

  function handleImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const remaining = 4 - images.length;
    const selected = files.slice(0, remaining);

    const urls = selected.map((file) => URL.createObjectURL(file));

    setImages((prev) => [...prev, ...selected]);
    setImageUrls((prev) => [...prev, ...urls]);

    event.target.value = "";
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(imageUrls[index]);

    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function generateThumbnail() {
    setError("");

    if (!description.trim()) {
      setError("Digite o assunto da thumbnail.");
      return;
    }

    if (!headline.trim()) {
      setError("Digite o título principal da thumbnail.");
      return;
    }

    if (credits <= 0) {
      setError("Você não possui créditos suficientes.");
      return;
    }

    setGenerating(true);
    setGenerated(null);

    try {
      const response = await fetch("/api/generate-thumbnail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          headline,
          style,
          format,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Não foi possível gerar a thumbnail."
        );
      }

      if (!data?.image) {
        throw new Error("A IA não retornou uma imagem.");
      }

      setGenerated(data.image);
      setCredits((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Erro inesperado ao gerar a thumbnail."
      );
    } finally {
      setGenerating(false);
    }
  }

  function downloadThumbnail() {
    if (!generated) return;

    const link = document.createElement("a");

    link.href = generated;
    link.download = `DRA-thumbnail-${Date.now()}.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  const styles: StyleType[] = [
    "Premium",
    "Impacto Limpo",
    "Investigativo",
    "Polêmico",
  ];

  const formats: FormatType[] = [
    "YouTube",
    "Shorts",
    "Instagram",
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top right, rgba(190,0,0,.10), transparent 30%), #080808",
        color: "#fff",
        padding: "34px",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1250,
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 30,
            gap: 20,
          }}
        >
          <div>
            <div
              style={{
                color: "#ff2020",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 3,
                marginBottom: 8,
              }}
            >
              DRA ADVOCACIA
            </div>

            <h1
              style={{
                fontSize: 30,
                margin: 0,
                fontWeight: 800,
              }}
            >
              Criar Thumbnail
            </h1>

            <p
              style={{
                color: "#8d8d8d",
                marginTop: 8,
                marginBottom: 0,
              }}
            >
              Crie thumbnails profissionais usando inteligência artificial.
            </p>
          </div>

          <div
            style={{
              background: "#111",
              border: "1px solid #252525",
              borderRadius: 14,
              padding: "14px 18px",
              minWidth: 130,
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: "#888",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Créditos
            </div>

            <strong
              style={{
                display: "block",
                fontSize: 24,
                marginTop: 3,
              }}
            >
              {credits}
            </strong>
          </div>
        </div>

        {/* GRID PRINCIPAL */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 320px",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* COLUNA PRINCIPAL */}
          <section
            style={{
              background: "#0d0d0d",
              border: "1px solid #202020",
              borderRadius: 18,
              padding: 24,
            }}
          >
            {/* DESCRIÇÃO */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 9,
                }}
              >
                Sobre o que é a thumbnail?
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: Isenção de imposto de renda para pessoas com doenças graves..."
                rows={5}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  resize: "vertical",
                  background: "#080808",
                  border: "1px solid #292929",
                  color: "#fff",
                  borderRadius: 12,
                  padding: 15,
                  outline: "none",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              />
            </div>

            {/* HEADLINE */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 9,
                }}
              >
                Texto principal da thumbnail
              </label>

              <input
                value={headline}
                onChange={(e) =>
                  setHeadline(e.target.value.toUpperCase())
                }
                placeholder="Ex.: VOCÊ TEM DIREITO?"
                maxLength={55}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#080808",
                  border: "1px solid #292929",
                  color: "#fff",
                  borderRadius: 12,
                  padding: "15px",
                  outline: "none",
                  fontSize: 18,
                  fontWeight: 800,
                }}
              />

              <div
                style={{
                  textAlign: "right",
                  color: "#666",
                  fontSize: 11,
                  marginTop: 5,
                }}
              >
                {headline.length}/55
              </div>
            </div>

            {/* IMAGENS */}
            <div style={{ marginBottom: 25 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 9,
                }}
              >
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Imagens de referência
                </label>

                <span
                  style={{
                    color: "#666",
                    fontSize: 11,
                  }}
                >
                  {images.length}/4
                </span>
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 100,
                  border: "1px dashed #3a3a3a",
                  borderRadius: 12,
                  background: "#090909",
                  cursor:
                    images.length >= 4 ? "not-allowed" : "pointer",
                  color: "#aaa",
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={images.length >= 4}
                  onChange={handleImages}
                  style={{ display: "none" }}
                />

                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 25,
                      marginBottom: 7,
                    }}
                  >
                    +
                  </div>

                  <div style={{ fontSize: 13 }}>
                    Adicionar imagens
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: "#666",
                      marginTop: 4,
                    }}
                  >
                    Até 4 imagens
                  </div>
                </div>
              </label>

              {imageUrls.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(4, minmax(0, 1fr))",
                    gap: 10,
                    marginTop: 12,
                  }}
                >
                  {imageUrls.map((url, index) => (
                    <div
                      key={url}
                      style={{
                        position: "relative",
                        aspectRatio: "16/10",
                        overflow: "hidden",
                        borderRadius: 10,
                        border: "1px solid #292929",
                        background: "#111",
                      }}
                    >
                      <img
                        src={url}
                        alt={`Referência ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />

                      <button
                        onClick={() => removeImage(index)}
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          width: 25,
                          height: 25,
                          borderRadius: "50%",
                          border: "none",
                          background: "rgba(0,0,0,.8)",
                          color: "#fff",
                          cursor: "pointer",
                          fontWeight: 800,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FORMATO */}
            <div style={{ marginBottom: 25 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 10,
                }}
              >
                Formato
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3, minmax(0, 1fr))",
                  gap: 10,
                }}
              >
                {formats.map((item) => {
                  const active = format === item;

                  return (
                    <button
                      key={item}
                      onClick={() => setFormat(item)}
                      style={{
                        padding: "13px 10px",
                        borderRadius: 10,
                        border: active
                          ? "1px solid #ff1f1f"
                          : "1px solid #292929",
                        background: active
                          ? "rgba(255,0,0,.09)"
                          : "#090909",
                        color: active ? "#fff" : "#888",
                        cursor: "pointer",
                        fontWeight: active ? 800 : 600,
                      }}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ESTILO */}
            <div style={{ marginBottom: 25 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 10,
                }}
              >
                Estilo
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: 10,
                }}
              >
                {styles.map((item) => {
                  const active = style === item;

                  return (
                    <button
                      key={item}
                      onClick={() => setStyle(item)}
                      style={{
                        textAlign: "left",
                        padding: "14px",
                        borderRadius: 11,
                        border: active
                          ? "1px solid #ff1f1f"
                          : "1px solid #292929",
                        background: active
                          ? "rgba(255,0,0,.08)"
                          : "#090909",
                        color: active ? "#fff" : "#999",
                        cursor: "pointer",
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          fontSize: 13,
                        }}
                      >
                        {item}
                      </strong>

                      <span
                        style={{
                          display: "block",
                          marginTop: 5,
                          fontSize: 11,
                          color: active ? "#bbb" : "#666",
                        }}
                      >
                        {item === "Premium" &&
                          "Elegante e sofisticado"}
                        {item === "Impacto Limpo" &&
                          "Forte e minimalista"}
                        {item === "Investigativo" &&
                          "Jornalístico e sério"}
                        {item === "Polêmico" &&
                          "Chamativo e provocativo"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ERRO */}
            {error && (
              <div
                style={{
                  background: "rgba(255,0,0,.08)",
                  border: "1px solid rgba(255,0,0,.3)",
                  color: "#ff7070",
                  padding: "12px 14px",
                  borderRadius: 10,
                  marginBottom: 16,
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            {/* BOTÃO */}
            <button
              onClick={generateThumbnail}
              disabled={generating}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 12,
                padding: "17px 20px",
                background: generating
                  ? "#481010"
                  : "linear-gradient(135deg, #ff1717, #b90000)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 800,
                cursor: generating ? "wait" : "pointer",
                boxShadow: generating
                  ? "none"
                  : "0 10px 30px rgba(255,0,0,.16)",
              }}
            >
              {generating
                ? "✨ Criando sua thumbnail..."
                : "✨ Gerar thumbnail com IA"}
            </button>
          </section>

          {/* SIDEBAR */}
          <aside
            style={{
              background: "#0d0d0d",
              border: "1px solid #202020",
              borderRadius: 18,
              padding: 20,
              position: "sticky",
              top: 20,
            }}
          >
            <div
              style={{
                color: "#ff1f1f",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 2,
                marginBottom: 8,
              }}
            >
              DICAS
            </div>

            <h2
              style={{
                fontSize: 19,
                margin: "0 0 18px",
              }}
            >
              Thumbnail que chama atenção
            </h2>

            <Tip
              number="01"
              title="Poucas palavras"
              text="Use uma frase curta e fácil de entender."
            />

            <Tip
              number="02"
              title="Contraste"
              text="O título precisa continuar legível mesmo em tamanho pequeno."
            />

            <Tip
              number="03"
              title="Curiosidade"
              text="Crie uma frase que faça a pessoa querer descobrir a resposta."
            />

            <Tip
              number="04"
              title="Consistência"
              text="Mantenha a identidade visual da DRA em todas as thumbnails."
            />

            <div
              style={{
                marginTop: 22,
                padding: 15,
                borderRadius: 12,
                background:
                  "linear-gradient(135deg, rgba(255,0,0,.10), rgba(255,0,0,.02))",
                border: "1px solid rgba(255,0,0,.18)",
              }}
            >
              <div
                style={{
                  color: "#ff3030",
                  fontSize: 11,
                  fontWeight: 800,
                  marginBottom: 6,
                }}
              >
                SEU PLANO
              </div>

              <strong
                style={{
                  fontSize: 16,
                }}
              >
                DRA Premium
              </strong>

              <div
                style={{
                  color: "#777",
                  fontSize: 12,
                  marginTop: 5,
                }}
              >
                {credits} créditos disponíveis
              </div>
            </div>
          </aside>
        </div>

        {/* RESULTADO */}
        {generated && (
          <section
            style={{
              marginTop: 28,
              background: "#0d0d0d",
              border: "1px solid #202020",
              borderRadius: 18,
              padding: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
                marginBottom: 20,
              }}
            >
              <div>
                <div
                  style={{
                    color: "#ff1f1f",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 2,
                    marginBottom: 6,
                  }}
                >
                  RESULTADO
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: 22,
                  }}
                >
                  Sua thumbnail está pronta
                </h2>
              </div>

              <button
                onClick={downloadThumbnail}
                style={{
                  border: "1px solid #292929",
                  background: "#0a0a0a",
                  color: "#fff",
                  padding: "12px 17px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                ↓ Baixar thumbnail
              </button>
            </div>

            <div
              style={{
                width: "100%",
                overflow: "hidden",
                borderRadius: 14,
                background: "#000",
                border: "1px solid #222",
              }}
            >
              <img
                src={generated}
                alt="Thumbnail gerada pela IA"
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: 12,
                marginTop: 14,
              }}
            >
              <ResultInfo
                label="Formato"
                value={format}
              />

              <ResultInfo
                label="Estilo"
                value={style}
              />

              <ResultInfo
                label="Créditos usados"
                value="1"
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Tip({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "14px 0",
        borderBottom: "1px solid #1d1d1d",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: "#151515",
          border: "1px solid #292929",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ff3030",
          fontSize: 10,
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {number}
      </div>

      <div>
        <strong
          style={{
            display: "block",
            fontSize: 13,
            marginBottom: 4,
          }}
        >
          {title}
        </strong>

        <span
          style={{
            color: "#707070",
            fontSize: 11,
            lineHeight: 1.5,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

function ResultInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#090909",
        border: "1px solid #202020",
        borderRadius: 12,
        padding: 15,
      }}
    >
      <div
        style={{
          color: "#777",
          fontSize: 11,
          marginBottom: 5,
        }}
      >
        {label}
      </div>

      <strong
        style={{
          fontSize: 14,
        }}
      >
        {value}
      </strong>
    </div>
  );
}