# Separators

`ToolbarSeparator` renders a thin visual divider between groups of buttons. Unlike `ToolbarSection`, it has no behavioral logic — it simply draws a line perpendicular to the toolbar orientation. In a horizontal toolbar the separator is a vertical rule; in a vertical toolbar it is a horizontal rule.

```tsx
import { Toolbar, ToolbarButton, ToolbarSeparator } from '@cratis/components';

function ZoomToolbar() {
    return (
        <Toolbar orientation='horizontal'>
            <ToolbarButton icon='pi pi-th-large' title='Overview' tooltipPosition='bottom' />
            <ToolbarSeparator orientation='horizontal' />
            <ToolbarButton icon='pi pi-minus' title='Zoom out' tooltipPosition='bottom' />
            <ToolbarButton icon='pi pi-plus' title='Zoom in' tooltipPosition='bottom' />
            <ToolbarSeparator orientation='horizontal' />
            <ToolbarButton icon='pi pi-question-circle' title='Help' tooltipPosition='bottom' />
        </Toolbar>
    );
}
```

Pass the same `orientation` value to `ToolbarSeparator` as you pass to the enclosing `Toolbar` so the line is drawn perpendicular to the toolbar direction.

## Vertical toolbar

In a vertical toolbar (the default) the separator is a horizontal rule:

```tsx
<Toolbar>
    <ToolbarButton icon='pi pi-pencil' title='Draw' />
    <ToolbarSeparator />
    <ToolbarButton icon='pi pi-undo' title='Undo' />
</Toolbar>
```
