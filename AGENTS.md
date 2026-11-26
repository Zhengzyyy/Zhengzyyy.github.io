# 博客维护流程（给协作 Agent 使用）

本文件是这个仓库的操作说明。其他 Agent 在修改博客前应先读本文件；面向人的内容说明在 [CONTENT.md](CONTENT.md)，环境与部署概览在 [README.md](README.md)。如果上下文有限，可以直接使用精简版 [AGENT-PROMPT.md](AGENT-PROMPT.md)。

仓库：`https://github.com/Zhengzyyy/Zhengzyyy.github.io`
线上地址：`https://zhengzyyy.github.io/`
默认分支：`main`
技术栈：Node.js 静态站点生成器，输出纯静态 `dist/`，GitHub Pages 托管。

## 0. 快速判断

| 任务 | 去哪里 |
| --- | --- |
| 新增、修改、删除文章 | `src/posts/*.md` |
| 改站名、首页文案、导航、社交链接 | `site.config.mjs` |
| 改关于页正文 | `src/pages/about.md` |
| 改配色、字体、间距、响应式 | `src/assets/style.css` |
| 改 Logo、首页插图、404 插图 | `scripts/lib/art.mjs` |
| 改页面模板或构建逻辑 | `scripts/lib/templates.mjs`、`scripts/build.mjs` |
| 改部署流程 | `.github/workflows/pages.yml` |

## 1. 硬性约束

1. **这是纯静态站点。** 不要引入 Jekyll、Ruby、React/Vue/Next、数据库或后端服务。Node 只在构建时运行。
2. **不要手改 `dist/`。** 它由 `npm run build` 生成，已被 `.gitignore` 忽略。所有修改都应发生在 `src/`、`scripts/`、`site.config.mjs` 或配置文件里。
3. **不要提交** `node_modules/`、`dist/`、`.npm-cache/`、`.edge-profile/`、`.tmp-*`。
4. **没有明确要求时，不要 push、不要部署。** 本地修改、构建、提交可以；推送和发布需要用户明确同意。
5. **不要复制既有画作。** 页面里的几何图形是原创 SVG 构图，可以调整，但不要复刻马列维奇或其他艺术家的具体作品。
6. **不要随意改文章 URL。** `slug` 决定 `/posts/<slug>/`；已发布文章的 slug 变更会造成死链，本项目没有重定向机制。
7. **保持现有设计语言。** 纸白、近黑、一点红；系统无衬线正文 + 衬线强调；矩形控件、细线、留白；不要加入大图、轮播、自动播放、复杂动画或 UI 框架。
8. **保持可访问性。** 图片必须有 `alt`；键盘焦点可见；正文对比度至少 4.5:1；移动端 390px 宽度不能横向溢出。
9. **文件编码 UTF-8。** 不要写 BOM。中文在 PowerShell 里可能显示乱码，那是终端显示问题，以浏览器和 `read` 工具为准。

## 2. 环境与命令

需要 Node.js 20+。

```bash
npm ci            # 按 package-lock.json 安装（CI/干净环境优先）
npm install       # 本地开发或依赖变化时使用
npm run build     # 生成 dist/
npm run dev       # 构建 + 监听 + 本地预览 http://127.0.0.1:4173
npm run serve     # 只预览已有 dist/，不监听
npm run clean     # 删除 dist/
```

`npm run dev` 会监听 `src/`、`scripts/`、`site.config.mjs` 并自动重建，但不会热更新浏览器，改完手动刷新。

构建成功的输出类似：

```text
郑泽阳 · 构建完成
8 篇文章 · 4 个分类 · 19 个标签 · 1 个年份
输出目录：dist/
```

文章数量变化后，这些数字应同步变化；有 `error` 时退出码非 0，必须先修复。

## 3. 目录地图

