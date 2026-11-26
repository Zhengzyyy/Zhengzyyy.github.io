import { aboutArt, heroArt, logoSvg, voidArt } from "./art.mjs";
import {
  escapeAttr,
  escapeHtml,
  formatDate,
  pad2,
} from "./utils.mjs";

const arrowFor = (href) =>
  /^https?:\/\//.test(href) ? "↗" : "→";

function socialItems(site) {
  return site.socials
    .map(
      (social) => `<li><a href="${escapeAttr(social.href)}"${
        /^https?:\/\//.test(social.href) ? ' rel="noopener"' : ""
      }>${escapeHtml(social.label)}<span class="link-arrow" aria-hidden="true">${arrowFor(
        social.href,
      )}</span></a></li>`,
    )
    .join("");
}

function navItems(site, pageKey) {
  return site.nav
    .map(
      (item) =>
        `<li><a href="${escapeAttr(item.href)}"${
          item.key === pageKey ? ' aria-current="page"' : ""
        }>${escapeHtml(item.label)}</a></li>`,
    )
    .join("");
}

function masthead(site, pageKey) {
  return `<header class="masthead">
  <div class="shell masthead__inner">
    <a class="brand" href="/" aria-label="${escapeAttr(site.title)} 首页">
      ${logoSvg("brand__logo")}
      <span class="brand__text">
        <span class="brand__name">${escapeHtml(site.title)}</span>
        <span class="brand__sub">${escapeHtml(site.titleEn)}</span>
      </span>
    </a>
    <nav class="nav" aria-label="主导航">
      <ul>${navItems(site, pageKey)}</ul>
    </nav>
    <a class="masthead__rss" href="/feed.xml" aria-label="RSS 订阅">
      <span class="masthead__rss-dot" aria-hidden="true"></span><span>RSS</span>
    </a>
  </div>
</header>`;
}

function footer(site) {
  const year = new Date().getFullYear();
  return `<footer class="footer">
  <div class="shell footer__top">
    <div class="footer__brand">
      <div class="footer__mark" aria-hidden="true">
        <span class="footer__mark-black"></span>
        <span class="footer__mark-red"></span>
      </div>
      <p class="footer__wordmark">${escapeHtml(site.title)}</p>
      <p class="footer__tagline">${escapeHtml(site.tagline)}</p>
      <p class="footer__colophon">${escapeHtml(site.colophon)}</p>
    </div>
    <nav class="footer__col" aria-label="页脚导航">
      <h2>浏览</h2>
      <ul>
        ${site.nav
          .map(
            (item) =>
              `<li><a href="${escapeAttr(item.href)}">${escapeHtml(item.label)}<span class="link-arrow" aria-hidden="true">${arrowFor(item.href)}</span></a></li>`,
          )
          .join("")}
      </ul>
    </nav>
    <div class="footer__col">
      <h2>联系</h2>
      <ul>${socialItems(site)}</ul>
    </div>
  </div>
  <div class="shell footer__bottom">
    <p>© ${year} ${escapeHtml(site.title)} · 保留所有权利</p>
    <p>${escapeHtml(site.footerNote)} <span class="footer__sep" aria-hidden="true">/</span> <a href="#top">回到顶部 ↑</a></p>
  </div>
</footer>`;
}

/**
 * 全站基础布局。
 */
export function layout({
  site,
  pageKey = "",
  title = "",
  description = "",
  canonical = "",
  bodyClass = "",
  body,
  ogType = "website",
  scripts = ["/assets/site.js"],
  extraHead = "",
  jsonLd = null,
  noindex = false,
}) {
  const pageTitle = title
    ? `${title} — ${site.title}`
    : `${site.title} — ${site.tagline}`;
  const desc = description || site.description;
  const jsonLdTag = jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(
        /</g,
        "\\u003c",
      )}</script>`
    : "";
  return `<!doctype html>
<html lang="${escapeAttr(site.lang)}" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeAttr(desc)}">
  ${canonical ? `<link rel="canonical" href="${escapeAttr(canonical)}">` : ""}
  ${noindex ? '<meta name="robots" content="noindex, follow">' : ""}
  <meta name="theme-color" content="#f3f0e9">
  <meta name="color-scheme" content="light">
  <meta property="og:type" content="${escapeAttr(ogType)}">
  <meta property="og:site_name" content="${escapeAttr(site.title)}">
  <meta property="og:title" content="${escapeAttr(pageTitle)}">
  <meta property="og:description" content="${escapeAttr(desc)}">
  ${canonical ? `<meta property="og:url" content="${escapeAttr(canonical)}">` : ""}
  <meta property="og:locale" content="${escapeAttr(site.locale)}">
  <meta name="twitter:card" content="summary">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="alternate" type="application/rss+xml" title="${escapeAttr(site.title)} · RSS" href="/feed.xml">
  <link rel="sitemap" type="application/xml" href="/sitemap.xml">
  <link rel="stylesheet" href="/assets/style.css">
  <script>document.documentElement.classList.remove('no-js');document.documentElement.classList.add('js');</script>
  ${extraHead}
  ${jsonLdTag}
