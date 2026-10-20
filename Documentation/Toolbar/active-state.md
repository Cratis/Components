---
title: Active state
description: Highlight the selected tool in a Toolbar and expose that state to assistive technology.
---

Use the `active` prop on `ToolbarButton` to highlight the selected tool. The toolbar does not track selection: keep the active tool in your own state and set `active` on the matching button.

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

`active` adds the `toolbar-button--active` class and the `data-active` and `data-selected` attributes, which drive the built-in highlight and any product CSS. Passing `active` also sets `aria-pressed` to `true` or `false` so screen readers can identify the selected tool. If you omit `active`, the button has no `aria-pressed` attribute and remains a plain action button. You can still override `aria-pressed` through `pt.root` when needed.

## Selection and actions

Set `active={false}` on unselected tools in a selection set, rather than omitting the prop. This keeps the pressed/unpressed relationship explicit for assistive technology. For an immediate action such as Undo that is not a persistent mode, omit `active` so it remains an ordinary action button.

Clicking a button calls `onClick`; it does not toggle `active` automatically. In the example, the state update causes a render that marks the selected tool and clears the other one. If several toolbars control the same canvas mode, pass the same application state to each instead of maintaining unrelated selections.

The pressed-state behavior also applies when a button appears in a folder's list presentation. An explicit `pt.root` override changes the announced pressed state, not your application selection, so keep it consistent with the visual highlight.

## See also

- [Basic usage](basic-usage.md) — distinguish tool labels from visible content
- [Multiple toolbar groups](multiple-groups.md) — compose independent palettes
- [Stable component parts](../Styling/pass-through.md) — customize state styling
