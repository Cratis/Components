# Toolbar

The `Toolbar` component provides a canvas-style icon toolbar with support for orientations, active states, animated context switching, and fan-out sub-panels.

## Components

| Component | Description |
|---|---|
| `Toolbar` | Container that groups toolbar buttons into a pill-shaped bar |
| `ToolbarButton` | Icon button with a hover tooltip |
| `ToolbarSection` | Section within a toolbar that animates between named contexts |
| `ToolbarContext` | Named context (set of buttons) inside a `ToolbarSection` |
| `ToolbarFanOutItem` | Button that slides out a horizontal sub-panel on click |

## Basic Usage

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

## Orientation

The toolbar defaults to `vertical`. Pass `orientation='horizontal'` for a horizontal layout:

```tsx
<Toolbar orientation='horizontal'>
    <ToolbarButton icon='pi pi-undo' tooltip='Undo' />
    <ToolbarButton icon='pi pi-refresh' tooltip='Redo' />
</Toolbar>
```

## Active State

Use the `active` prop on `ToolbarButton` to highlight the selected tool:

```tsx
function DrawingToolbar() {
    const [activeTool, setActiveTool] = useState('select');

    return (
        <Toolbar>
            <ToolbarButton
                icon='pi pi-arrow-up-left'
                tooltip='Select'
                active={activeTool === 'select'}
                onClick={() => setActiveTool('select')}
            />
            <ToolbarButton
                icon='pi pi-pencil'
                tooltip='Draw'
                active={activeTool === 'draw'}
                onClick={() => setActiveTool('draw')}
            />
        </Toolbar>
    );
}
```

## Context Switching

`ToolbarSection` and `ToolbarContext` enable smooth animated transitions between different sets of tools. When `activeContext` changes, the current buttons fade out, the section morphs to the new size, then the new buttons fade in.

```tsx
function ContextualToolbar() {
    const [mode, setMode] = useState('drawing');

    return (
        <Toolbar>
            <ToolbarButton icon='pi pi-arrow-up-left' tooltip='Select' />
            <ToolbarSection activeContext={mode}>
                <ToolbarContext name='drawing'>
                    <ToolbarButton icon='pi pi-pencil' tooltip='Draw' />
                    <ToolbarButton icon='pi pi-stop' tooltip='Rectangle' />
                    <ToolbarButton icon='pi pi-circle' tooltip='Circle' />
                </ToolbarContext>
                <ToolbarContext name='text'>
                    <ToolbarButton icon='pi pi-align-left' tooltip='Align Left' />
                    <ToolbarButton icon='pi pi-align-center' tooltip='Align Center' />
                </ToolbarContext>
            </ToolbarSection>
            <ToolbarButton icon='pi pi-undo' tooltip='Undo' />
        </Toolbar>
    );
}
```

Only the section transitions — buttons outside the section are unaffected.

## Fan-Out Sub-Panel

`ToolbarFanOutItem` replaces a regular button with one that slides out a horizontal panel of additional tools when clicked. The panel closes when clicking the button again or anywhere outside it.

```tsx
<Toolbar>
    <ToolbarButton icon='pi pi-arrow-up-left' tooltip='Select' />
    <ToolbarFanOutItem icon='pi pi-th-large' tooltip='Shapes'>
        <ToolbarButton icon='pi pi-stop' tooltip='Rectangle' />
        <ToolbarButton icon='pi pi-circle' tooltip='Circle' />
        <ToolbarButton icon='pi pi-minus' tooltip='Line' />
    </ToolbarFanOutItem>
</Toolbar>
```

By default the panel fans out to the right. Use `fanOutDirection='left'` when the toolbar is positioned on the right side of the screen:

```tsx
<ToolbarFanOutItem icon='pi pi-th-large' tooltip='Shapes' fanOutDirection='left'>
    ...
</ToolbarFanOutItem>
```

## Multiple Toolbar Groups

Render multiple `Toolbar` instances to create separate groups, matching the style of canvas-based tools panels:

```tsx
<div className='flex flex-col gap-2'>
    <Toolbar>
        <ToolbarButton icon='pi pi-arrow-up-left' tooltip='Select' />
        <ToolbarButton icon='pi pi-pencil' tooltip='Draw' />
    </Toolbar>
    <Toolbar>
        <ToolbarButton icon='pi pi-undo' tooltip='Undo' />
        <ToolbarButton icon='pi pi-refresh' tooltip='Redo' />
    </Toolbar>
</div>
```

## Tooltip Position

Both `ToolbarButton` and `ToolbarFanOutItem` default to showing tooltips on the `right`. Use `tooltipPosition` to override:

```tsx
<ToolbarButton icon='pi pi-cog' tooltip='Settings' tooltipPosition='bottom' />
```

Valid values are `'top'`, `'right'`, `'bottom'`, and `'left'`.
