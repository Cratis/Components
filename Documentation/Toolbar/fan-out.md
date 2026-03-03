# Fan-Out Sub-Panel

`ToolbarFanOutItem` replaces a regular button with one that slides out a horizontal panel of additional tools when clicked. The panel closes when clicking the button again or anywhere outside it.

```tsx
<Toolbar>
    <ToolbarButton icon='pi pi-arrow-up-left' tooltip='Select' />
    <ToolbarFanOutItem icon='pi pi-th-large' tooltip='Shapes'>
        <ToolbarButton icon='pi pi-stop' tooltip='Rectangle' />
        <ToolbarButton icon='pi pi-circle' tooltip='Circle' />
        <ToolbarButton icon='pi pi-minus' tooltip='Line' />
    </ToolbarFanOutItem>
</Toolbar>
```

By default the panel fans out to the right. Use `fanOutDirection='left'` when the toolbar is positioned on the right side of the screen:

```tsx
<ToolbarFanOutItem icon='pi pi-th-large' tooltip='Shapes' fanOutDirection='left'>
    ...
</ToolbarFanOutItem>
```
