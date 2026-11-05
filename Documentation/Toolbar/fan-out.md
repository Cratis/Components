---
title: Toolbar fan-out panels
description: Keep related tools behind one ToolbarFanOutItem trigger, choose the panel direction, and understand keyboard focus and dismissal.
---

Use `ToolbarFanOutItem` in Cratis Components to keep a related set of tools, such as shapes, behind a single trigger. Clicking the trigger opens a strip of buttons beside it. Choose the opening direction to suit the toolbar's position.

Supply `icon`, `tooltip`, and `children`. The `tooltip` names both the trigger and the panel for assistive technology, as well as providing the trigger's tooltip. The example groups three shape tools without adding them permanently to the main toolbar.

```tsx
import { Toolbar, ToolbarButton, ToolbarFanOutItem } from '@cratis/components/Toolbar';

<Toolbar>
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Select' />
    <ToolbarFanOutItem icon={<span aria-hidden='true'>◆</span>} tooltip='Shapes'>
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Rectangle' />
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Circle' />
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Line' />
    </ToolbarFanOutItem>
</Toolbar>
```

Opening the panel does not move focus into it. The trigger exposes `aria-expanded` and `aria-controls`; when collapsed, the panel is `inert` and `aria-hidden`, so its tools are not reachable by keyboard. Click the trigger again, click outside the fan-out, or press Escape to close it. Escape returns focus to the trigger; an outside press does not. Activating a child tool does not automatically close the panel.

By default the panel fans out to the right. Use `fanOutDirection='left'` when the toolbar is positioned on the right side of the screen:

```tsx
<ToolbarFanOutItem icon={<span aria-hidden='true'>◆</span>} tooltip='Shapes' fanOutDirection='left'>
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Rectangle' />
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Circle' />
</ToolbarFanOutItem>
```

You can also fan out vertically:

```tsx
<ToolbarFanOutItem icon={<span aria-hidden='true'>◆</span>} tooltip='Shapes' fanOutDirection='up'>
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Rectangle' />
</ToolbarFanOutItem>
```

`fanOutDirection` accepts `'right'` (default), `'left'`, `'up'`, and `'down'`.

## ReactNode Icons

Like `ToolbarButton`, the `icon` prop accepts a `string | ReactNode`. Pass any React element as the trigger icon:

```tsx
import { FaShapes } from 'react-icons/fa6';

<ToolbarFanOutItem icon={<FaShapes />} tooltip='Shapes'>
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Rectangle' />
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Circle' />
</ToolbarFanOutItem>
```

See [Icon](../Common/icon.md) for the shared `Icon` type and `IconDisplay` component.

For a compact grid or a list with visible tool names, use a [ToolbarFolder](folder.md). When users need a headed catalogue of labeled tiles with activation and drag callbacks, use a [drawer palette](drawer.md).
