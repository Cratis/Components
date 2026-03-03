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
