# ObjectNavigationalBar

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

```typescript
import { ObjectNavigationalBar } from '@cratis/components/ObjectNavigationalBar';

function MyNavigator() {
    const [path, setPath] = useState<string[]>(['profile', 'address']);

    const handleNavigate = (index: number) => {
        if (index === 0) {
            setPath([]);  // Navigate to root
        } else {
            setPath(path.slice(0, index));  // Navigate to specific level
        }
    };

    return (
        <ObjectNavigationalBar
            navigationPath={path}
            onNavigate={handleNavigate}
        />
    );
}
```

## Props

### Required Props

- `navigationPath`: Array of strings representing the current path. `[]` is the root, `['profile']` is one level deep, and `['profile', 'address', 'city']` is three levels deep.
- `onNavigate`: Callback invoked for a breadcrumb or back-button activation. It receives the destination index (`0` means root).

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
- Intermediate segments are clickable and underlined
- Current segment (last) is not underlined
- Click calls `onNavigate` with segment's index

### Index Mapping

```typescript
navigationPath = ['profile', 'address', 'city']

// Breadcrumb display:
Root (index: 0)
profile (index: 1)
address (index: 2)
city (index: 3)  ← current location
```

## Complete Example

```typescript
import { ObjectNavigationalBar } from '@cratis/components/ObjectNavigationalBar';
import { useState } from 'react';

interface DataNode {
    [key: string]: unknown;
}

function FileSystemNavigator() {
    const [navigationPath, setNavigationPath] = useState<string[]>([]);

    const data: DataNode = {
        documents: {
            work: {
                reports: {
                    '2024': { /* ... */ }
                }
            },
            personal: { /* ... */ }
        },
        photos: { /* ... */ }
    };

    const handleNavigate = (index: number) => {
        if (index === 0) {
            // Navigate to root
            setNavigationPath([]);
        } else {
            // Navigate to specific level
            setNavigationPath(navigationPath.slice(0, index));
        }
    };

    const navigateInto = (key: string) => {
        setNavigationPath([...navigationPath, key]);
    };

    // Get current data at path
    let currentData: DataNode = data;
    for (const segment of navigationPath) {
        currentData = currentData[segment] as DataNode;
    }

    return (
        <div>
            <ObjectNavigationalBar
                navigationPath={navigationPath}
                onNavigate={handleNavigate}
            />

            <div>
                <h3>Current Location Contents:</h3>
                {Object.keys(currentData).map(key => (
                    <button key={key} onClick={() => navigateInto(key)}>
                        {key}
                    </button>
                ))}
            </div>
        </div>
    );
}
```

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

The component uses Cratis tokens and stable parts:

- Border at bottom
- Surface border color
- Text color for secondary content
- Button styling for back arrow
- Spacing and padding

Customize via CSS:

```css
.px-4.py-2.mb-2.border-bottom-1 {
    /* Override container styles */
}
```

## Use Cases

- **Object exploration**: Navigate through nested JSON objects
- **File system UI**: Browse folder hierarchies
- **Configuration trees**: Navigate settings hierarchies
- **Product categories**: Browse category trees
- **Organization charts**: Navigate organizational structures
- **Data viewers**: Show location within complex data

## Integration

Commonly used with:

- **ObjectContentEditor**: Provides navigation for the editor
- **SchemaEditor**: Navigate schema hierarchies
- **Custom data viewers**: Any hierarchical data display

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