</head>
<body id="top"${bodyClass ? ` class="${escapeAttr(bodyClass)}"` : ""}>
  <a class="skip-link" href="#main">跳到正文</a>
  ${masthead(site, pageKey)}
  <main id="main">
${body}
  </main>
  ${footer(site)}
  ${scripts
    .map((src) => `<script src="${escapeAttr(src)}" defer></script>`)
    .join("\n  ")}
</body>
</html>
`;
}

export function postRow(post, index, { lead = false } = {}) {
  const tags = post.tags
    .slice(0, 3)
    .map((tag) => `<span>#${escapeHtml(tag.name)}</span>`)
    .join("");
  return `<li class="post-item${lead ? " post-item--lead" : ""}" data-reveal style="--delay:${Math.min(
    index * 45,
    280,
  )}ms">
  <a class="post-item__link" href="${escapeAttr(post.url)}">
    <span class="post-item__index" aria-hidden="true">${pad2(index + 1)}</span>
    <div class="post-item__main">
      <p class="post-item__meta"><time datetime="${escapeAttr(post.date)}">${post.dateLabel}</time><span class="post-item__cat">${escapeHtml(post.category)}</span><span>${post.readingTime} 分钟</span></p>
      <h3>${escapeHtml(post.title)}</h3>
      <p class="post-item__summary">${escapeHtml(post.summary)}</p>
      <p class="post-item__tags">${tags}</p>
    </div>
    <span class="post-item__arrow" aria-hidden="true">→</span>
  </a>
</li>`;
}

export function tagChips(tags) {
  return `<ul class="tag-list">${tags
    .map(
      (tag) =>
        `<li><a class="tag-chip" href="${escapeAttr(tag.url)}">${escapeHtml(tag.name)}<span class="tag-chip__count">${tag.count}</span></a></li>`,
    )
    .join("")}</ul>`;
}

function pageHead({ kicker, title, lede, outline = "" }) {
  return `<section class="page-head">
  <div class="shell page-head__inner">
    <p class="kicker"><span class="kicker__sq" aria-hidden="true"></span>${kicker}</p>
    <h1 class="page-head__title">${escapeHtml(title)}</h1>
    ${lede ? `<p class="page-head__lede">${lede}</p>` : ""}
  </div>
  ${outline ? `<span class="page-head__outline" aria-hidden="true">${outline}</span>` : ""}
</section>`;
}

function subscribeBand(site) {
  const copy = site.home.subscribe;
  return `<section class="subscribe" aria-labelledby="subscribe-title">
  <div class="shell subscribe__inner">
    <div class="subscribe__copy">
      <p class="kicker kicker--reverse"><span class="kicker__sq kicker__sq--reverse" aria-hidden="true"></span>${escapeHtml(copy.kicker)}</p>
      <h2 id="subscribe-title">${copy.titleLines.map((line) => escapeHtml(line)).join("<br>")}</h2>
      <p>${escapeHtml(copy.body)}</p>
    </div>
    <div class="subscribe__links">
      <a class="subscribe__link" href="/feed.xml"><span>${escapeHtml(copy.rssLabel)}</span><span aria-hidden="true">→</span></a>
      <a class="subscribe__link" href="mailto:${escapeAttr(site.author.email)}"><span>${escapeHtml(copy.emailLabel)}</span><span aria-hidden="true">→</span></a>
      <a class="subscribe__link" href="${escapeAttr(site.author.github)}" rel="noopener"><span>${escapeHtml(copy.githubLabel)}</span><span aria-hidden="true">↗</span></a>
    </div>
  </div>
</section>`;
}

