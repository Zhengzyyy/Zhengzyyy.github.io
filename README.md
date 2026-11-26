# 郑泽阳 · 个人博客

一个极简的静态博客：Markdown 写作，Node 构建，GitHub Pages 托管。

视觉语言取自马列维奇的至上主义，但页面中的几何构图全部为本站原创，不是对任何既有画作的复制。

## 修改内容

站名、首页文案、文章、关于页、配色、导航和插画的修改方式，统一写在 [CONTENT.md](CONTENT.md) 里。日常写作只需要看这一份。

## 本地开发

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

打开 `http://127.0.0.1:4173`。修改 `src/`、`scripts/` 或 `site.config.mjs` 后会自动重新构建。

其他命令：

```bash
npm run build   # 只构建到 dist/
npm run serve   # 预览已有 dist/，不监听文件变化
npm run clean   # 删除 dist/
```

## 目录

```text
site.config.mjs      站点信息、导航、作者与社交链接
src/posts/           Markdown 文章（文件名任意，slug 写在 frontmatter）
src/pages/about.md   关于页正文
src/assets/          CSS、JS、图标、插图
scripts/build.mjs    静态构建
scripts/serve.mjs    本地预览服务器
dist/                构建产物（不提交）
```

## 写一篇文章

在 `src/posts/` 新建 `.md` 文件，开头写：

```yaml
---
title: "文章标题"
date: "2026-11-26"
category: "工程"
tags: ["静态站点", "Node.js"]
slug: "my-post"
summary: "一两句话说清这篇文章在讲什么。"
---
```

正文使用普通 Markdown。一级标题由模板生成，正文从 `##` 开始。

`slug` 决定文章地址 `/posts/<slug>/`，发布后不要随意修改。

## 构建产物

`dist/` 包含：

- 首页、归档、标签与分类页、关于、搜索、404
- 每篇文章
- `/feed.xml`、`/sitemap.xml`、`/robots.txt`
- `/search.json` 客户端搜索索引
- 复制后的静态资源

## 部署到 GitHub Pages

仓库已经包含 `.github/workflows/pages.yml`。第一次部署前：

1. 把改动 push 到 `main` 分支。
2. 打开仓库 **Settings → Pages**。
3. 在 **Build and deployment** 下把 **Source** 改成 **GitHub Actions**（不要选 Deploy from a branch）。
4. 等待 Actions 里的 `Deploy static blog to GitHub Pages` 跑完，访问 `https://zhengzyyy.github.io/`。

之后每次 push 到 `main` 都会自动构建并发布。

如果以后绑定自定义域名，修改 `site.config.mjs` 中的 `url`，并在仓库根目录放 `CNAME` 文件。

## 说明

- 站点没有前端框架，也没有后端；搜索在浏览器里读取 `/search.json` 完成。
- 配色只有纸白、近黑、一点红；正文使用系统无衬线字体，标题里的衬线字只作为强调。
- 动效只有淡入、悬停和下划线，不加载大图、轮播或自动播放。
- 联系方式目前使用 `zheng25136@hotmail.com`；如需更换，修改 `site.config.mjs` 与 `src/pages/about.md`。
