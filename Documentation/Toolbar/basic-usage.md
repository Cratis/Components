# Basic Usage

Place `ToolbarButton` elements inside a `Toolbar`:

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

`ToolbarButton` renders `text` when that prop is non-empty; otherwise it renders `icon`. Use `text` for text-first controls such as zoom indicators rather than expecting icon and text to appear together:

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

The `icon` prop accepts an `Icon` (`string | ReactNode`). Prefer a React element, product-owned SVG, or icon-library component. A string is treated as a consumer-owned icon-font class; Components does not install that font.

```tsx
import { FaArrowPointer, FaPencil } from 'react-icons/fa6';

<Toolbar>
    <ToolbarButton icon={<FaArrowPointer />} title='Select' />
    <ToolbarButton icon={<FaPencil />} title='Draw' />
</Toolbar>
```

See [Icon](../Common/icon.md) for the shared `Icon` type and `IconDisplay` component.
