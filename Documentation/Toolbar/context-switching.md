# Context Switching

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
