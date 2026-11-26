# 内容修改指南

这份指南对应“我想改点什么”的日常操作。改完运行 `npm run dev` 或 `npm run build` 就能看到结果。

## 1. 站点名称、简介、邮箱、社交链接

编辑根目录的 [site.config.mjs](site.config.mjs)。

```js
export const site = {
  title: "郑泽阳",                 // 浏览器标题、页头、页脚
  titleEn: "ZHENG ZEYANG",        // 页头小字
  tagline: "代码、设计与日常笔记。", // 一句话介绍
  description: "……",              // SEO 与 RSS 描述
  url: "https://zhengzyyy.github.io",
  established: 2026,
  author: {
    name: "郑泽阳",
    email: "zheng25136@hotmail.com",
    github: "https://github.com/Zhengzyyy",
  },
  // ……
};
```

同时要改的地方：

- 页头的 Logo 图形在 `scripts/lib/art.mjs` 的 `logoSvg()`。
- 浏览器图标在 `src/assets/favicon.svg`。
- 如果仓库地址或域名变了，`url` 必须一起改，否则 RSS、sitemap 和分享链接会错。

## 2. 首页的文案

同样在 [site.config.mjs](site.config.mjs) 的 `home` 里。

```js
home: {
  hero: {
    kicker: "个人博客",
    title: {
      before: "在秩序与",
      accent: "偶然",
      after: "之间",
    },
    lede: "我是{name}，一名开发者。……",
    primary: { label: "阅读文章", href: "/archive/" },
    secondary: { label: "关于我", href: "/about/" },
  },
  latest: {
    title: "最新文章",
    count: 7,          // 首页显示几篇，建议 5–10
  },
  // ……
}
```

说明：

- `title.before / accent / after` 会拼成两行，`accent` 是红色的衬线强调词。不想要强调词时，把 `accent` 留空即可。
- 文案中的 `{name}` 会自动替换成 `author.name`，`{year}` 会自动替换成当前年份。
- 按钮文字和链接都可以改，但链接建议保持站内路径，例如 `/archive/`。
- 关于入口、订阅区的标题和正文也在 `home` 下。

## 3. 写一篇新文章

在 `src/posts/` 里新建一个 `.md` 文件，文件名随意，例如 `2026-12-01-my-note.md`。

```md
---
title: "文章标题"
date: "2026-12-01"
category: "工程"
tags: ["静态站点", "Node.js"]
slug: "my-note"
summary: "一两句话说清这篇文章在讲什么。"
---

正文从这里开始。

## 一个小标题

普通 Markdown 都可以用：**加粗**、列表、引用、表格、代码块。
```

字段说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 文章标题 |
| `date` | 是 | **必须加引号**，格式 `YYYY-MM-DD` |
| `category` | 是 | 只能写一个分类，例如“工程” |
| `tags` | 否 | 字符串数组，可写多个 |
| `slug` | 是 | 文章地址 `/posts/<slug>/`，发布后不要改 |
| `summary` | 是 | 首页摘要、SEO 描述、RSS 描述 |

注意事项：

- 日期不加引号时，YAML 可能把它解析成日期对象，导致时区偏移。
- 分类和标签会自动出现在标签页，不需要手动维护索引。
- 正文从 `##` 开始；`#` 一级标题由页面模板生成，不要重复写。
- 要放图片，把文件放进 `src/assets/img/`，正文写：
  `![图片说明](/assets/img/your-image.jpg "可选：显示在图下的说明")`
- 想删除示例文章，直接删除 `src/posts/` 下对应的 `.md` 文件，再重新构建。

## 4. 修改“关于”页

编辑 [src/pages/about.md](src/pages/about.md)。

这是纯 Markdown，支持标题、列表、链接。页面右侧的身份卡片和底部联系区来自模板与 `site.config.mjs`，不需要在 Markdown 里重复写。

如果改了邮箱，记得同时改：

- `site.config.mjs` 的 `author.email`
- `site.config.mjs` 的 `socials` 里的邮箱链接
- `src/pages/about.md` 正文里出现的邮箱

## 5. 导航栏

导航在 `site.config.mjs` 的 `nav` 数组里：

```js
nav: [
  { label: "首页", href: "/", key: "home" },
  { label: "归档", href: "/archive/", key: "archive" },
  { label: "标签", href: "/tags/", key: "tags" },
  { label: "关于", href: "/about/", key: "about" },
  { label: "搜索", href: "/search/", key: "search" },
],
```

`key` 用来高亮当前页，新增项目时要保证 `key` 与页面模板里的 `pageKey` 对应。一般不建议超过 5 项。

## 6. 配色、字体、内容宽度

编辑 [src/assets/style.css](src/assets/style.css) 顶部的变量：

```css
:root {
  --paper: #f3f0e9;       /* 背景 */
  --paper-deep: #e9e4d9;  /* 浅色块 */
  --ink: #151515;         /* 正文 */
  --muted: #6f6a60;       /* 次要信息 */
  --red: #c8332b;         /* 强调色 */
  --red-deep: #a52821;    /* 深强调色 */
  --sans: "PingFang SC", …;
  --serif: "Songti SC", …;
  --shell: 1120px;        /* 页面最大宽度 */
  --measure: 36em;        /* 正文阅读宽度 */
}
```

改颜色时注意对比度：正文和次要文字在纸白背景上至少保持 4.5:1。红色目前是 `#c8332b`，在纸白上约为 4.65:1，已经接近下限，不建议再调浅。

## 7. 插画与几何图形

- 页头 Logo：`scripts/lib/art.mjs` 的 `logoSvg()`
- 首页大图：`heroArt()`
- 关于页插图：`aboutArt()`
- 404 插图：`voidArt()`
- 文章里的示例插图：`src/assets/img/grid-study.svg`

这些图形都是用 SVG 矩形、圆和细线画的原创构图，可以直接改坐标、大小和颜色。改完后重新构建即可。

## 8. 修改页面标题和说明

归档页、标签页、搜索页的标题和说明写在 [scripts/lib/templates.mjs](scripts/lib/templates.mjs) 的 `renderArchive`、`renderTagsPage`、`renderSearch` 里。它们不属于“日常内容”，一般只有在想换页面文案时才需要动。

## 9. 常见问题

**改完没变化？**

如果用的是 `npm run dev`，它会监听文件并自动构建；如果用的是 `npm run serve`，它只服务已有的 `dist/`，需要手动执行：

```bash
npm run build
```

**构建报错？**

先检查：

- `date` 是否加了引号；
- `tags` 是否是数组；
- `slug` 是否只包含字母、数字和连字符；
- 是否误删了必填字段。

**PowerShell 里看到中文乱码？**

通常只是终端显示问题，文件本身是 UTF-8。以浏览器里的效果为准。

## 10. 发布

确认内容和排版后：

```bash
git add .
git commit -m "Redesign blog"
git push
```

然后在 GitHub 仓库的 **Settings → Pages → Source** 选择 **GitHub Actions**。之后每次 push 到 `main`，[.github/workflows/pages.yml](.github/workflows/pages.yml) 会自动构建并发布。
