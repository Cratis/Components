---
title: Toolbar tooltip placement
description: Place Toolbar tooltips above, below, or beside each trigger. Position labels for the palette's location while keeping accessible tool names.
---

`tooltipPosition` places a toolbar tool's label above, below, or beside its trigger on hover or keyboard focus. Choose a side that leaves room for the label: below a top-mounted palette, for example, or toward the canvas from a side palette.

`ToolbarButton`, `ToolbarFanOutItem`, and `ToolbarFolder` default to `right`, regardless of the toolbar's orientation. For a horizontal palette along the top, set `tooltipPosition='bottom'` on each trigger whose label should appear below it:

```tsx
import { Toolbar, ToolbarButton } from '@cratis/components/Toolbar';

<Toolbar orientation='horizontal' aria-label='Canvas tools'>
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Settings' tooltipPosition='bottom' />
</Toolbar>
```

Valid values are `'top'`, `'right'`, `'bottom'`, and `'left'`.

Position belongs to each trigger. Setting it on a folder does not configure the folder's child buttons, and `Toolbar` has no inherited tooltip-position setting. A button or folder uses its `title` as the label; a fan-out trigger uses `tooltip`. That same text supplies the accessible name, so name the tool or action even when its icon seems familiar.

Tooltips appear after a short delay on hover and keyboard focus. Hidden tools in collapsed folders, fan-outs, or inactive contexts have tooltips disabled. A folder or fan-out trigger also hides its tooltip while its panel is open. In a folder's list mode, buttons display `title` as a visible label instead.

Keep these labels short. Tooltips are non-interactive, so put additional tools in a folder or fan-out panel instead of adding links or commands to the label. Check labels with keyboard focus and pointer hover in your application, including near screen edges, to make sure they remain visible.

## See also

- [Basic usage](basic-usage.md) — name and render tools
- [Expandable folder](folder.md) — show nested tools
- [Fan-out sub-panel](fan-out.md) — configure a fan-out trigger
