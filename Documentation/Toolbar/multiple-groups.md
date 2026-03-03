# Multiple Toolbar Groups

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
