function cleanInlineMarkdown(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1 ($2)")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/(`{1,3})(.*?)\1/g, "$2")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(^|\s)(\*|_)(\S.*?)\2(?=\s|$)/g, "$1$3")
    .replace(/~~(.*?)~~/g, "$1")
    .trim();
}

export function formatScriptForCopy(content: string) {
  const formattedLines: string[] = [];

  for (const rawLine of content.replace(/\r\n?/g, "\n").split("\n")) {
    const trimmed = rawLine.trim();
    if (!trimmed || /^([-*_]\s*){3,}$/.test(trimmed)) {
      formattedLines.push("");
      continue;
    }

    const isHeading = /^\s{0,3}#{1,6}\s+/.test(rawLine) || /^\s{0,3}\*\*.+\*\*\s*$/.test(rawLine);
    let line = trimmed
      .replace(/^#{1,6}\s*/, "")
      .replace(/\s+#+\s*$/, "")
      .replace(/^>\s?/, "");
    const isListItem = /^[-*+]\s+/.test(line);
    line = cleanInlineMarkdown(line);

    if (isHeading) line = line.toLocaleUpperCase("pt-BR");
    if (isListItem) line = `• ${line.replace(/^[-*+]\s+/, "")}`;
    formattedLines.push(line);
  }

  return formattedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
