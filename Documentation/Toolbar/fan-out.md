---
title: Fan-out sub-panel
description: Slide out a panel of related tools from a single ToolbarFanOutItem trigger.
---

`ToolbarFanOutItem` replaces a regular button with one that slides out a panel of additional tools when clicked. The panel closes when you click the trigger again, press anywhere outside it, or press Escape; Escape also returns focus to the trigger.

`icon`, `tooltip`, and `children` are required. `tooltip` is the trigger's accessible name as well as its tooltip. The trigger exposes `aria-expanded` and `aria-controls`, and the collapsed panel is `inert`, so its tools are not reachable with Tab until it opens.

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
