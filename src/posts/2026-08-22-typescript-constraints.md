---
title: "TypeScript 里那些让我安心的约束"
date: "2026-08-22"
category: "工程"
tags: ["TypeScript", "工程", "前端"]
summary: "类型不是为了让编译器闭嘴，而是为了在改动发生的时候，让错误出现在它该出现的地方。"
---

我对 TypeScript 的好感，来自一次深夜的线上事故。一个字段从可选改成必填，调用方有三处没跟上，测试没覆盖到，直到用户点了那个按钮才报错。

如果类型写对了，这个错误会在本地编译时就出现。

## 用可辨识联合表达状态

最容易写错的东西是“状态”。加载中、成功、失败，很多人会写成三个可选字段：

```ts
type State = {
  loading?: boolean;
  data?: User;
  error?: Error;
};
```

这个类型允许 `loading: true` 的同时存在 `data`，也允许三个字段全为空。编译器无法阻止你写出不合法的状态。

改成可辨识联合之后，每个分支都自带约束：

```ts
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: User }
  | { status: "error"; error: Error };

function render(state: State) {
  switch (state.status) {
    case "idle":
      return "等待中";
    case "loading":
      return "加载中…";
    case "success":
      return state.data.name;
    case "error":
      return state.error.message;
  }
}
```

如果以后新增一个 `"empty"` 状态，所有没有处理它的 `switch` 都会报错。这正是我们想要的效果：让改动的影响面显式地暴露出来。

## `satisfies` 比 `as` 诚实

`as` 是在告诉编译器“相信我”，而 `satisfies` 是在说“检查我，但保留更精确的类型”。

```ts
const routes = {
  home: "/",
  archive: "/archive/",
  about: "/about/",
} satisfies Record<string, `/${string}`>;

type RouteName = keyof typeof routes;
```

用 `as` 的话，`routes` 会退化成 `Record<string, string>`，`RouteName` 就变成了 `string`，自动补全全没了。`satisfies` 既做了约束，又保留了字面量类型。

## 穷尽检查

配合 `never`，可以强制处理所有分支：

```ts
function assertNever(value: never): never {
  throw new Error(`未处理的分支: ${JSON.stringify(value)}`);
}

function label(state: State): string {
  switch (state.status) {
    case "idle":
      return "空闲";
    case "loading":
      return "加载中";
    case "success":
      return "完成";
    case "error":
      return "失败";
    default:
      return assertNever(state);
  }
}
```

少写一个分支，`state` 就无法收窄成 `never`，编译直接失败。比起在运行时看到 `undefined`，我更喜欢这种错误。

## 约束的边界

当然，类型系统不是万能的。它不知道接口返回的数据长什么样，也不知道用户会输入什么。所以在边界上仍然需要运行时校验：`zod`、`valibot`，或者手写一个 `isUser`。

类型真正擅长的，是在边界之内保持一致性。它让“我改了这个，还有哪里要改”这个问题，有一个可以执行的答案。

这大概就是安心感的来源：不是相信我不会犯错，而是相信错误不会悄悄溜过去。