export function renderHome({ site, posts, totalPosts }) {
  const copy = site.home;
  const hero = copy.hero;
  const latest = posts.slice(0, copy.latest.count);
  const categories = new Set(posts.map((post) => post.category));
  const update = posts[0]?.dateLabel ?? "";
  const year = new Date().getFullYear();
  const fill = (value) =>
    escapeHtml(String(value).replaceAll("{name}", site.author.name).replaceAll("{year}", String(year)));
  const body = `<section class="hero">
  <div class="shell hero__grid">
    <div class="hero__copy">
      <p class="kicker"><span class="kicker__sq" aria-hidden="true"></span>${escapeHtml(hero.kicker)} / EST. ${site.established}</p>
      <h1 class="hero__title">${escapeHtml(hero.title.before)}<br><em>${escapeHtml(hero.title.accent)}</em>${escapeHtml(hero.title.after)}</h1>
      <p class="hero__lede">${fill(hero.lede)}</p>
      <div class="hero__actions">
        <a class="btn btn--solid" href="${escapeAttr(hero.primary.href)}">${escapeHtml(hero.primary.label)}<span class="btn__arrow" aria-hidden="true">→</span></a>
        <a class="btn btn--line" href="${escapeAttr(hero.secondary.href)}">${escapeHtml(hero.secondary.label)}</a>
      </div>
      <p class="hero__facts"><span>${pad2(totalPosts)} 篇文章</span><span class="hero__facts-sep" aria-hidden="true">/</span><span>${pad2(categories.size)} 个栏目</span><span class="hero__facts-sep" aria-hidden="true">/</span><span>更新于 ${update}</span></p>
    </div>
    <figure class="hero__art">
      <div class="hero__art-inner">${heroArt()}</div>
      <figcaption class="art-caption"><span>${escapeHtml(hero.artCaption)}</span><span>${fill(hero.artNote)}</span></figcaption>
    </figure>
  </div>
  <div class="shell hero__foot">
    <span>${escapeHtml(hero.scrollHint)}</span>
    <span class="hero__foot-line" aria-hidden="true"></span>
    <span>${fill(hero.volume)}</span>
  </div>
</section>

<section class="section section--posts" aria-labelledby="latest-title">
  <div class="shell">
    <header class="section__head">
      <div>
        <p class="kicker"><span class="kicker__sq" aria-hidden="true"></span>${escapeHtml(copy.latest.kicker)}</p>
        <h2 class="section__title" id="latest-title">${escapeHtml(copy.latest.title)}</h2>
      </div>
      <a class="section__more" href="/archive/">全部 ${pad2(totalPosts)} 篇 <span aria-hidden="true">→</span></a>
    </header>
    <ol class="post-list">
      ${latest.map((post, index) => postRow(post, index, { lead: index === 0 })).join("\n")}
    </ol>
  </div>
</section>

<section class="section about-teaser" aria-labelledby="about-title">
  <div class="shell about-teaser__grid">
    <div class="about-teaser__art" aria-hidden="true">${aboutArt()}</div>
    <div class="about-teaser__copy">
      <p class="kicker"><span class="kicker__sq" aria-hidden="true"></span>${escapeHtml(copy.about.kicker)}</p>
      <h2 id="about-title">${copy.about.titleLines.map((line) => escapeHtml(line)).join("<br>")}</h2>
      <p>${fill(copy.about.body)}</p>
      <div class="about-teaser__foot">
        <a class="text-link" href="/about/">${escapeHtml(copy.about.linkLabel)} <span aria-hidden="true">→</span></a>
        <span class="about-teaser__note">${escapeHtml(site.tagline)}</span>
      </div>
    </div>
  </div>
</section>

${subscribeBand(site)}`;
  return layout({
    site,
    pageKey: "home",
    title: "",
    description: site.description,
    canonical: new URL("/", site.url).href,
    body,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.title,
      url: site.url,
      description: site.description,
      inLanguage: site.lang,
    },
  });
}

export function renderArchive({ site, posts, years }) {
  const yearBlocks = years
    .map(
      ({ year, posts: yearPosts }) => `<section class="archive-year" aria-labelledby="year-${year}">
  <div class="archive-year__label" id="year-${year}">
    <span class="archive-year__number">${year}</span>
    <span class="archive-year__count">${pad2(yearPosts.length)} 篇</span>
  </div>
  <ol class="archive-list">
    ${yearPosts
      .map(
        (post) => `<li class="archive-item">
      <time datetime="${escapeAttr(post.date)}">${post.dateLabel.slice(5)}</time>
      <a href="${escapeAttr(post.url)}">${escapeHtml(post.title)}</a>
      <span class="archive-item__meta">${escapeHtml(post.category)} · ${post.readingTime} 分钟</span>
    </li>`,
      )
      .join("\n")}
  </ol>
</section>`,
    )
    .join("\n");

  const body = `${pageHead({
    kicker: "文章归档 / ARCHIVE",
    title: "全部文章",
    lede: `按时间倒序排列，共 ${pad2(posts.length)} 篇。慢慢读，不着急。`,
    outline: pad2(posts.length),
  })}
<section class="archive">
  <div class="shell">
    ${yearBlocks}
  </div>
</section>
${subscribeBand(site)}`;

  return layout({
    site,
    pageKey: "archive",
    title: "归档",
    description: `${site.title}的全部文章归档，共 ${posts.length} 篇。`,
    canonical: new URL("/archive/", site.url).href,
    body,
  });
}

