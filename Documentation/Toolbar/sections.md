# Separators

`ToolbarSeparator` renders a thin visual divider between groups of buttons. Unlike `ToolbarSection`, it has no behavioral logic — it simply draws a line perpendicular to the toolbar orientation. In a horizontal toolbar the separator is a vertical rule; in a vertical toolbar it is a horizontal rule.

```tsx
import { Toolbar, ToolbarButton, ToolbarSeparator } from '@cratis/components/Toolbar';

function ZoomToolbar() {
    return (
        <Toolbar orientation='horizontal'>
            <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Overview' tooltipPosition='bottom' />
            <ToolbarSeparator orientation='horizontal' />
            <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Zoom out' tooltipPosition='bottom' />
            <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Zoom in' tooltipPosition='bottom' />
            <ToolbarSeparator orientation='horizontal' />
            <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Help' tooltipPosition='bottom' />
        </Toolbar>
    );
}
```

Pass the same `orientation` value to `ToolbarSeparator` as you pass to the enclosing `Toolbar` so the line is drawn perpendicular to the toolbar direction.

## Vertical toolbar

In a vertical toolbar (the default) the separator is a horizontal rule:

```tsx
<Toolbar>
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Draw' />
    <ToolbarSeparator />
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Undo' />
</Toolbar>
```
