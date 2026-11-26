import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

import { site } from "../site.config.mjs";
import { renderMarkdown } from "./lib/markdown.mjs";
import {
  postRow,
  render404,
  renderAbout,
  renderArchive,
  renderHome,
  renderPost,
  renderSearch,
  renderTagsPage,
  renderTaxonomyPage,
} from "./lib/templates.mjs";
import {
  categoryUrl,
  escapeHtml,
  firstParagraph,
  formatDate,
  pad2,
  readingTime,
  stripMarkup,
  tagUrl,
  taxSlug,
  xmlEscape,
} from "./lib/utils.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const srcDir = path.join(root, "src");
const distDir = path.join(root, "dist");
const postsDir = path.join(srcDir, "posts");

const warnings = [];
const errors = [];

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function write(relative, contents) {
  const target = path.join(distDir, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, contents, "utf8");
}

async function copyDir(from, to) {
  if (!(await exists(from))) return;
  await fs.mkdir(to, { recursive: true });
  for (const entry of await fs.readdir(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) {
      await copyDir(source, target);
    } else if (entry.isFile()) {
      await fs.copyFile(source, target);
    }
  }
}

function normalizeDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value ?? "").trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const iso = `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso) {
    return null;
  }
  return iso;
}

function normalizeTags(value) {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : String(value).split(/[,，]/);
  const seen = new Set();
  const tags = [];
  for (const item of list) {
    const name = String(item).trim().replace(/^#/, "");
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(name);
  }
  return tags;
}

function groupBySlug(entries, { kind }) {
  const groups = new Map();
  for (const entry of entries) {
    const slug = taxSlug(entry.name);
    if (!slug) {
      warnings.push(`${kind}「${entry.name}」规范化后为空，已跳过`);
      continue;
    }
    const group = groups.get(slug) ?? {
      slug,
      name: entry.name,
      kind,
      posts: [],
    };
    group.posts.push(entry.post);
    groups.set(slug, group);
  }
  return [...groups.values()];
}

function searchBody(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, (block) => ` ${block.replace(/```[^\n]*/g, " ")} `)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadPosts() {
  const files = (await fs.readdir(postsDir))
    .filter((file) => file.endsWith(".md"))
    .sort();
  const posts = [];
  const slugs = new Set();

  for (const file of files) {
    const source = await fs.readFile(path.join(postsDir, file), "utf8");
    const { data, content } = matter(source);
    if (data.draft === true) {
      warnings.push(`${file} 标记为 draft，已跳过`);
      continue;
    }

    const fallbackSlug = file
      .replace(/^\d{4}-\d{2}-\d{2}-/, "")
      .replace(/\.md$/, "");
    const slug = String(data.slug || fallbackSlug).trim();
    if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
      errors.push(`${file}: slug「${slug}」只能包含字母、数字和连字符`);
      continue;
    }
    if (slugs.has(slug)) {
      errors.push(`${file}: slug「${slug}」与另一篇文章重复`);
      continue;
    }
    slugs.add(slug);

    const title = String(data.title ?? "").trim();
    if (!title) errors.push(`${file}: 缺少 title`);

    const date = normalizeDate(data.date ?? file.slice(0, 10));
    if (!date) errors.push(`${file}: date 无效（建议写成带引号的 YYYY-MM-DD）`);

    const category = String(data.category ?? "未分类").trim() || "未分类";
    const tagNames = normalizeTags(data.tags);
    const summary = String(data.summary ?? firstParagraph(content)).trim();
    const rendered = renderMarkdown(content, { collectHeadings: true });

    if (!summary) warnings.push(`${file}: 没有摘要`);
    if (summary.length > 120) {
      warnings.push(`${file}: 摘要 ${summary.length} 字，首页可能显得拥挤`);
    }

    posts.push({
      slug,
      url: `/posts/${slug}/`,
      file,
      title,
      date,
      dateLabel: formatDate(date),
      year: date.slice(0, 4),
      category,
      categorySlug: taxSlug(category),
      categoryUrl: categoryUrl(category),
      tagNames,
      tags: [],
      summary,
      html: rendered.html,
      headings: rendered.headings,
      readingTime: readingTime(content),
      content,
    });
  }

  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)));
  return posts;
}