export function renderTagsPage({ site, categories, tags }) {
  const categoryRows = categories
    .map(
      (category) => `<li class="category-row">
      <a href="${escapeAttr(category.url)}">
        <span class="category-row__name">${escapeHtml(category.name)}</span>
        <span class="category-row__count">${pad2(category.count)} 篇</span>
        <span class="category-row__arrow" aria-hidden="true">→</span>
      </a>
    </li>`,
    )
    .join("\n");

  const body = `${pageHead({
    kicker: "标签与分类 / INDEX",
    title: "按主题浏览",
    lede: "分类是书架，标签是索引。也可以直接去搜索。",
    outline: pad2(tags.length),
  })}
<section class="taxonomy">
  <div class="shell">
    <div class="taxonomy__block">
      <header class="taxonomy__head">
        <p class="kicker"><span class="kicker__sq" aria-hidden="true"></span>分类 / CATEGORIES</p>
        <h2>四个书架</h2>
      </header>
      <ul class="category-list">${categoryRows}</ul>
    </div>
    <div class="taxonomy__block">
      <header class="taxonomy__head">
        <p class="kicker"><span class="kicker__sq" aria-hidden="true"></span>标签 / TAGS</p>
        <h2>所有标签</h2>
      </header>
      ${tagChips(tags)}
    </div>
  </div>
</section>
${subscribeBand(site)}`;

  return layout({
    site,
    pageKey: "tags",
    title: "标签与分类",
    description: `${site.title}的全部标签与分类索引。`,
    canonical: new URL("/tags/", site.url).href,
    body,
  });
}

export function renderTaxonomyPage({ site, kind, label, slug, posts, siblings }) {
  const isTag = kind === "tag";
  const list = posts
    .map(
      (post, index) => `<li class="tax-post" data-reveal style="--delay:${index * 40}ms">
      <a href="${escapeAttr(post.url)}">
        <span class="tax-post__date">${post.dateLabel}</span>
        <span class="tax-post__title">${escapeHtml(post.title)}</span>
        <span class="tax-post__meta">${post.readingTime} 分钟</span>
        <span class="tax-post__arrow" aria-hidden="true">↗</span>
      </a>
    </li>`,
    )
    .join("\n");

  const siblingLinks = siblings
    .map(
      (item) =>
        `<a class="tag-chip" href="${escapeAttr(item.url)}">${escapeHtml(item.name)}<span class="tag-chip__count">${item.count}</span></a>`,
    )
    .join("");

  const body = `${pageHead({
    kicker: `${isTag ? "标签" : "分类"} / ${isTag ? "TAG" : "CATEGORY"}`,
    title: label,
    lede: `${isTag ? "标签" : "分类"}「${escapeHtml(label)}」下共有 ${posts.length} 篇文章。`,
    outline: pad2(posts.length),
  })}
<section class="taxonomy">
  <div class="shell">
    <ol class="tax-post-list">${list}</ol>
    <div class="taxonomy__back">
      <p class="kicker"><span class="kicker__sq" aria-hidden="true"></span>继续浏览</p>
      <div class="tag-cloud">${siblingLinks}</div>
      <a class="text-link" href="/tags/">查看全部标签与分类 <span aria-hidden="true">→</span></a>
    </div>
  </div>
</section>`;

  return layout({
    site,
    pageKey: "tags",
    title: label,
    description: `${site.title}中关于「${label}」的文章，共 ${posts.length} 篇。`,
    canonical: new URL(
      isTag
        ? `/tags/${encodeURIComponent(slug)}/`
        : `/categories/${encodeURIComponent(slug)}/`,
      site.url,
    ).href,
    body,
  });
}

