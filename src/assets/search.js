/* 静态全文搜索：读取 /search.json，在本地完成匹配与排序。 */

(function () {
  "use strict";

  const form = document.querySelector(".search__form");
  const input = document.getElementById("search-input");
  const status = document.getElementById("search-status");
  const results = document.getElementById("search-results");
  const hint = document.getElementById("search-hint");
  if (!form || !input || !status || !results) return;

  let index = [];
  let ready = false;
  let failed = false;
  let timer = 0;

  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  function setStatus(message) {
    status.textContent = message;
  }

  function score(post, terms) {
    const title = post.t.toLowerCase();
    const summary = post.x.toLowerCase();
    const body = post.b.toLowerCase();
    const tags = post.g.map((tag) => tag.toLowerCase());
    let total = 0;

    for (const term of terms) {
      const inTitle = title.includes(term);
      const inTags = tags.some((tag) => tag.includes(term));
      const inSummary = summary.includes(term);
      const bodyIndex = body.indexOf(term);

      if (!inTitle && !inTags && !inSummary && bodyIndex === -1) {
        return 0;
      }

      if (inTitle) total += 14;
      if (inTags) total += 7;
      if (inSummary) total += 5;
      if (bodyIndex !== -1) {
        total += 2 + Math.max(0, 2 - bodyIndex / 600);
      }
    }

    return total;
  }

  function highlight(element, text, terms) {
    if (!terms.length) {
      element.textContent = text;
      return;
    }
    const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
    const parts = text.split(pattern);
    const lowered = terms.map((term) => term.toLowerCase());
    for (const part of parts) {
      if (!part) continue;
      if (lowered.includes(part.toLowerCase())) {
        const mark = document.createElement("mark");
        mark.textContent = part;
        element.appendChild(mark);
      } else {
        element.appendChild(document.createTextNode(part));
      }
    }
  }

  function renderEmpty() {
    results.replaceChildren();
    if (!ready && !failed) {
      setStatus("正在加载文章索引…");
      return;
    }
    if (failed) {
      setStatus("搜索索引加载失败，请刷新页面后重试。");
      return;
    }
    setStatus(`共收录 ${index.length} 篇文章。输入关键词开始搜索。`);
  }

  function renderNoResults(query) {
    results.replaceChildren();
    const box = document.createElement("div");
    box.className = "search-empty";
    const title = document.createElement("strong");
    title.textContent = `没有找到与「${query}」相关的文章`;
    const copy = document.createElement("p");
    copy.textContent = "试试更短的关键词，或者去归档页按时间浏览。";
    box.append(title, copy);
    results.appendChild(box);
    setStatus(`0 条结果 · ${query}`);
  }

  function renderHits(hits, terms, query) {
    results.replaceChildren();
    for (const post of hits) {
      const article = document.createElement("article");
      article.className = "search-result";

      const link = document.createElement("a");
      link.href = post.u;

      const meta = document.createElement("p");
      meta.className = "search-result__meta";
      const category = document.createElement("span");
      category.textContent = post.c;
      const date = document.createElement("time");
      date.dateTime = post.d.replaceAll(".", "-");
      date.textContent = post.d;
      const minutes = document.createElement("span");
      minutes.textContent = `${post.rt} 分钟`;
      meta.append(category, date, minutes);

      const title = document.createElement("h2");
      title.className = "search-result__title";
      highlight(title, post.t, terms);

      const summary = document.createElement("p");
      summary.className = "search-result__summary";
      highlight(summary, post.x, terms);

      link.append(meta, title, summary);
      article.appendChild(link);
      results.appendChild(article);
    }
    setStatus(`${hits.length} 条结果 · ${query}`);
  }

  function run(query, { updateUrl = true } = {}) {
    const trimmed = query.trim();
    if (updateUrl) {
      const url = new URL(window.location.href);
      if (trimmed) {
        url.searchParams.set("q", trimmed);
      } else {
        url.searchParams.delete("q");
      }
      window.history.replaceState(null, "", url);
    }

    if (!trimmed) {
      renderEmpty();
      return;
    }
    if (!ready) {
      if (failed) setStatus("搜索索引加载失败，请刷新页面后重试。");
      else setStatus("正在加载文章索引…");
      return;
    }

    const terms = Array.from(
      new Set(
        trimmed
          .toLowerCase()
          .split(/\s+/)
          .filter((term) => term.length > 0),
      ),
    );

    const hits = index
      .map((post) => ({ post, score: score(post, terms) }))
      .filter((hit) => hit.score > 0)
      .sort((a, b) => b.score - a.score || (a.post.d < b.post.d ? 1 : -1))
      .slice(0, 20)
      .map((hit) => hit.post);

    if (!hits.length) {
      renderNoResults(trimmed);
      return;
    }
    renderHits(hits, terms, trimmed);
  }

  function schedule() {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => run(input.value), 120);
  }

  input.addEventListener("input", schedule);
  input.addEventListener("search", () => run(input.value));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    window.clearTimeout(timer);
    run(input.value);
  });

  document.addEventListener("keydown", (event) => {
    const tag = document.activeElement?.tagName;
    const typing = tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable;
    if (event.key === "/" && !typing) {
      event.preventDefault();
      input.focus();
      input.select();
    }
    if (event.key === "Escape" && document.activeElement === input) {
      input.value = "";
      input.blur();
      run("", { updateUrl: true });
    }
  });

  if (hint) hint.hidden = false;

  const initial = new URL(window.location.href).searchParams.get("q") ?? "";
  if (initial) {
    input.value = initial;
    setStatus("正在加载文章索引…");
  } else {
    renderEmpty();
  }

  fetch("/search.json")
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      index = Array.isArray(data) ? data : [];
      ready = true;
      run(initial, { updateUrl: false });
    })
    .catch(() => {
      failed = true;
      setStatus("搜索索引加载失败，请刷新页面后重试。");
    });
})();
