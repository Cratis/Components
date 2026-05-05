# Multiple Toolbar Groups

Render multiple `Toolbar` instances to create separate groups, matching the style of canvas-based tools panels:

```tsx
<div className='flex flex-col gap-2'>
    <Toolbar>
        <ToolbarButton icon='pi pi-arrow-up-left' title='Select' />
        <ToolbarButton icon='pi pi-pencil' title='Draw' />
    </Toolbar>
    <Toolbar>
        <ToolbarButton icon='pi pi-undo' title='Undo' />
        <ToolbarButton icon='pi pi-refresh' title='Redo' />
    </Toolbar>
</div>
```
