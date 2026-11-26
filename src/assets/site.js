/* 全站轻量交互：复制代码、目录高亮。没有依赖。 */

(function () {
  "use strict";

  /* 复制代码 ------------------------------------------------------------ */

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy]");
    if (!button) return;

    const block = button.closest(".codeblock");
    const code = block ? block.querySelector("pre code") : null;
    if (!code) return;

    const original = button.textContent;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code.textContent);
      } else {
        const area = document.createElement("textarea");
        area.value = code.textContent;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.top = "-1000px";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      button.textContent = "已复制";
      button.classList.add("is-copied");
    } catch (error) {
      button.textContent = "复制失败";
    }

    window.setTimeout(() => {
      button.textContent = original;
      button.classList.remove("is-copied");
    }, 1600);
  });

  /* 目录高亮 ------------------------------------------------------------ */

  const links = Array.from(document.querySelectorAll('.toc a[href^="#"]'));
  if (!links.length) return;

  const decode = (value) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  const pairs = links
    .map((link) => {
      const id = decode(link.getAttribute("href").slice(1));
      const heading = document.getElementById(id);
      return heading ? { link, heading } : null;
    })
    .filter(Boolean);

  if (!pairs.length || !("IntersectionObserver" in window)) return;

  const visible = new Set();

  const setActive = () => {
    if (!visible.size) return;
    let current = null;
    for (const item of pairs) {
      if (!visible.has(item.heading.id)) continue;
      if (!current || item.heading.offsetTop < current.heading.offsetTop) {
        current = item;
      }
    }
    if (!current) return;
    for (const item of pairs) {
      item.link.classList.toggle("is-active", item.link === current.link);
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visible.add(entry.target.id);
        } else {
          visible.delete(entry.target.id);
        }
      }
      setActive();
    },
    { rootMargin: "-8% 0px -68% 0px", threshold: 0 },
  );

  for (const item of pairs) observer.observe(item.heading);
})();
