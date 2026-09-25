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
                pt={{ root: { 'aria-pressed': activeTool === 'select' } }}
                onClick={() => setActiveTool('select')}
            />
            <ToolbarButton
                icon={<FaPencil aria-hidden='true' />}
                title='Draw'
                active={activeTool === 'draw'}
                pt={{ root: { 'aria-pressed': activeTool === 'draw' } }}
                onClick={() => setActiveTool('draw')}
            />
        </Toolbar>
    );
}
```

`active` adds the `toolbar-button--active` class and the `data-active` and `data-selected` attributes, which drive the built-in highlight and any product CSS. It does not set `aria-pressed`, so a screen reader cannot tell which tool is selected from `active` alone. Pass `aria-pressed` through `pt.root`, as above, to announce the tools as toggle buttons.
