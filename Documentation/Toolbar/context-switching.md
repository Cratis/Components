# Context Switching

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
