# Fan-Out Sub-Panel

`ToolbarFanOutItem` replaces a regular button with one that slides out a horizontal panel of additional tools when clicked. The panel closes when clicking the button again or anywhere outside it.

```tsx
<Toolbar>
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Select' />
    <ToolbarFanOutItem icon={<span aria-hidden='true'>◆</span>} tooltip='Shapes'>
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Rectangle' />
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Circle' />
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Line' />
    </ToolbarFanOutItem>
</Toolbar>
```

By default the panel fans out to the right. Use `fanOutDirection='left'` when the toolbar is positioned on the right side of the screen:

```tsx
<ToolbarFanOutItem icon={<span aria-hidden='true'>◆</span>} tooltip='Shapes' fanOutDirection='left'>
    ...
</ToolbarFanOutItem>
```

You can also fan out vertically:

```tsx
<ToolbarFanOutItem icon={<span aria-hidden='true'>◆</span>} tooltip='Shapes' fanOutDirection='up'>
    ...
</ToolbarFanOutItem>

<ToolbarFanOutItem icon={<span aria-hidden='true'>◆</span>} tooltip='Shapes' fanOutDirection='down'>
    ...
</ToolbarFanOutItem>
```

## ReactNode Icons

Like `ToolbarButton`, the `icon` prop accepts a `string | ReactNode`. Pass any React element as the trigger icon:

```tsx
import { FaShapes } from 'react-icons/fa6';

<ToolbarFanOutItem icon={<FaShapes />} tooltip='Shapes'>
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Rectangle' />
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Circle' />
</ToolbarFanOutItem>
```

See [Icon](../Common/icon.md) for the shared `Icon` type and `IconDisplay` component.
