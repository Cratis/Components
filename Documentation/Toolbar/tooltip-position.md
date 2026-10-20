---
title: Tooltip position
description: Choose where toolbar tooltips appear relative to their trigger.
---

`tooltipPosition` chooses which side of a toolbar tool shows its label on hover or keyboard focus. Use it to keep labels away from the screen edge or from neighboring palettes.

`ToolbarButton`, `ToolbarFanOutItem`, and `ToolbarFolder` default to showing tooltips on the `right`. Set the prop on each trigger whose placement should differ:

```tsx
import { Toolbar, ToolbarButton } from '@cratis/components/Toolbar';

<Toolbar orientation='horizontal' aria-label='Canvas tools'>
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Settings' tooltipPosition='bottom' />
</Toolbar>
```

Valid values are `'top'`, `'right'`, `'bottom'`, and `'left'`.

Tooltips appear on hover and on keyboard focus after a short delay. They are disabled for tools inside a collapsed folder or fan-out, or an inactive context, and a folder or fan-out trigger hides its tooltip while its panel is open. In a folder's list mode, buttons show their `title` as a visible label instead of a tooltip. A horizontal toolbar along the top of the screen usually reads better with `tooltipPosition='bottom'`.

Position is local to the trigger, not inherited from `Toolbar`. Setting a folder's tooltip position does not configure its child buttons, and changing `orientation` does not change the tooltip default. A fan-out trigger uses its `tooltip` text; a button or folder uses its `title`.

Keep tooltip text short and descriptive. A button's `title` also supplies its accessible name, so do not use placement as a substitute for meaningful text. The tooltip is a non-interactive label, not a place for links or commands; use the folder or fan-out panel for additional tools. Test placement with both keyboard focus and pointer hover in the space your application provides.

## See also

- [Basic usage](basic-usage.md) — name and render tools
- [Expandable folder](folder.md) — show nested tools
- [Fan-out sub-panel](fan-out.md) — configure a fan-out trigger
