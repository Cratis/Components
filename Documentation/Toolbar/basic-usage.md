# Basic Usage

Place `ToolbarButton` elements inside a `Toolbar`:

```tsx
import { Toolbar, ToolbarButton } from '@cratis/components';

function MyToolbar() {
    return (
        <Toolbar>
            <ToolbarButton icon='pi pi-arrow-up-left' tooltip='Select' />
            <ToolbarButton icon='pi pi-pencil' tooltip='Draw' />
            <ToolbarButton icon='pi pi-stop' tooltip='Rectangle' />
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
            <ToolbarButton icon='pi pi-minus' tooltip='Zoom out' onClick={() => setZoom(value => value - 10)} />
            <ToolbarButton text={`${zoom}%`} tooltip='Reset zoom' onClick={() => setZoom(100)} />
            <ToolbarButton icon='pi pi-plus' tooltip='Zoom in' onClick={() => setZoom(value => value + 10)} />
            <ToolbarSeparator orientation='horizontal' />
            <ToolbarButton icon='pi pi-question-circle' tooltip='Help' />
        </Toolbar>
    );
}
```
