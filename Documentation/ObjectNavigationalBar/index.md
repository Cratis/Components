---
title: ObjectNavigationalBar — navigate nested object paths
description: Use ObjectNavigationalBar to navigate nested object paths in React, map breadcrumb indexes to state, and handle back navigation at the root.
---

`ObjectNavigationalBar` lets users return to a parent or the root while exploring a nested object in React. You supply the current property path and update it when a breadcrumb or back button is clicked; the bar displays that path but does not read or change the object.

It belongs to the [Advanced React capability profile](../ui-foundation.md#capability-profiles) and needs no Pixi dependency. As a controlled component, it keeps navigation state in your application through `navigationPath` and `onNavigate`. Your application also owns the data at each location and any saved navigation state.

## Purpose

When a view shows one nested object at a time, users need a way back to the surrounding data. The bar keeps the route visible and lets them jump to any parent without retracing every step. Use it above your own object view, or use [ObjectContentEditor](../ObjectContentEditor/index.md), which already includes it.

## Key Features

The trail starts with `Root` and adds one breadcrumb for each path segment, separated by `>`. Clicking a breadcrumb requests that location; the back arrow requests the immediate parent. Earlier locations are underlined, while the current location is marked with `aria-current='location'`.

## Quick Start

With the [Components setup](../getting-started.mdx) in place, keep the path in React state and slice it to the destination index reported by the bar:

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

The bar initially shows `Root > profile > address`. Clicking `profile` reports `1`, so `path.slice(0, index)` keeps `['profile']`. Clicking `Root` reports `0` and clears the path; clicking the current `address` reports `2` and leaves it unchanged. Use the same path to choose which data your view displays, so the content and breadcrumbs move together.

## Props

### Required Props

- `navigationPath: string[]`: Ordered property keys representing the current path. `[]` is the root, `['profile']` is one level deep, and `['profile', 'address', 'city']` is three levels deep.
- `onNavigate: (index: number) => void`: Callback invoked for a breadcrumb or back-button activation. Its destination index is the number of path segments to keep (`0` means root).

### Optional Props

- `backLabel: string`: Tooltip and accessible name of the back button. Defaults to `'Navigate back'`; override it to localize.
- `className: string`: Extra class names on the root, which always has the `cratis-object-navigational-bar` class. Omitted by default.

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

For a path with `n` segments, the arrow calls `onNavigate(n - 1)`. Your handler removes the last segment by keeping that many entries. This action moves up the supplied object path, not through browser history.

At `navigationPath={[]}`, the arrow is disabled and the trail contains only `Root`. Clicking that breadcrumb still calls `onNavigate(0)`, so the handler should leave the path empty.

### Breadcrumb Segments

Every location, including `Root` and the current one, is a button. Clicking the current location reports the full path length, so slicing to that index leaves the path unchanged.

Property names appear as supplied. A segment made only of digits, such as `'0'`, appears as `[0]` to indicate an array element. This is a display convention: the bar does not inspect the data to distinguish an array index from a numeric property name.

### Index Mapping

The destination index is a path length, not a zero-based position in `navigationPath`. Pass it directly to `slice(0, index)` without adding or subtracting one:

```text
navigationPath = ['profile', 'address', 'city']

Breadcrumb display:
Root     (index: 0)
profile  (index: 1)
address  (index: 2)
city     (index: 3)  ← current location
```

## Complete Example

This folder view opens a child by appending its key to the path. Its breadcrumb handler uses the same state to return to a parent:

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

Click `documents`, then `work`: the view shows a `reports` button, while the bar shows `Root > documents > work`. Click `documents` in the bar to return to its folders, then `Root` to restore the top-level `documents` and `photos` buttons. At that point the arrow is disabled.

The bar only reports where the user wants to go. The path update makes React render both the new breadcrumbs and the folder contents.

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

Load its CSS through `@cratis/components/styles` or `@cratis/components/ObjectNavigationalBar/styles`. The latter also requires the base stylesheet; follow [Per-area stylesheets](../Styling/per-area-stylesheets.md) for that setup.

## Use Cases

Use the bar in a JSON viewer or object inspector when opening a nested property replaces the current view. It also fits folder or configuration trees when your application can represent each location as a sequence of keys. Your view owns opening a child; the bar provides the route back.

## Integration

If you need a ready-made object view with this navigation, continue with [ObjectContentEditor](../ObjectContentEditor/index.md). For a custom viewer, keep one path state for both the bar and the displayed content, as in the example above. [SchemaEditor](../SchemaEditor/index.md) is a separate choice for editing JSON Schema hierarchies; it has its own breadcrumb and does not use this component.

## Best Practices

Supply the complete key path, even for deeply nested data. Removing middle segments to shorten the trail also changes destination indexes and breaks the mapping to your object. The bar has no separate display-label or truncation prop.

When your application replaces the object, check that the current path still resolves and reset it to `[]` if necessary. The bar receives only the path, so it cannot detect removed properties. If you persist a location, validate it against the data before restoring it.

## Keyboard Support

`ObjectNavigationalBar` renders the back control and every breadcrumb as native buttons. Keyboard users reach them with `Tab` / `Shift+Tab` and activate them with `Enter` or `Space`. The component does not install global `Escape`, `Backspace`, or arrow-key shortcuts; a host that adds those shortcuts owns their scope and conflict handling.

## Accessibility

- The back button has a localizable `backLabel` used as its tooltip and accessible name
- The back button is disabled at the root
- Breadcrumbs render as buttons and mark the current location with `aria-current='location'`
- Native button keyboard behavior provides activation without component-specific shortcuts
