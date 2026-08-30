# Multiple Toolbar Groups

Render multiple `Toolbar` instances to create separate groups, matching the style of canvas-based tools panels:

```tsx
<div className='flex flex-col gap-2'>
    <Toolbar>
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Select' />
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Draw' />
    </Toolbar>
    <Toolbar>
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Undo' />
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Redo' />
    </Toolbar>
</div>
```
