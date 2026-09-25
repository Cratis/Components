---
title: ObjectNavigationalBar
description: Navigate hierarchical objects with a controlled breadcrumb bar and back action.
---

The `ObjectNavigationalBar` component provides breadcrumb navigation for hierarchical data structures.

ObjectNavigationalBar belongs to the [Advanced React capability profile](../ui-foundation.md#capability-profiles) — a specialized, React-only surface with no Pixi dependency and no separate peer to install. It is a fully controlled component: `navigationPath` and `onNavigate` are its entire state contract, so the host application owns navigation state, persistence, and the data at each path segment.

## Purpose

ObjectNavigationalBar displays the current navigation path and allows users to jump to any level in the hierarchy with clickable breadcrumbs.

## Key Features

- Breadcrumb trail display
- Click navigation to any level
- Back button for going up one level
- Visual separation of path segments
- Root indicator
- Current location highlighting

## Quick Start

```tsx
import { useState } from 'react';
import { ObjectNavigationalBar } from '@cratis/components/ObjectNavigationalBar';

export function MyNavigator() {
    const [path, setPath] = useState<string[]>(['profile', 'address']);

    return (
        <ObjectNavigationalBar
            navigationPath={path}
            onNavigate={(index) => setPath(path.slice(0, index))}
        />
    );
}
```

The bar shows `Root > profile > address` with a back button. `path.slice(0, index)` covers every case: `0` returns to the root, and the index of the current segment leaves the path unchanged.

## Props

### Required Props

- `navigationPath`: Array of strings representing the current path. `[]` is the root, `['profile']` is one level deep, and `['profile', 'address', 'city']` is three levels deep.
- `onNavigate`: Callback invoked for a breadcrumb or back-button activation. It receives the destination index (`0` means root).

### Optional Props

- `backLabel`: Tooltip and accessible name of the back button. Defaults to `'Navigate back'`; override it to localize.
- `className`: Extra class names on the root, which always has the `cratis-object-navigational-bar` class.

The "Root" label and the `>` separators are fixed English text; there is no prop to change them.

## Visual Display

### Empty Path (Root)

```text
[←] Root
```

### One Level Deep

```text
[←] Root > profile
```

### Multiple Levels

```text
[←] Root > profile > address > city
```

## Navigation Behavior

### Back Button

The back arrow button `[←]`:

- Goes up one level
- Disabled when at root
- Calls `onNavigate` with `index = navigationPath.length - 1`

### Breadcrumb Segments

Each segment in the path:

- Root is always shown
- Every segment, including Root and the current one, is a button
- Segments before the current one are underlined; the current segment is not, and carries `aria-current='location'`
- Click calls `onNavigate` with segment's index
- A segment made only of digits is shown as an array index in brackets: `'0'` is shown as `[0]`

### Index Mapping

```text
navigationPath = ['profile', 'address', 'city']

Breadcrumb display:
Root     (index: 0)
profile  (index: 1)
address  (index: 2)
city     (index: 3)  ← current location
```

## Complete Example

```tsx
import { useState } from 'react';
import { ObjectNavigationalBar } from '@cratis/components/ObjectNavigationalBar';

type DataNode = { [key: string]: DataNode };

const tree: DataNode = {
    documents: {
        work: { reports: {} },
        personal: {},
    },
    photos: {},
};

export function FolderNavigator() {
    const [navigationPath, setNavigationPath] = useState<string[]>([]);

    let current: DataNode = tree;
    for (const segment of navigationPath) {
        current = current[segment];
    }

    return (
        <div>
            <ObjectNavigationalBar
                navigationPath={navigationPath}
                onNavigate={(index) => setNavigationPath(navigationPath.slice(0, index))}
                backLabel='Up one level'
            />
            <ul>
                {Object.keys(current).map((key) => (
                    <li key={key}>
                        <button
                            type='button'
                            onClick={() => setNavigationPath([...navigationPath, key])}
                        >
                            {key}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
```

The host owns both the path and the data: the bar only reports where the user wants to go.

## Example Scenarios

### Navigate to Root

```typescript
// From: Root > profile > address > city
onNavigate(0);
// Result: Root (path = [])
```

### Navigate to Middle Level

```typescript
// From: Root > profile > address > city
onNavigate(2); // Click on "address"
// Result: Root > profile > address (path = ['profile', 'address'])
```

### Navigate Back One Level

```typescript
// From: Root > profile > address > city
onNavigate(navigationPath.length - 1); // Back button
// Result: Root > profile > address (path = ['profile', 'address'])
```

## Styling

The root has the `cratis-object-navigational-bar` class and a bottom border in `--cratis-surface-border`. The breadcrumb text uses `--cratis-text-color-secondary`, and the back button is a small ghost `Button` from Common.

Customize it through the tokens, or target the root class or your own `className` in product CSS:

```css
.cratis-object-navigational-bar {
    border-bottom-color: var(--cratis-primary-color);
}
```

Load its CSS through `@cratis/components/styles` or `@cratis/components/ObjectNavigationalBar/styles`.

## Use Cases

- **Object exploration**: Navigate through nested JSON objects
- **File system UI**: Browse folder hierarchies
- **Configuration trees**: Navigate settings hierarchies
- **Product categories**: Browse category trees
- **Organization charts**: Navigate organizational structures
- **Data viewers**: Show location within complex data

## Integration

Commonly used with:

- **ObjectContentEditor**: renders an `ObjectNavigationalBar` internally for its own nested navigation
- **Custom data viewers**: Any hierarchical data display

SchemaEditor has its own breadcrumb and does not use this component.

## Best Practices

1. **Keep paths meaningful**: Use descriptive segment names
2. **Limit depth**: Deep hierarchies (5+ levels) are hard to navigate
3. **Show current data**: Display relevant content for current path
4. **Handle edge cases**: Empty paths, invalid navigation
5. **Provide visual feedback**: Highlight current location
6. **Add product shortcuts explicitly**: If the product needs arrow-key or escape navigation, implement and document it in the host
7. **Persist state**: Remember navigation path across sessions when the product requires it

## Keyboard Support

`ObjectNavigationalBar` renders the back control and every breadcrumb as native buttons. Keyboard users reach them with `Tab` / `Shift+Tab` and activate them with `Enter` or `Space`. The component does not install global `Escape`, `Backspace`, or arrow-key shortcuts; a host that adds those shortcuts owns their scope and conflict handling.

## Accessibility

- The back button has a localizable `backLabel` used as its tooltip and accessible name
- The back button is disabled at the root
- Breadcrumbs render as buttons and mark the current location with `aria-current='location'`
- Native button keyboard behavior provides activation without component-specific shortcuts