function buildTaxonomies(posts) {
  const categories = groupBySlug(
    posts.map((post) => ({ name: post.category, post })),
    { kind: "category" },
  );
  const tags = groupBySlug(
    posts.flatMap((post) => post.tagNames.map((name) => ({ name, post }))),
    { kind: "tag" },
  );

  for (const category of categories) {
    category.url = categoryUrl(category.name);
    category.posts.sort((a, b) => (a.date < b.date ? 1 : -1));
    category.count = category.posts.length;
  }
  for (const tag of tags) {
    tag.url = tagUrl(tag.name);
    tag.posts.sort((a, b) => (a.date < b.date ? 1 : -1));
    tag.count = tag.posts.length;
  }

  categories.sort((a, b) => b.posts.length - a.posts.length || a.name.localeCompare(b.name, "zh-CN"));
  tags.sort((a, b) => b.posts.length - a.posts.length || a.name.localeCompare(b.name, "zh-CN"));

  const tagBySlug = new Map(tags.map((tag) => [tag.slug, tag]));
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));

  for (const post of posts) {
    post.tags = post.tagNames.map((name) => {
      const tag = tagBySlug.get(taxSlug(name));
      return {
        name: tag?.name ?? name,
        slug: taxSlug(name),
        url: tagUrl(name),
        count: tag?.posts.length ?? 1,
      };
    });
    const category = categoryBySlug.get(post.categorySlug);
    if (category) {
      post.category = category.name;
      post.categoryUrl = category.url;
    }
  }

  const years = [];
  for (const post of posts) {
    let bucket = years.find((entry) => entry.year === post.year);
    if (!bucket) {
      bucket = { year: post.year, posts: [] };
      years.push(bucket);
    }
    bucket.posts.push(post);
  }
  years.sort((a, b) => Number(b.year) - Number(a.year));

  return { categories, tags, years };
}

