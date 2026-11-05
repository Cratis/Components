---
title: Toolbar layout regions for feature tools
description: Replace a named toolbar region with feature-owned groups and separators using ToolbarLayout, with fallback content when no feature contributes.
---

Use `ToolbarLayout` in Cratis Components when a feature needs to supply a whole toolbar region, not just add a button to an existing group. The shell reserves a named region; the feature supplies its groups and separators through a matching `ToolbarSlot` inside the same `ToolbarSlotProvider`.

The layout adds no visible container of its own. Its content supplies the visual structure through `ToolbarGroup`, `ToolbarSection`, and `ToolbarSeparator`. Keep shared actions outside the region so changing features does not replace them.

## When to use `ToolbarLayout` vs `ToolbarGroup`

|                  | `ToolbarGroup`               | `ToolbarLayout`                                            |
| ---------------- | ---------------------------- | ---------------------------------------------------------- |
| Visual container | Yes — renders as a pill      | No — transparent pass-through                              |
| Slot content     | Appended to its own children | Replaces fallback children                                 |
| Intended content | Individual buttons           | Complete toolbar structures (groups, sections, separators) |
| Use case         | Cluster related buttons      | Entire swappable toolbar regions                           |

## Quick Start

Wrap the toolbar and contributing features in one `ToolbarSlotProvider`. Give the layout a `name` that the feature matches with `ToolbarSlot`'s `slotName`. Here, Select stays in the shell. The feature replaces the default Draw group with two groups and a separator:

```tsx
import { useMemo } from 'react';
import {
    Toolbar,
    ToolbarButton,
    ToolbarGroup,
    ToolbarLayout,
    ToolbarSeparator,
    ToolbarSlot,
    ToolbarSlotProvider,
} from '@cratis/components/Toolbar';

export const AppShell = () => (
    <ToolbarSlotProvider>
        <Toolbar>
            <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Select' />
            <ToolbarLayout name='canvas-tools'>
                {/* Fallback — shown when no slot content is registered */}
                <ToolbarGroup>
                    <ToolbarButton
                        icon={<span aria-hidden='true'>◆</span>}
                        title='Draw (default)'
                    />
                </ToolbarGroup>
            </ToolbarLayout>
        </Toolbar>

        <CanvasFeature />
    </ToolbarSlotProvider>
);

// Anywhere in the tree — injects a complete multi-group layout:
const CanvasFeature = () => {
    const content = useMemo(
        () => (
            <>
                <ToolbarGroup>
                    <ToolbarButton
                        icon={<span aria-hidden='true'>◆</span>}
                        title='Favorite'
                    />
                    <ToolbarButton
                        icon={<span aria-hidden='true'>◆</span>}
                        title='Like'
                    />
                </ToolbarGroup>
                <ToolbarSeparator />
                <ToolbarGroup>
                    <ToolbarButton
                        icon={<span aria-hidden='true'>◆</span>}
                        title='Quick action'
                    />
                </ToolbarGroup>
            </>
        ),
        [],
    );

    return (
        <ToolbarSlot slotName='canvas-tools' order={0}>
            {content}
        </ToolbarSlot>
    );
};
```

## Fallback Children

The `children` prop supplies fallback content when no matching slot is registered. A matching registration replaces the fallback, rather than appending to it. When the last contributor unmounts, the fallback returns. All of these registrations must belong to the same provider as the layout.

Even a registered slot with `null` children suppresses the fallback. To restore the default, unmount the contributing `ToolbarSlot` instead of leaving it mounted with empty content.

If the region has no meaningful default, omit `children`. With no matching registrations and no fallback, `ToolbarLayout` renders nothing:

```tsx
{/* No fallback: the layout is invisible until a feature registers */}
<ToolbarLayout name='mode-tools' />
```

## Multiple Contributors

A matching slot does not claim exclusive ownership of the region. All contributors to that name render together, sorted by `order` with lower values first. Use distinct order values when their sequence matters, and coordinate group and separator boundaries between features:

```tsx
// Feature A — appears first
<ToolbarSlot slotName='shared-tools' order={10}>
    <ToolbarGroup>
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Feature A' />
    </ToolbarGroup>
</ToolbarSlot>

// Feature B — appears second
<ToolbarSlot slotName='shared-tools' order={20}>
    <>
        <ToolbarSeparator />
        <ToolbarGroup>
            <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Feature B' />
        </ToolbarGroup>
    </>
</ToolbarSlot>
```

## Context-Sensitive Layouts

When one feature controls the region, swap the children of a single `ToolbarSlot` as the application mode changes. Mount or unmount the slot itself when the feature becomes available or leaves the screen. `DrawingTools`, `TextTools`, and `ShapeTools` below stand for your components that return toolbar groups; `activeMode` is your application state:

```tsx
const modeContent = {
    draw: <DrawingTools />,
    text: <TextTools />,
    shape: <ShapeTools />,
};

// The ToolbarLayout region updates automatically as activeMode changes:
<ToolbarSlot slotName='mode-tools' order={0}>
    {modeContent[activeMode]}
</ToolbarSlot>;
```

The layout cross-fades old and new content and resizes to fit. Outgoing content is `inert` and `aria-hidden` during its exit, then unmounts. The layout does not move focus to an incoming tool, so handle focus in your application if the replaced region contained the focused control.

Use [context switching](context-switching.md) instead when you want named tool sets to stay mounted while inactive. For a horizontal toolbar, pass `orientation='horizontal'` to the layout as well so its groups follow the same direction.

## Props

| Prop          | Type                         | Default      | Description                                                           |
| ------------- | ---------------------------- | ------------ | --------------------------------------------------------------------- |
| `name`        | `string`                     | required     | Identifies the layout region. Match this in `ToolbarSlot` `slotName`. |
| `children`    | `ReactNode`                  | —            | Fallback content shown when no slot content is registered.            |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Layout direction — should match the parent `Toolbar`.                 |

## Related

- [Slots](slots.md) — the slot system that powers `ToolbarLayout`
- [Groups](groups.md) — `ToolbarGroup` for visually contained button clusters
- [Context Switching](context-switching.md) — `ToolbarSection` for animated context changes within a slot
