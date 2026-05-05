# Basic Usage

Place `ToolbarButton` elements inside a `Toolbar`:

```tsx
import { Toolbar, ToolbarButton } from '@cratis/components';

function MyToolbar() {
    return (
        <Toolbar>
            <ToolbarButton icon='pi pi-arrow-up-left' title='Select' />
            <ToolbarButton icon='pi pi-pencil' title='Draw' />
            <ToolbarButton icon='pi pi-stop' title='Rectangle' />
        </Toolbar>
    );
}
```

`ToolbarButton` supports either an icon, text, or both. For text-first controls such as zoom indicators, provide the `text` prop:

```tsx
import { Toolbar, ToolbarButton, ToolbarSeparator } from '@cratis/components';

function ZoomToolbar() {
    const [zoom, setZoom] = useState(120);

    return (
        <Toolbar orientation='horizontal'>
            <ToolbarButton icon='pi pi-minus' title='Zoom out' onClick={() => setZoom(value => value - 10)} />
            <ToolbarButton text={`${zoom}%`} title='Reset zoom' onClick={() => setZoom(100)} />
            <ToolbarButton icon='pi pi-plus' title='Zoom in' onClick={() => setZoom(value => value + 10)} />
            <ToolbarSeparator orientation='horizontal' />
            <ToolbarButton icon='pi pi-question-circle' title='Help' />
        </Toolbar>
    );
}
```

## ReactNode Icons

The `icon` prop accepts a `string | ReactNode`. In addition to PrimeIcons CSS class strings you can pass any React element — an SVG component, a third-party icon library component, or any other node:

```tsx
import { FaPencil } from 'react-icons/fa6';

<Toolbar>
    {/* String — PrimeIcons CSS class */}
    <ToolbarButton icon='pi pi-arrow-up-left' title='Select' />

    {/* ReactNode — third-party icon component */}
    <ToolbarButton icon={<FaPencil />} title='Draw' />
</Toolbar>
```

See [Icon](../../Common/icon.md) for the shared `Icon` type and `IconDisplay` component.
