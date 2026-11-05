---
title: Toolbar basic usage
description: Compose a Toolbar from named buttons with icons or text. Learn how labels, click handlers, and application state define the tools users operate.
---

Build a canvas tool palette by placing `ToolbarButton` elements inside a `Toolbar`. Each button needs a tool name and visible content, either an icon or text. The example below lays out Select, Draw, and Rectangle vertically; it does not yet connect those buttons to canvas behavior.

```tsx
import { Toolbar, ToolbarButton } from '@cratis/components/Toolbar';
import { FaArrowPointer, FaPencil, FaRegSquare } from 'react-icons/fa6';

function MyToolbar() {
    return (
        <Toolbar>
            <ToolbarButton icon={<FaArrowPointer />} title='Select' />
            <ToolbarButton icon={<FaPencil />} title='Draw' />
            <ToolbarButton icon={<FaRegSquare />} title='Rectangle' />
        </Toolbar>
    );
}
```

`title` is required. It supplies the button's `aria-label` and the tooltip shown on hover and keyboard focus, so write it as the tool's name. Give the palette an `aria-label`, such as `Drawing tools`, to distinguish it from other toolbars on the page.

Add `onClick` to connect a button to your application. For a persistent mode such as Draw, keep the selection in application state and pass `active` to each tool. [Active state](active-state.md) shows that connection; the toolbar does not select tools for you.

`ToolbarButton` renders non-empty `text` instead of `icon`. This lets a zoom control display its current percentage while remaining a button. In the example below, the middle button displays the `zoom` state and resets it to 100 when clicked. Its accessible name is still `title`, so a screen reader announces "Reset zoom", not the percentage:

```tsx
import { useState } from 'react';
import { Toolbar, ToolbarButton, ToolbarSeparator } from '@cratis/components/Toolbar';
import { FaCircleQuestion, FaMinus, FaPlus } from 'react-icons/fa6';

function ZoomToolbar() {
    const [zoom, setZoom] = useState(120);

    return (
        <Toolbar orientation='horizontal'>
            <ToolbarButton icon={<FaMinus />} title='Zoom out' onClick={() => setZoom(value => value - 10)} />
            <ToolbarButton text={`${zoom}%`} title='Reset zoom' onClick={() => setZoom(100)} />
            <ToolbarButton icon={<FaPlus />} title='Zoom in' onClick={() => setZoom(value => value + 10)} />
            <ToolbarSeparator orientation='horizontal' />
            <ToolbarButton icon={<FaCircleQuestion />} title='Help' />
        </Toolbar>
    );
}
```

## ReactNode Icons

The `icon` prop accepts an `Icon` (`string | ReactNode`). Use a React element, your own SVG, or an icon-library component. The examples use `react-icons/fa6`; choose icons available in your application. A string is treated as an icon-font class, and your application must load the matching font stylesheet.

```tsx
import { FaArrowPointer, FaPencil } from 'react-icons/fa6';

<Toolbar>
    <ToolbarButton icon={<FaArrowPointer />} title='Select' />
    <ToolbarButton icon={<FaPencil />} title='Draw' />
</Toolbar>
```

See [Icon](../Common/icon.md) for the shared `Icon` type and `IconDisplay` component. Once the buttons have names and behavior, choose an [orientation](orientation.md) and [group related tools](groups.md) to fit the space around your canvas.