```text
site.config.mjs          站点身份、导航、社交、首页文案
src/posts/               文章 Markdown；文件名建议 YYYY-MM-DD-slug.md
src/pages/about.md       关于页正文
src/assets/style.css     设计变量与全部样式
src/assets/site.js       复制代码、目录高亮
src/assets/search.js     客户端搜索
src/assets/favicon.svg   浏览器图标
src/assets/img/          文章插图；构建时复制到 /assets/img/
scripts/build.mjs        读取文章、生成页面、RSS、sitemap、搜索索引
scripts/serve.mjs        本地预览服务器
scripts/lib/templates.mjs 页面模板与页面文案
scripts/lib/markdown.mjs Markdown 渲染、代码高亮、标题锚点
scripts/lib/art.mjs      原创几何 SVG
scripts/lib/utils.mjs    日期、阅读时长、转义、URL 工具
.github/workflows/pages.yml  GitHub Actions 部署
```

## 4. 新增文章

在 `src/posts/` 新建 Markdown 文件，建议命名 `YYYY-MM-DD-english-slug.md`。

```md
---
title: "文章标题"
date: "2026-12-01"
category: "工程"
tags: ["静态站点", "Node.js"]
slug: "my-note"
summary: "一两句话说清这篇文章在讲什么，建议不超过 120 字。"
draft: false
---

正文从二级标题开始。

## 一个小标题

普通 Markdown 都可以用：**加粗**、列表、引用、表格、代码块。
```

字段规则：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 缺少会构建失败 |
| `date` | 建议必填 | 必须是带引号的 `YYYY-MM-DD`；不写会尝试用文件名前 10 位 |
| `category` | 否 | 一个字符串；省略为“未分类” |
| `tags` | 否 | 数组，或逗号分隔字符串；会自动去重 |
| `slug` | 否 | 只允许字母、数字、连字符；省略时从文件名去掉日期前缀得到 |
| `summary` | 建议 | 首页摘要、SEO、RSS 描述；省略时取正文首段；超过 120 字会警告 |
| `draft` | 否 | `true` 时跳过该文章，不生成页面 |

关键注意：

- 日期**一定加引号**。不加引号时 YAML 可能解析成日期对象，跨时区时可能偏移一天。
- 如果文件名是中文且没有显式 `slug`，回退出的 slug 含中文，会构建失败。要么给英文文件名，要么写 `slug`。
- 正文不要写 `#` 一级标题，页面标题由模板生成；从 `##` 开始。
- 图片放在 `src/assets/img/`，正文写：
  `![图片说明](/assets/img/your-image.jpg "可选的图下说明")`
  构建会自动加 `loading="lazy"` 和 `decoding="async"`；有 `title` 时渲染成 `<figcaption>`。
- 支持 GFM 表格、任务列表、围栏代码块、行内代码。代码高亮已注册：bash/shell、css、javascript/js、json、markdown/md、typescript/ts、html/xml、yaml/yml。
- 标题会自动生成锚点，文章页会生成目录；不需要手写目录。
- 文章支持原始 HTML，但不要粘贴不可信 HTML。

新增后必须检查：

1. `npm run build` 通过；
2. `dist/posts/<slug>/index.html` 存在；
3. 首页最新文章、归档、对应分类/标签页都出现该文章；
4. `/search.json` 中包含该文章；
5. 文章页 TOC、代码块、图片、上下篇正常。

## 5. 修改和删除文章

- 修改正文、标题、摘要、标签：直接改 Markdown，重新构建。
- **不要改已发布文章的 `slug`。** 如果必须改，要明确告知用户旧链接会 404；本项目没有重定向表。
- 修改 `date` 会改变文章排序和归档年份，谨慎。
- 删除文章：删除对应 `.md` 文件并重新构建。归档、分类、标签、RSS、sitemap、搜索索引会自动更新；旧 URL 会 404。
- 临时下线某篇：把 frontmatter 改成 `draft: true`，构建会跳过它。注意这同样会让旧 URL 404，不是“保留页面但隐藏”。
- 修改标签名等于新建一个标签页；旧标签页会消失，旧链接可能 404。

## 6. 站点信息与首页文案

编辑 `site.config.mjs`：

```js
export const site = {
  title: "郑泽阳",              // 页头、页脚、浏览器标题
  titleEn: "ZHENG ZEYANG",     // 页头英文小字
  tagline: "代码、设计与日常笔记。",
  description: "……",           // SEO、RSS
  url: "https://zhengzyyy.github.io",
  established: 2026,
  author: {
    name: "郑泽阳",
    email: "zheng25136@hotmail.com",
    github: "https://github.com/Zhengzyyy",
  },
  nav: [ ... ],
  socials: [ ... ],
  home: {
    hero: { ... },
    latest: { count: 7 },
    about: { ... },
    subscribe: { ... },
  },
};
```

