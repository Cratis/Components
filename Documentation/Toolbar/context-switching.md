---
title: Toolbar context switching
description: Switch named tool sets with ToolbarSection while keeping shared actions in place, and control which tools remain available to keyboard users.
---

Use `ToolbarSection` in Cratis Components to change the tools for the current editing mode while keeping shared actions in place. Each `ToolbarContext` defines a named set of tools. Changing `activeContext` fades between those sets and resizes the section to fit the active one.

Keep mode selection in your application state. In this example, `mode` starts as `'drawing'`; your mode control calls `setMode('text')` to show the alignment tools. The fragment assumes React's `useState` and the toolbar components are imported.

```tsx
function ContextualToolbar() {
    const [mode, setMode] = useState('drawing');

    return (
        <Toolbar>
            <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Select' />
            <ToolbarSection activeContext={mode}>
                <ToolbarContext name='drawing'>
                    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Draw' />
                    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Rectangle' />
                    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Circle' />
                </ToolbarContext>
                <ToolbarContext name='text'>
                    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Align Left' />
                    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Align Center' />
                </ToolbarContext>
            </ToolbarSection>
            <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Undo' />
        </Toolbar>
    );
}
```

Select and Undo sit outside the section, so they remain available in both modes. Only the tools inside the section transition.

`activeContext` must match a context's `name`. Omit it to use the first context; an unmatched name shows no context. Inactive contexts stay mounted, preserving their component state, but become `inert` and `aria-hidden`. Their tools leave the Tab order and their tooltips are disabled. The section does not move focus when the mode changes, so manage focus in your application if the change hides the tool the user was using.

Inside a horizontal toolbar, pass `orientation='horizontal'` to `ToolbarSection` too; it defaults to `vertical`. Under `prefers-reduced-motion: reduce`, the stylesheet turns off the fade and resize transitions.

If features supply tools independently, [register them in a context slot](slots.md#injecting-into-a-toolbarcontext). To replace whole groups and separators instead of keeping named contexts mounted, use [ToolbarLayout](toolbar-layout.md).
