/** 通用的小工具：转义、日期、阅读时长、路径。 */

export const escapeHtml = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );

export const escapeAttr = escapeHtml;

/** 2026-11-20 -> 2026.11.20 */
export function formatDate(iso) {
  const [year, month, day] = String(iso).slice(0, 10).split("-");
  return `${year}.${month}.${day}`;
}

/** 2026-11-20 -> 2026 年 11 月 20 日 */
export function formatDateLong(iso) {
  const [year, month, day] = String(iso).slice(0, 10).split("-");
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

/** 文章阅读时长：中文按 350 字/分钟，西文按 200 词/分钟估算。 */
export function readingTime(text) {
  const cjk = (text.match(/[\u3400-\u9fff]/g) || []).length;
  const latin = (text.replace(/[\u3400-\u9fff]/g, " ").match(/[A-Za-z0-9]+/g) || [])
    .length;
  return Math.max(1, Math.round(cjk / 350 + latin / 200));
}

/** 去掉 Markdown / HTML 标记，用于摘要、搜索与纯文本。 */
export function stripMarkup(markdown) {
  return String(markdown)
    .replace(/^---[\s\S]*?---\s*/m, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(text, length = 120) {
  const clean = String(text).replace(/\s+/g, " ").trim();
  if (Array.from(clean).length <= length) return clean;
  return `${Array.from(clean).slice(0, length).join("")}…`;
}

/** 标题锚点：保留中英文与数字。 */
export function slugifyHeading(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** 标签 / 分类的 URL 片段：允许中文，空格与符号转成连字符。 */
export function taxSlug(label) {
  return String(label)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function tagUrl(label) {
  return `/tags/${encodeURIComponent(taxSlug(label))}/`;
}

export function categoryUrl(label) {
  return `/categories/${encodeURIComponent(taxSlug(label))}/`;
}

export function absoluteUrl(site, path) {
  return new URL(path, site.url).href;
}

export function pad2(number) {
  return String(number).padStart(2, "0");
}

export function xmlEscape(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** 从 Markdown 文件内容中读取第一段可用的摘要。 */
export function firstParagraph(markdown) {
  const blocks = String(markdown)
    .replace(/```[\s\S]*?```/g, "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  const paragraph = blocks.find(
    (block) => !/^#{1,6}\s/.test(block) && !/^[>|!-]/.test(block),
  );
  return truncate(stripMarkup(paragraph || ""), 110);
}