- 首页标题是三段式：`hero.title.before` + 红色衬线 `hero.title.accent` + `hero.title.after`，在 `before` 后换行。`accent` 可以为空字符串。
- `hero.lede` 和 `home.about.body` 支持 `{name}`，会替换为 `author.name`；`hero.artNote` 与 `hero.volume` 支持 `{year}`，会替换为当前年份。
- `home.latest.count` 控制首页文章数，建议保持 5–10。
- 改 `title` 会影响页头、页脚、RSS 标题；改 `description` 会影响 SEO 与 RSS 描述。
- 改 `url` 必须与真实部署地址一致，否则 sitemap、RSS、canonical 会错。当前是用户主页仓库，地址为根路径 `https://zhengzyyy.github.io/`。
- `socials` 只使用 `label` 和 `href`；`icon` 字段目前不参与渲染。
- 邮箱出现在三处，改的时候一起改：`author.email`、`socials` 里的 `mailto:`、`src/pages/about.md`。
- `nav` 的 `key` 必须与页面模板的 `pageKey` 对应（`home`、`archive`、`tags`、`about`、`search`），否则不会高亮。

## 7. 关于页

编辑 `src/pages/about.md`：

- 正文是普通 Markdown，建议使用 `##` 分节。
- 右侧身份卡片、底部联系区由 `scripts/lib/templates.mjs` 的 `renderAbout` 生成，数据来自 `site.config.mjs`，不需要在 Markdown 里重复写。
- 关于页插图在 `scripts/lib/art.mjs` 的 `aboutArt()`。
- 改邮箱时同步改 `site.config.mjs`，避免页面正文和页脚不一致。

## 8. 视觉修改

### 配色、字体、宽度

`src/assets/style.css` 顶部：

```css
:root {
  --paper: #f3f0e9;
  --paper-deep: #e9e4d9;
  --paper-code: #ede9df;
  --ink: #151515;
  --ink-soft: #34322d;
  --muted: #6f6a60;
  --red: #c8332b;
  --red-deep: #a52821;
  --sans: ...;
  --serif: ...;
  --mono: ...;
  --shell: 1120px;
  --measure: 36em;
}
```

- 红色 `#c8332b` 在纸白上约 4.65:1，已经接近正文下限，不要再调浅。
- 次要文字 `--muted` 约 4.72:1；如果换背景色，必须重新检查对比度。
- 正文宽度由 `--measure: 36em` 控制；页面最大宽度由 `--shell` 控制。
- 字体只用系统字体，不加载外部字体，避免额外请求。
- 改完至少检查 1440px 和 390px 两个宽度。

### 插图

`scripts/lib/art.mjs` 导出：

- `logoSvg(className)`：页头/页脚 Logo
- `heroArt()`：首页大图
- `aboutArt()`：首页关于区 + 关于页插图
- `voidArt()`：404 插图

图形由矩形、圆、细线组成，颜色使用 `var(--red)`、`var(--paper)` 和 `currentColor`。可以改坐标、大小、旋转角度，但保持原创。

浏览器图标：`src/assets/favicon.svg`。

## 9. 修改页面模板与文案

- 归档页标题/说明：`renderArchive` in `scripts/lib/templates.mjs`
- 标签页标题/说明：`renderTagsPage`
- 搜索页标题/说明：`renderSearch`
- 关于页结构：`renderAbout`
- 文章页结构：`renderPost`
- 首页结构：`renderHome`
- 页脚：`layout` / `footer`

改模板时：

- 所有动态文本用 `escapeHtml`，属性用 `escapeAttr`。
- 保持现有类名，否则 CSS 会失效。
- 不要删除 `main#main`、skip link、`aria-label`、`aria-current` 等可访问性结构。
- 不要引入内联脚本或外部 CDN，除非用户明确要求。

## 10. 验证清单

每次内容或代码修改后，至少执行：

```bash
npm run build
git diff --check
git status --short
```

然后确认：

