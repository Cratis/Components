---
title: Tooltip position
description: Choose where toolbar tooltips appear relative to their trigger.
---

`ToolbarButton`, `ToolbarFanOutItem`, and `ToolbarFolder` default to showing tooltips on the `right`. Use `tooltipPosition` to override:

```tsx
<ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Settings' tooltipPosition='bottom' />
```

Valid values are `'top'`, `'right'`, `'bottom'`, and `'left'`.

Tooltips appear on hover and on keyboard focus after a short delay. They are disabled for tools inside a collapsed folder or fan-out, or an inactive context, and a folder or fan-out trigger hides its tooltip while its panel is open. In a folder's list mode, buttons show their `title` as a visible label instead of a tooltip. A horizontal toolbar along the top of the screen usually reads better with `tooltipPosition='bottom'`.
