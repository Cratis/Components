---
title: Context switching
description: Swap between named sets of tools with an animated ToolbarSection.
---

`ToolbarSection` and `ToolbarContext` enable smooth animated transitions between different sets of tools. When `activeContext` changes, the current buttons fade out, the section morphs to the new size, then the new buttons fade in.

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

Only the section transitions — buttons outside the section are unaffected.

`activeContext` names the `ToolbarContext` to show; when it is omitted, the first context is active. A value that matches no context shows none of them. Inactive contexts stay mounted but are `inert` and `aria-hidden`, so their tools leave the Tab order and their tooltips are disabled. Inside a horizontal toolbar, pass `orientation='horizontal'` to `ToolbarSection` as well; it defaults to `vertical`. Under `prefers-reduced-motion: reduce` the stylesheet turns off the fade and resize transitions.