- [ ] 构建退出码为 0；没有新增 error。
- [ ] `dist/` 没有被 `git status` 跟踪。
- [ ] 首页显示 `home.latest.count` 篇文章，不是全部文章。
- [ ] `/archive/` 的文章总数、年份、分类/标签计数正确。
- [ ] `/tags/` 的分类和标签计数正确，没有 `undefined`。
- [ ] 新文章的 `/posts/<slug>/` 可访问，TOC 和代码块正常。
- [ ] `/search/` 能搜到新文章；`/search.json` 是合法 JSON。
- [ ] `/feed.xml`、`/sitemap.xml` 是合法 XML。
- [ ] `/404.html` 正常。
- [ ] 移动端 390px 没有横向滚动（`scrollWidth == innerWidth`）。
- [ ] 图片有 `alt`，键盘可以 Tab 到所有交互元素。
- [ ] 如果改了颜色，对比度仍然达标。

本地预览：

```bash
npm run dev
# 打开 http://127.0.0.1:4173
```

如用 `npm run serve`，它不会监听文件；改完必须先 `npm run build`。

## 11. 提交、推送与部署

### 只做本地修改时

```bash
git add -A
git commit -m "content: add post about ..."
```

提交信息建议：

- `content: ...` 新增/修改文章
- `design: ...` 视觉调整
- `fix: ...` 修复
- `chore: ...` 配置/依赖

### 用户明确要求发布时

1. 先确认工作区干净、构建通过。
2. 推送：

```bash
git push origin main
```

3. GitHub Actions 会自动运行 `.github/workflows/pages.yml`：
   - `build`：Node 20 → `npm ci` → `npm run build` → 上传 `dist`
   - `deploy`：发布到 GitHub Pages
4. 打开仓库 **Actions** 确认两个 job 都成功。
5. 访问 `https://zhengzyyy.github.io/`，强制刷新验证。

第一次部署必须在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**，不能选 **Deploy from a branch**。

不要：

- `git push --force`；
- 提交 `dist/`；
- 在 Actions 里手动改构建产物；
- 在未确认的情况下改 Pages 的自定义域名/DNS。

### 自定义域名

1. 在仓库根目录添加 `CNAME` 文件，内容为域名。
2. 在 DNS 配置指向 GitHub Pages。
3. 修改 `site.config.mjs` 的 `url`。
4. 在 Settings → Pages 开启 HTTPS。

## 12. 故障排查

| 现象 | 处理 |
| --- | --- |
| `npm ci` 报 lockfile 不同步 | 本地 `npm install`，提交更新后的 `package-lock.json` |
| 构建报 `date 无效` | 把 `date` 改成带引号的 `YYYY-MM-DD` |
| 构建报 `slug 只能包含字母、数字和连字符` | 给英文 `slug`，或把文件名改成英文 |
| 构建报 slug 重复 | 两篇文章用了同一个 slug，改其中一个 |
| 标签页出现 `undefined` | 检查模板是否读取了不存在的计数字段；分组后应设置 `count = posts.length` |
| 新文章不出现 | 检查是否 `draft: true`、文件名是否以 `.md` 结尾、构建输出里是否有对应 slug |
| 图片裂开 | 文件必须在 `src/assets/img/`，路径写 `/assets/img/文件名` |
| 搜索不到新文章 | 重新构建，确认 `/search.json` 存在；浏览器强制刷新 |
| 线上还是旧页面 | 等 Actions 完成；`Ctrl+F5`；确认 Pages Source 是 GitHub Actions |
| 线上 404 | 检查 Actions 是否成功、Pages Source、仓库是否 Private（Pages 可能需要付费套餐） |
| 中文在 PowerShell 里乱码 | 终端显示问题；用浏览器或 `read` 工具确认文件是 UTF-8 |
| `dist/` 被误提交 | `git rm -r --cached dist`，确认 `.gitignore` 生效后提交 |

## 13. Agent 完成后的汇报格式

完成修改后，向用户汇报：

```text
改了什么：
- ...

构建：
- npm run build：通过 / 失败（附错误）

验证：
- 检查了哪些页面/路由
- 是否检查移动端

未做：
- 是否 commit / push / 部署（没有明确要求时都没有做）

需要用户做：
- ...
```

如果任务只要求改内容，不要顺手改设计、依赖或部署配置。保持改动范围最小。