export function renderAbout({ site, html, headings = [] }) {
  const body = `<section class="page-head page-head--about">
  <div class="shell page-head__inner">
    <p class="kicker"><span class="kicker__sq" aria-hidden="true"></span>关于 / ABOUT</p>
    <h1 class="page-head__title">关于我</h1>
    <p class="page-head__lede">开发者、读者，偶尔做一点排版实验。相信克制是一种能力。</p>
  </div>
  <span class="page-head__outline" aria-hidden="true">05</span>
</section>

<section class="about-page">
  <div class="shell about-page__grid">
    <div class="about-page__main">
      <div class="prose">${html}</div>
      <div class="about-page__contact">
        <p class="kicker"><span class="kicker__sq" aria-hidden="true"></span>写信 / SAY HELLO</p>
        <h2>来打个招呼。</h2>
        <p>如果你也在想类似的问题，欢迎写信，或者在 GitHub 上找到我。</p>
        <ul class="contact-list">
          <li><span>邮箱</span><a href="mailto:${escapeAttr(site.author.email)}">${escapeHtml(site.author.email)}</a></li>
          <li><span>GitHub</span><a href="${escapeAttr(site.author.github)}" rel="noopener">@${escapeHtml(site.author.nickname)}</a></li>
          <li><span>订阅</span><a href="/feed.xml">RSS</a></li>
        </ul>
      </div>
    </div>
    <aside class="about-page__aside">
      <div class="about-card">
        <div class="about-card__art" aria-hidden="true">${aboutArt()}</div>
        <div class="about-card__identity">
          ${logoSvg("about-card__logo")}
          <div>
            <p class="about-card__name">${escapeHtml(site.author.name)}</p>
            <p class="about-card__nick">@${escapeHtml(site.author.nickname)}</p>
          </div>
        </div>
        <dl class="about-card__facts">
          <div><dt>身份</dt><dd>牛马人</dd></div>
          <div><dt>e-mail</dt><dd>zheng25136@hotmail.com</dd></div>
          <div><dt>始于</dt><dd>${site.established}</dd></div>
        </dl>
        <p class="about-card__quote">“把复杂的世界，拆成几个基本形状。 ———— Deepseek”</p>
      </div>
      ${
        headings.length > 2
          ? `<nav class="toc toc--about" aria-label="本页目录">
        <p class="toc__title">本页目录</p>
        <ol>${headings
          .map(
            (heading) =>
              `<li class="toc__item toc__item--${heading.depth}"><a href="#${escapeAttr(heading.id)}">${escapeHtml(heading.label)}</a></li>`,
          )
          .join("")}</ol>
      </nav>`
          : ""
      }
    </aside>
  </div>
</section>
${subscribeBand(site)}`;

  return layout({
    site,
    pageKey: "about",
    title: "关于",
    description: `关于${site.author.name}：开发者、读者，记录代码、设计与生活。`,
    canonical: new URL("/about/", site.url).href,
    body,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Person",
      name: site.author.name,
      alternateName: site.author.nickname,
      url: site.url,
      sameAs: [site.author.github],
    },
  });
}

export function renderSearch({ site }) {
  const body = `${pageHead({
    kicker: "搜索 / SEARCH",
    title: "搜索",
    lede: "在标题、摘要、标签与正文中查找。输入即搜索。",
  })}
<section class="search">
  <div class="shell">
    <form class="search__form" role="search" action="/search/" method="get">
      <label class="visually-hidden" for="search-input">搜索文章</label>
      <input class="search__input" id="search-input" name="q" type="search" placeholder="输入关键词，例如「设计」" autocomplete="off" spellcheck="false">
      <kbd class="search__kbd" aria-hidden="true">/</kbd>
      <button class="search__submit" type="submit">搜索</button>
    </form>
    <p class="search__hint" id="search-hint">按 <kbd>/</kbd> 聚焦，按 <kbd>Esc</kbd> 清空。也可以试试：设计、静态站点、TypeScript、阅读。</p>
    <p class="search__status" id="search-status" role="status" aria-live="polite"></p>
    <div class="search__results" id="search-results"></div>
    <noscript><p class="search__noscript">搜索需要 JavaScript。你仍然可以浏览<a href="/archive/">全部文章</a>。</p></noscript>
  </div>
</section>`;

  return layout({
    site,
    pageKey: "search",
    title: "搜索",
    description: `搜索${site.title}的全部文章。`,
    canonical: new URL("/search/", site.url).href,
    body,
    scripts: ["/assets/site.js", "/assets/search.js"],
  });
}

