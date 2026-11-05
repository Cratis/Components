---
title: Toolbar active tool selection
description: Keep Toolbar selection in application state and pass active to each tool. Selected tools expose aria-pressed; one-time actions leave it unset.
---

Use `active` on `ToolbarButton` to show which tool controls the canvas and expose that selection to assistive technology. Keep the selected tool in application state: `Toolbar` neither stores the selection nor toggles it when a button is clicked.

```tsx
import { useState } from 'react';
import { FaArrowPointer, FaPencil } from 'react-icons/fa6';
import { Toolbar, ToolbarButton } from '@cratis/components/Toolbar';

export function DrawingToolbar() {
    const [activeTool, setActiveTool] = useState('select');

    return (
        <Toolbar aria-label='Drawing tools'>
            <ToolbarButton
                icon={<FaArrowPointer aria-hidden='true' />}
                title='Select'
                active={activeTool === 'select'}
                onClick={() => setActiveTool('select')}
            />
            <ToolbarButton
                icon={<FaPencil aria-hidden='true' />}
                title='Draw'
                active={activeTool === 'draw'}
                onClick={() => setActiveTool('draw')}
            />
        </Toolbar>
    );
}
```

The example starts with Select pressed and Draw unpressed. Clicking Draw changes `activeTool`, so the next render highlights Draw and clears Select. Use that same state when deciding how the canvas responds to input.

When `active` is true, the button adds `toolbar-button--active`, `data-active`, and `data-selected` for highlighting. Passing either `true` or `false` also sets `aria-pressed`, allowing screen readers to distinguish selected and unselected tools. Omitting `active` leaves `aria-pressed` unset, as appropriate for an ordinary action button.

## Selection and actions

Pass `active={false}` to unselected tools in a selection set, as the comparisons above do. This keeps the pressed/unpressed relationship explicit for assistive technology. For an immediate action such as Undo, omit `active`: performing an action does not leave the canvas in an Undo mode.

Keyboard focus and selection are separate. Arrow keys move focus between tools; your `onClick` handler changes the selected mode. If several palettes control the same canvas, give them the same application state so they show the same selection.

The pressed-state behavior also applies to buttons in a folder's list presentation. You can override `aria-pressed` through `pt.root`, but that changes the announcement, not the application state or visual selection. Keep them consistent.

## See also

- [Basic usage](basic-usage.md) — distinguish tool labels from visible content
- [Multiple toolbar groups](multiple-groups.md) — compose independent palettes
- [Stable component parts](../Styling/pass-through.md) — customize state styling
