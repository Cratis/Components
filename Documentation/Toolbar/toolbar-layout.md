# Toolbar Layout

`ToolbarLayout` is a named, transparent region inside a `Toolbar` that enables decoupled, dynamically swappable toolbar content. Unlike `ToolbarGroup`, it carries no visual container of its own — the injected content brings its own `ToolbarGroup` pills, `ToolbarSection` context switchers, and `ToolbarSeparator` dividers.

The key capability: any component in the React tree can inject a complete toolbar layout — multiple groups, sections, and separators — into a named region without prop drilling. The injection is coordinated by the `ToolbarSlotProvider`.

## When to use `ToolbarLayout` vs `ToolbarGroup`

| | `ToolbarGroup` | `ToolbarLayout` |
|---|---|---|
| Visual container | Yes — renders as a pill | No — transparent pass-through |
| Slot content | Appended to its own children | Replaces fallback children |
| Intended content | Individual buttons | Complete toolbar structures (groups, sections, separators) |
| Use case | Cluster related buttons | Entire swappable toolbar regions |

## Quick Start

Wrap the toolbar and the contributing components in a `ToolbarSlotProvider`. Give `ToolbarLayout` a `name` prop that external components match in their `ToolbarSlot`:

```tsx
import { ToolbarSlotProvider, ToolbarSlot } from '@cratis/components/Toolbar';

export const AppShell = () => (
    <ToolbarSlotProvider>
        <Toolbar>
            <ToolbarButton icon='pi pi-arrow-up-left' title='Select' />
            <ToolbarLayout name='canvas-tools'>
                {/* Fallback — shown when no slot content is registered */}
                <ToolbarGroup>
                    <ToolbarButton icon='pi pi-pencil' title='Draw (default)' />
                </ToolbarGroup>
            </ToolbarLayout>
        </Toolbar>

        <CanvasFeature />
    </ToolbarSlotProvider>
);

// Anywhere in the tree — injects a complete multi-group layout:
const CanvasFeature = () => {
    const content = useMemo(() => (
        <>
            <ToolbarGroup>
                <ToolbarButton icon='pi pi-star' title='Favorite' />
                <ToolbarButton icon='pi pi-heart' title='Like' />
            </ToolbarGroup>
            <ToolbarSeparator />
            <ToolbarGroup>
                <ToolbarButton icon='pi pi-bolt' title='Quick action' />
            </ToolbarGroup>
        </>
    ), []);

    return <ToolbarSlot slotName='canvas-tools' order={0}>{content}</ToolbarSlot>;
};
```

## Fallback Children

The `children` prop provides default content rendered when no slot content has been registered. As soon as any `ToolbarSlot` with a matching `slotName` mounts, the slot content replaces the fallback completely.

If the layout region has no meaningful default, omit `children` entirely — `ToolbarLayout` renders nothing when both its slot and its children are empty:

```tsx
{/* No fallback — layout is invisible until a feature registers */}
<ToolbarLayout name='mode-tools' />
```

## Multiple Contributors

Multiple components can each register a `ToolbarSlot` with the same `slotName`. The `order` prop on each slot controls the render order (lower values appear first):

```tsx
// Feature A — appears first
<ToolbarSlot slotName='shared-tools' order={10}>
    <ToolbarGroup>
        <ToolbarButton icon='pi pi-star' title='Feature A' />
    </ToolbarGroup>
</ToolbarSlot>

// Feature B — appears second
<ToolbarSlot slotName='shared-tools' order={20}>
    <>
        <ToolbarSeparator />
        <ToolbarGroup>
            <ToolbarButton icon='pi pi-cog' title='Feature B' />
        </ToolbarGroup>
    </>
</ToolbarSlot>
```

## Context-Sensitive Layouts

A common pattern is to render a different slot content based on the active application mode. Mount and unmount (or swap the children of) a single `ToolbarSlot` as the mode changes:

```tsx
const modeContent = {
    draw: <DrawingTools />,
    text: <TextTools />,
    shape: <ShapeTools />,
};

// The ToolbarLayout region updates automatically as activeMode changes:
<ToolbarSlot slotName='mode-tools' order={0}>
    {modeContent[activeMode]}
</ToolbarSlot>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | required | Identifies the layout region. Match this in `ToolbarSlot` `slotName`. |
| `children` | `ReactNode` | — | Fallback content shown when no slot content is registered. |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Layout direction — should match the parent `Toolbar`. |

## Related

- [Slots](slots.md) — the slot system that powers `ToolbarLayout`
- [Groups](groups.md) — `ToolbarGroup` for visually contained button clusters
- [Context Switching](context-switching.md) — `ToolbarSection` for animated context changes within a slot
