import { Marked } from "marked";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";
import {
  escapeAttr,
  escapeHtml,
  slugifyHeading,
} from "./utils.mjs";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("md", markdown);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("yml", yaml);

const LANGUAGE_LABELS = {
  bash: "SHELL",
  shell: "SHELL",
  css: "CSS",
  html: "HTML",
  javascript: "JS",
  js: "JS",
  json: "JSON",
  markdown: "MD",
  md: "MD",
  typescript: "TS",
  ts: "TS",
  xml: "XML",
  yaml: "YAML",
  yml: "YAML",
};

function stripTags(html) {
  return String(html)
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function renderCode(text, language) {
  const lang = String(language || "")
    .trim()
    .split(/\s+/)[0]
    .toLowerCase();
  let highlighted;
  let resolved = lang;
  if (lang && hljs.getLanguage(lang)) {
    try {
      highlighted = hljs.highlight(text, { language: lang }).value;
    } catch {
      highlighted = escapeHtml(text);
    }
  } else {
    highlighted = escapeHtml(text);
    resolved = "";
  }
  const label = LANGUAGE_LABELS[resolved] || (resolved ? resolved.toUpperCase() : "CODE");
  const langClass = resolved ? ` language-${escapeAttr(resolved)}` : "";
  return `<div class="codeblock">
  <div class="codeblock__bar"><span class="codeblock__lang">${label}</span><button class="codeblock__copy" type="button" data-copy aria-label="复制代码">复制</button></div>
  <pre tabindex="0"><code class="hljs${langClass}">${highlighted}</code></pre>
</div>`;
}

/**
 * 渲染 Markdown。
 * @param {string} markdown
 * @param {{ collectHeadings?: boolean }} options
 * @returns {{ html: string, headings: Array<{id:string,label:string,depth:number}> }}
 */
export function renderMarkdown(markdown, options = {}) {
  const headings = [];
  const usedIds = new Map();
  const collect = Boolean(options.collectHeadings);

  const instance = new Marked({ gfm: true, breaks: false });
  instance.use({
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        const label = stripTags(inner) || "section";
        const base = slugifyHeading(label) || "section";
        const seen = usedIds.get(base) || 0;
        usedIds.set(base, seen + 1);
        const id = seen === 0 ? base : `${base}-${seen + 1}`;
        if (collect && depth >= 2 && depth <= 3) {
          headings.push({ id, label, depth });
        }
        return `<h${depth} id="${escapeAttr(id)}"><span class="h-text">${inner}</span><a class="h-anchor" href="#${escapeAttr(id)}" aria-label="链接到本节：${escapeAttr(label)}">#</a></h${depth}>\n`;
      },
      code({ text, lang }) {
        return `${renderCode(text, lang)}\n`;
      },
      image({ href, title, text }) {
        const img = `<img src="${escapeAttr(href)}" alt="${escapeAttr(text || "")}" loading="lazy" decoding="async">`;
        if (title) {
          return `<figure>${img}<figcaption>${escapeHtml(title)}</figcaption></figure>`;
        }
        return img;
      },
      paragraph({ tokens }) {
        if (
          tokens.length === 1 &&
          tokens[0].type === "image" &&
          tokens[0].title
        ) {
          return `${this.image(tokens[0])}\n`;
        }
        return `<p>${this.parser.parseInline(tokens)}</p>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const titleAttr = title ? ` title="${escapeAttr(title)}"` : "";
        return `<a href="${escapeAttr(href)}"${titleAttr}>${text}</a>`;
      },
      table({ header, rows }) {
        const head = header
          .map(
            (cell) =>
              `<th${cell.align ? ` style="text-align:${cell.align}"` : ""}>${this.parser.parseInline(cell.tokens)}</th>`,
          )
          .join("");
        const body = rows
          .map(
            (row) =>
              `<tr>${row
                .map(
                  (cell) =>
                    `<td${cell.align ? ` style="text-align:${cell.align}"` : ""}>${this.parser.parseInline(cell.tokens)}</td>`,
                )
                .join("")}</tr>`,
          )
          .join("");
        return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>\n`;
      },
    },
  });

  const html = instance.parse(markdown, { async: false });
  return { html, headings };
}
