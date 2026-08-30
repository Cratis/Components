# Active State

Use the `active` prop on `ToolbarButton` to highlight the selected tool:

```tsx
function DrawingToolbar() {
    const [activeTool, setActiveTool] = useState('select');

    return (
        <Toolbar>
            <ToolbarButton
                icon={<span aria-hidden='true'>◆</span>}
                title='Select'
                active={activeTool === 'select'}
                onClick={() => setActiveTool('select')}
            />
            <ToolbarButton
                icon={<span aria-hidden='true'>◆</span>}
                title='Draw'
                active={activeTool === 'draw'}
                onClick={() => setActiveTool('draw')}
            />
        </Toolbar>
    );
}
```
