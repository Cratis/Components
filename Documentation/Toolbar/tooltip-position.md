# Tooltip Position

Both `ToolbarButton` and `ToolbarFanOutItem` default to showing tooltips on the `right`. Use `tooltipPosition` to override:

```tsx
<ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Settings' tooltipPosition='bottom' />
```

Valid values are `'top'`, `'right'`, `'bottom'`, and `'left'`.
