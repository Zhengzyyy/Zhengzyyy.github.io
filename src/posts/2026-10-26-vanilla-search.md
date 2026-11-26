---
title: "用原生 JavaScript 写一个够用的搜索"
date: "2026-10-26"
category: "工程"
tags: ["JavaScript", "搜索", "静态站点"]
summary: "没有后端，也不引入任何库：一个 JSON 索引、七十行打分逻辑，就能让静态博客拥有即时搜索。"
---

静态博客最容易被诟病的一点，是没有搜索。文章一多，读者只能去翻归档。其实这件事没有那么复杂：把所有文章压成一个 JSON，在浏览器里做一次字符串匹配，就足够覆盖个人博客的规模。

这篇文章记录我的实现，以及几个容易踩的坑。

## 先把文章变成索引

构建时，我为每篇文章生成一条记录：

```json
{
  "t": "把博客搬回自己手里",
  "u": "/posts/back-to-static/",
  "d": "2026.11.20",
  "c": "工程",
  "g": ["静态站点", "Node.js"],
  "x": "一句话摘要。",
  "rt": 5,
  "b": "正文的纯文本版本……"
}
```

字段名压得很短，是为了控制体积。八篇文章的索引大约 40 KB，gzip 之后不到 15 KB，完全可以接受。如果文章上千篇，就该考虑分片或者预生成倒排索引了，但那是另一个问题。

正文我保留了代码块里的内容。很多读者其实是带着一个函数名或报错信息来的，把这些词过滤掉，搜索就废了一半。

## 打分

匹配逻辑很朴素：标题命中权重最高，其次是标签和摘要，最后是正文。再加上一点位置奖励——越靠前的命中越相关。

```js
function score(post, terms) {
  let total = 0;
  for (const term of terms) {
    const inTitle = post.t.includes(term);
    const inTags = post.g.some((tag) => tag.includes(term));
    const inSummary = post.x.includes(term);
    const bodyIndex = post.b.indexOf(term);

    if (!inTitle && !inTags && !inSummary && bodyIndex === -1) return 0;

    total += inTitle ? 12 : 0;
    total += inTags ? 6 : 0;
    total += inSummary ? 4 : 0;
    if (bodyIndex !== -1) {
      total += 2;
      total += Math.max(0, 3 - bodyIndex / 400);
    }
  }
  return total;
}
```

多个关键词之间是“与”的关系：每个词都得出现，分数累加。中文不做分词，直接按子串匹配。对博客来说，这比引入一个分词库更划算——读者输入的通常是「排版」「TypeScript」这种完整的词。

## 输入与渲染

搜索框绑定 `input` 事件，加 120 毫秒防抖。结果用 `document.createElement` 构建，而不是拼 HTML 字符串。索引内容毕竟来自我自己的文章，但养成习惯没有坏处：只要有一段内容可能包含用户输入，就不要把它直接塞进 `innerHTML`。

```js
input.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const query = input.value.trim();
    if (!query) {
      renderEmpty();
      return;
    }
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const hits = index
      .map((post) => ({ post, score: score(post, terms) }))
      .filter((hit) => hit.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
    renderResults(hits);
  }, 120);
});
```

结果列表只展示标题、日期和摘要，点击进入文章。如果需要高亮，可以在渲染之后用 `Range` 包一层 `<mark>`，但我不想让结果页变得太花。

## 一些边界

- 输入为空时，不显示“没有结果”，而是给几个推荐标签；
- 按 `/` 聚焦搜索框，按 `Esc` 清空并失焦；
- 结果数量变化通过 `aria-live` 播报，读屏用户才知道发生了什么；
- 没有 JavaScript 时，页面仍然能显示一个指向归档的链接。

最后一条经常被忽略。搜索是增强功能，不是网站的地基。地基应该是那些即使脚本全部失效，也依然能读的文章页面。
