# Active State

Use the `active` prop on `ToolbarButton` to highlight the selected tool:

```tsx
function DrawingToolbar() {
    const [activeTool, setActiveTool] = useState('select');

    return (
        <Toolbar>
            <ToolbarButton
                icon='pi pi-arrow-up-left'
                title='Select'
                active={activeTool === 'select'}
                onClick={() => setActiveTool('select')}
            />
            <ToolbarButton
                icon='pi pi-pencil'
                title='Draw'
                active={activeTool === 'draw'}
                onClick={() => setActiveTool('draw')}
            />
        </Toolbar>
    );
}
```
