# Context Switching

`ToolbarSection` and `ToolbarContext` enable smooth animated transitions between different sets of tools. When `activeContext` changes, the current buttons fade out, the section morphs to the new size, then the new buttons fade in.

```tsx
function ContextualToolbar() {
    const [mode, setMode] = useState('drawing');

    return (
        <Toolbar>
            <ToolbarButton icon='pi pi-arrow-up-left' title='Select' />
            <ToolbarSection activeContext={mode}>
                <ToolbarContext name='drawing'>
                    <ToolbarButton icon='pi pi-pencil' title='Draw' />
                    <ToolbarButton icon='pi pi-stop' title='Rectangle' />
                    <ToolbarButton icon='pi pi-circle' title='Circle' />
                </ToolbarContext>
                <ToolbarContext name='text'>
                    <ToolbarButton icon='pi pi-align-left' title='Align Left' />
                    <ToolbarButton icon='pi pi-align-center' title='Align Center' />
                </ToolbarContext>
            </ToolbarSection>
            <ToolbarButton icon='pi pi-undo' title='Undo' />
        </Toolbar>
    );
}
```

Only the section transitions — buttons outside the section are unaffected.
