# API

API 可通过 `Workbook` 的 `ref` 暴露出来.

```tsx
const ref = useRef<WorkbookInstance>(null);

<Workbook ref={ref} ... />
```

## 概览

| API | 描述 |
| ----- | ----------- |
| [applyOp](#applyop) | 应用op至Workbook |

### applyOp

应用op至Workbook。

通常用于在线协同场景，用来同步数据。

使用例子请查看 [Collabration demo](https://github.com/ruilisi/fortune-sheet/blob/master/stories/Collabration.stories.tsx).


---

更多 API 敬请期待.