function buildFeed(posts) {
  const newest = posts[0]?.date ?? new Date().toISOString().slice(0, 10);
  const items = posts
    .slice(0, 20)
    .map(
      (post) => `    <item>
      <title>${xmlEscape(post.title)}</title>
      <link>${xmlEscape(new URL(post.url, site.url).href)}</link>
      <guid isPermaLink="true">${xmlEscape(new URL(post.url, site.url).href)}</guid>
      <pubDate>${new Date(`${post.date}T09:00:00+08:00`).toUTCString()}</pubDate>
      <description>${xmlEscape(post.summary)}</description>
      <category>${xmlEscape(post.category)}</category>
${post.tags
  .filter((tag) => tag.name !== post.category)
  .map((tag) => `      <category>${xmlEscape(tag.name)}</category>`)
  .join("\n")}
    </item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(site.title)}</title>
    <link>${xmlEscape(site.url)}/</link>
    <description>${xmlEscape(site.description)}</description>
    <language>${site.lang}</language>
    <lastBuildDate>${new Date(`${newest}T09:00:00+08:00`).toUTCString()}</lastBuildDate>
    <atom:link href="${xmlEscape(site.url)}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

function buildSitemap(posts, categories, tags) {
  const entries = [
    { loc: "/", priority: "1.0", lastmod: posts[0]?.date },
    { loc: "/archive/", priority: "0.8", lastmod: posts[0]?.date },
    { loc: "/tags/", priority: "0.7", lastmod: posts[0]?.date },
    { loc: "/about/", priority: "0.6", lastmod: posts[0]?.date },
    { loc: "/search/", priority: "0.3", lastmod: posts[0]?.date },
    ...posts.map((post) => ({ loc: post.url, priority: "0.9", lastmod: post.date })),
    ...categories.map((category) => ({ loc: category.url, priority: "0.5", lastmod: category.posts[0]?.date })),
    ...tags.map((tag) => ({ loc: tag.url, priority: "0.4", lastmod: tag.posts[0]?.date })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${xmlEscape(new URL(entry.loc, site.url).href)}</loc>${
      entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ""
    }
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
}

async function main() {
  const started = performance.now();
  if (!(await exists(postsDir))) {
    throw new Error(`找不到文章目录：${postsDir}`);
  }

  const posts = await loadPosts();
  if (errors.length) {
    console.error("构建失败：\n" + errors.map((error) => `  ✗ ${error}`).join("\n"));
    process.exitCode = 1;
    return;
  }
  if (!posts.length) {
    console.error("构建失败：src/posts 下没有可用的文章。");
    process.exitCode = 1;
    return;
  }

  const { categories, tags, years } = buildTaxonomies(posts);

  const aboutSource = await fs.readFile(path.join(srcDir, "pages", "about.md"), "utf8");
  const about = matter(aboutSource);
  const aboutRendered = renderMarkdown(about.content, { collectHeadings: true });

  await fs.rm(distDir, { recursive: true, force: true });
  await fs.mkdir(distDir, { recursive: true });

  await write("index.html", renderHome({ site, posts, totalPosts: posts.length }));
  await write("archive/index.html", renderArchive({ site, posts, years }));
  await write("tags/index.html", renderTagsPage({ site, categories, tags }));
  await write(
    "about/index.html",
    renderAbout({ site, html: aboutRendered.html, headings: aboutRendered.headings }),
  );
  await write("search/index.html", renderSearch({ site }));
  await write("404.html", render404({ site }));

  posts.forEach((post, index) => {
    const newer = posts[index - 1] ?? null;
    const older = posts[index + 1] ?? null;
    return write(
      `posts/${post.slug}/index.html`,
      renderPost({ site, post, prev: newer, next: older }),
    );
  });

  for (const tag of tags) {
    await write(
      `tags/${tag.slug}/index.html`,
      renderTaxonomyPage({
        site,
        kind: "tag",
        label: tag.name,
        slug: tag.slug,
        posts: tag.posts,
        siblings: tags,
      }),
    );
  }
  for (const category of categories) {
    await write(
      `categories/${category.slug}/index.html`,
      renderTaxonomyPage({
        site,
        kind: "category",
        label: category.name,
        slug: category.slug,
        posts: category.posts,
        siblings: categories,
      }),
    );
  }

  await write("feed.xml", buildFeed(posts));
  await write("sitemap.xml", buildSitemap(posts, categories, tags));
  await write(
    "robots.txt",
    `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`,
  );
  await write(
    "search.json",
    JSON.stringify(
      posts.map((post) => ({
        t: post.title,
        u: post.url,
        d: post.dateLabel,
        c: post.category,
        g: post.tags.map((tag) => tag.name),
        x: post.summary,
        rt: post.readingTime,
        b: searchBody(post.content).slice(0, 12000),
      })),
    ),
  );
  await write(".nojekyll", "");

  await copyDir(path.join(srcDir, "assets"), path.join(distDir, "assets"));
  await copyDir(path.join(srcDir, "static"), distDir);

  const elapsed = Math.round(performance.now() - started);
  console.log(`\n  ${site.title} · 构建完成 (${elapsed}ms)`);
  console.log(
    `  ${posts.length} 篇文章 · ${categories.length} 个分类 · ${tags.length} 个标签 · ${years.length} 个年份`,
  );
  console.log(`  输出目录：dist/\n`);
  for (const warning of warnings) console.warn(`  ! ${warning}`);
  for (const category of categories) {
    console.log(`  · ${category.name} (${category.posts.length})`);
  }
  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
