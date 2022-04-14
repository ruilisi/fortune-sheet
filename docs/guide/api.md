# API

API is avaible by the `ref` of `Workbook`

```tsx
const ref = useRef<WorkbookInstance>(null);

<Workbook ref={ref} ... />
```

## Overview

| API | Description |
| ----- | ----------- |
| [applyOp](#applyop) | applys an array of op to the workbook |

### applyOp

Applys an array of op to the workbook.

This api is typically used in online collabration to sync data.

See [Collabration demo](https://github.com/ruilisi/fortune-sheet/blob/master/stories/Collabration.stories.tsx) for an example usage.


---

More API is coming soon.