/**
 * Sanitize input to plain text only. No HTML, markdown, or rich text.
 */

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .trim();
}

export function sanitizeText(value: string, maxLength = 10000): string {
  if (typeof value !== "string") return "";
  let s = value
    .replace(/[\u201C\u201D]/g, '"') // fancy double quotes
    .replace(/[\u2018\u2019]/g, "'") // fancy single quotes
    .trim();
  s = stripHtml(s);
  s = stripMarkdown(s);
  return s.slice(0, maxLength);
}

export function sanitizeTitle(value: string, maxLength = 500): string {
  return sanitizeText(value, maxLength).replace(/\n/g, " ").trim();
}

export function sanitizeContent(value: string, maxLength = 10000): string {
  return sanitizeText(value, maxLength);
}

export function sanitizeAuthor(value: string, maxLength = 200): string {
  return sanitizeText(value, maxLength).replace(/\n/g, " ").trim();
}

export function parseHashtags(input: string | string[]): string[] {
  if (Array.isArray(input)) {
    return input
      .flatMap((s) => s.split(/[\s,#]+/))
      .map((t) => t.replace(/^#/, "").toLowerCase().trim())
      .filter(Boolean);
  }
  return String(input)
    .split(/[\s,#]+/)
    .map((t) => t.replace(/^#/, "").toLowerCase().trim())
    .filter(Boolean);
}