export function renderPost({ site, post, prev, next }) {
  const toc = post.headings
    .map(
      (heading) =>
        `<li class="toc__item toc__item--${heading.depth}"><a href="#${escapeAttr(heading.id)}">${escapeHtml(heading.label)}</a></li>`,
    )
    .join("");
  const hasToc = post.headings.length >= 3;
  const tocMobile = hasToc
    ? `<details class="toc-mobile">
        <summary>本文目录<span>${post.headings.length} 节</span></summary>
        <ol>${toc}</ol>
      </details>`
    : "";
  const tocAside = hasToc
    ? `<aside class="article__aside">
        <nav class="toc" aria-label="本文目录">
          <p class="toc__title">本文目录</p>
          <ol>${toc}</ol>
        </nav>
        <div class="article__aside-meta">
          <p>写于 ${post.dateLabel}</p>
          <p>${post.readingTime} 分钟阅读</p>
        </div>
      </aside>`
    : "";

  const pager = `<nav class="shell article__pager" aria-label="文章翻页">
  ${
    prev
      ? `<a class="pager__link pager__link--prev" href="${escapeAttr(prev.url)}"><span class="pager__label">← 更新一篇</span><span class="pager__title">${escapeHtml(prev.title)}</span></a>`
      : `<span class="pager__link pager__link--empty"><span class="pager__label">已经是最新一篇</span></span>`
  }
  ${
    next
      ? `<a class="pager__link pager__link--next" href="${escapeAttr(next.url)}"><span class="pager__label">更早一篇 →</span><span class="pager__title">${escapeHtml(next.title)}</span></a>`
      : `<span class="pager__link pager__link--empty pager__link--next"><span class="pager__label">已经是最早一篇</span></span>`
  }
</nav>`;

  const tags = `<ul class="tag-list tag-list--article">${post.tags
    .map(
      (tag) =>
        `<li><a class="tag-chip" href="${escapeAttr(tag.url)}">#${escapeHtml(tag.name)}</a></li>`,
    )
    .join("")}</ul>`;

  const body = `<article class="article">
  <header class="article__head">
    <div class="shell article__head-inner">
      <nav class="crumbs" aria-label="面包屑">
        <a href="/">首页</a><span aria-hidden="true">/</span><a href="${escapeAttr(post.categoryUrl)}">${escapeHtml(post.category)}</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(post.title)}</span>
      </nav>
      <p class="article__meta"><time datetime="${escapeAttr(post.date)}">${post.dateLabel}</time><span>${post.readingTime} 分钟阅读</span><span>${escapeHtml(post.category)}</span></p>
      <h1 class="article__title">${escapeHtml(post.title)}</h1>
      <p class="article__dek">${escapeHtml(post.summary)}</p>
      ${tags}
    </div>
  </header>
  <div class="shell article__layout">
    <div class="article__body">
      ${tocMobile}
      <div class="prose">${post.html}</div>
      <div class="article__discuss">
        <p>有想法或勘误？<a href="${escapeAttr(site.author.githubRepo)}/issues" rel="noopener">在 GitHub 上开一个 Issue <span aria-hidden="true">↗</span></a></p>
      </div>
    </div>
    ${tocAside}
  </div>
  ${pager}
</article>`;

  return layout({
    site,
    pageKey: "",
    title: post.title,
    description: post.summary,
    canonical: new URL(post.url, site.url).href,
    body,
    bodyClass: "page-post",
    ogType: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.summary,
      datePublished: post.date,
      dateModified: post.date,
      inLanguage: site.lang,
      author: { "@type": "Person", name: site.author.name, url: site.url },
      mainEntityOfPage: new URL(post.url, site.url).href,
      keywords: post.tags.map((tag) => tag.name).join(", "),
    },
  });
}

export function render404({ site }) {
  const body = `<section class="not-found">
  <div class="shell not-found__grid">
    <div class="not-found__copy">
      <p class="kicker"><span class="kicker__sq" aria-hidden="true"></span>错误 / 404</p>
      <h1>这一页<br>不存在。</h1>
      <p>它可能被移动、删除，或者从未存在过。就像白底上一块没有画完的方块。</p>
      <div class="hero__actions">
        <a class="btn btn--solid" href="/">回到首页<span class="btn__arrow" aria-hidden="true">→</span></a>
        <a class="btn btn--line" href="/archive/">浏览归档</a>
      </div>
    </div>
    <div class="not-found__art" aria-hidden="true">${voidArt()}</div>
  </div>
</section>`;

  return layout({
    site,
    pageKey: "",
    title: "页面不存在",
    description: "404 — 页面不存在。",
    body,
    bodyClass: "page-404",
    noindex: true,
  });
}
