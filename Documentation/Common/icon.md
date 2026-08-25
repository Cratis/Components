# Icon

The `Icon` type and `IconDisplay` component let Cratis controls render either a React icon node or a complete consumer-owned icon-font CSS class. Components does not install an icon font, infer a provider, or add provider-specific base classes.

Prefer React nodes for portable component-library code:

```tsx
import { FaHouse } from 'react-icons/fa6';
import { IconDisplay } from '@cratis/components/Common';

<IconDisplay icon={<FaHouse aria-hidden='true' />} />
```

## Icon type

```tsx
import type { Icon } from '@cratis/components/Common';
import { FaHouse } from 'react-icons/fa6';

const reactIcon: Icon = <FaHouse aria-hidden='true' />;
const productFontIcon: Icon = 'product-icons product-home';
```

A string is passed to an `<i>` element unchanged apart from trimming whitespace. The consuming product must load the stylesheet and supply every class required by its icon provider.

## IconDisplay

```tsx
import { IconDisplay } from '@cratis/components/Common';

// The product owns the product-icons stylesheet.
<IconDisplay icon='product-icons product-home' className='text-2xl' />
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `icon` | `Icon` | ✅ | React node or complete consumer-owned CSS class string. |
| `className` | `string` | — | Extra classes for the `<i>` element used by string icons. It does not wrap React nodes. |

## Toolbar icons

`ToolbarButton`, `ToolbarFanOutItem`, and `ToolbarFolder` accept `Icon` directly:

```tsx
import { FaArrowPointer, FaPencil, FaShapes, FaVectorSquare } from 'react-icons/fa6';
import { Toolbar, ToolbarButton, ToolbarFanOutItem } from '@cratis/components/Toolbar';

<Toolbar>
    <ToolbarButton icon={<FaArrowPointer />} title='Select' />
    <ToolbarButton icon={<FaPencil />} title='Draw' />
    <ToolbarFanOutItem icon={<FaShapes />} tooltip='Shapes'>
        <ToolbarButton icon={<FaVectorSquare />} title='Rectangle' />
    </ToolbarFanOutItem>
</Toolbar>
```

Not every API named `icon` has the same shape. For example, `DataPage.MenuItem.icon` is a React component type because the page instantiates it. Follow the type exported by the specific component rather than assuming every icon-bearing API accepts `Icon`.
