# Icon

The `Icon` type and `IconDisplay` component provide a unified way to pass icons throughout the component library. Any component that accepts an icon can receive either a PrimeIcons CSS class string or any React node.

## Icon Type

```ts
import type { Icon } from '@cratis/components/Common';

// A PrimeIcons (or other icon-font) CSS class string
const stringIcon: Icon = 'pi pi-home';

// Any React node — SVG component, third-party icon, emoji wrapper, …
const nodeIcon: Icon = <MyCustomSvgIcon />;
```

## IconDisplay Component

`IconDisplay` renders an `Icon` value:

- A non-empty **string** is treated as a CSS class and rendered as `<i className={...} />`.
- Any other value (**React node**) is rendered as-is.

```tsx
import { IconDisplay } from '@cratis/components/Common';

// Renders: <i className="pi pi-home text-2xl" />
<IconDisplay icon='pi pi-home' className='text-2xl' />

// Renders the SVG element directly
<IconDisplay icon={<MyHomeIcon />} />
```

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `icon` | `Icon` | ✅ | The icon to render — a CSS class string or a React node. |
| `className` | `string` | — | Extra CSS classes added to the `<i>` wrapper when `icon` is a string. Has no effect for React node icons. |

## Using ReactNode Icons in Toolbar Components

`ToolbarButton` and `ToolbarFanOutItem` both accept `Icon` for their `icon` prop. String-based usage is unchanged:

```tsx
import { Toolbar, ToolbarButton, ToolbarFanOutItem } from '@cratis/components/Toolbar';
import { FaPencil, FaShapes } from 'react-icons/fa6';

function MyToolbar() {
    return (
        <Toolbar>
            {/* String — existing usage unchanged */}
            <ToolbarButton icon='pi pi-arrow-up-left' tooltip='Select' />

            {/* ReactNode — third-party icon component */}
            <ToolbarButton icon={<FaPencil />} tooltip='Draw' />

            {/* ReactNode — fan-out trigger */}
            <ToolbarFanOutItem icon={<FaShapes />} tooltip='Shapes'>
                <ToolbarButton icon='pi pi-stop' tooltip='Rectangle' />
                <ToolbarButton icon='pi pi-circle' tooltip='Circle' />
            </ToolbarFanOutItem>
        </Toolbar>
    );
}
```
