---
title: Toolbar
description: Build canvas-style tool palettes with groups, contexts, slots, folders, and fan-out panels.
---

The `Toolbar` component provides a canvas-style icon toolbar with support for orientations, active states, animated context switching, separators, fan-out sub-panels, and drag & drop onto surfaces.

Toolbar belongs to the [Advanced React capability profile](../ui-foundation.md#capability-profiles) — a specialized, React-only surface with no Pixi dependency, despite its canvas-adjacent purpose.

**`Toolbar` is not a default page action row.** It is built for a canvas/tool-palette interaction — active tools, groups, slots, folders, and fan-out panels — not for an ordinary page's list of commands. `DataPage`'s built-in action row renders [`ActionMenubar`](../Common/action-menubar.md) (from `@cratis/components/Common`), not `Toolbar`. Reach for `ActionMenubar`, or a product-owned action row, for flat page-level actions; reach for `Toolbar` only when the surface is genuinely a spatial tool palette. See [Choosing a component: Actions and tool palettes](../choosing-a-component.md#actions-and-tool-palettes).

Pass React icon nodes or product-owned SVGs for a dependency-free toolbar. Consumer-owned icon-font class strings remain accepted, but Components does not install an icon font or infer provider base classes; the product must load the matching stylesheet and pass the complete class string.

Import every Toolbar component from its subpath:

```tsx
import { Toolbar, ToolbarButton } from '@cratis/components/Toolbar';
```

## Keyboard and accessibility

- The root renders `role='toolbar'`, `aria-orientation`, and an accessible name. The name falls back to the provider's `messages.toolbar.label`, then `Tools`; pass `aria-label` or `aria-labelledby` to name each toolbar.
- Every `ToolbarButton`, folder trigger, and fan-out trigger is a native `button` and its own Tab stop. The toolbar does not implement arrow-key navigation between tools.
- `title` is required on `ToolbarButton` and `ToolbarFolder`, and `tooltip` on `ToolbarFanOutItem`. That text becomes the button's `aria-label` and its tooltip, which appears on hover and on keyboard focus.
- `active` is a visual and styling state (`data-active`, `data-selected`). It sets no `aria-pressed`; see [Active state](active-state.md) for how to expose it.
- Folder and fan-out triggers expose `aria-expanded` and `aria-controls`. Their panels close on Escape or a pointer press outside, return focus to their trigger after Escape, and are `inert` and `aria-hidden` while collapsed.
- Toolbar, folder, fan-out, and context transitions are suppressed under `prefers-reduced-motion: reduce`.

## Components

| Component             | Description                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| `Toolbar`             | Container that groups toolbar buttons into a pill-shaped bar                                         |
| `ToolbarButton`       | Button that renders non-empty `text` or otherwise an `icon`, with a hover tooltip                    |
| `ToolbarSeparator`    | Visual divider that separates groups of buttons                                                      |
| `ToolbarSection`      | Section within a toolbar that animates between named contexts                                        |
| `ToolbarContext`      | Named context (set of buttons) inside a `ToolbarSection`                                             |
| `ToolbarFanOutItem`   | Button that slides out a horizontal sub-panel on click                                               |
| `ToolbarFolder`       | Button that reveals a dynamically sized grid of buttons on click                                     |
| `ToolbarGroup`        | Logical sub-group of toolbar items, rendered as its own pill with a gap between adjacent groups      |
| `ToolbarSlotProvider` | Context provider that enables the slot system — wrap the application root or a feature boundary      |
| `ToolbarSlot`         | Renders nothing itself; injects its `children` into the named slot at the given `order` position     |
| `ToolbarLayout`       | Named layout boundary that swaps default content for matching slot content                           |

## Stable composition and measurement parts

Deeply styled products should measure and select Toolbar structure through typed `pt` surfaces and `data-cratis-part`, not implementation class names.

| Component           | Type                    | `pt` key → `data-cratis-part`                                                                                   |
| ------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `Toolbar`           | `ToolbarParts`          | `root` → `root`                                                                                                 |
| `ToolbarButton`     | `ToolbarButtonParts`    | `root` → `button`; `icon` → `icon`; `label` → `label`                                                           |
| `ToolbarGroup`      | `ToolbarGroupParts`     | `root` → `toolbar-group`; `slot` → `toolbar-slot`; `incoming` → `toolbar-slot-incoming`; `outgoing` → `toolbar-slot-outgoing`  |
| `ToolbarSeparator`  | `ToolbarSeparatorParts` | `root` → `toolbar-separator`                                                                                    |
| `ToolbarLayout`     | `ToolbarLayoutParts`    | `root` → `toolbar-layout`; `slot` → `toolbar-slot`; `incoming` → `toolbar-slot-incoming`; `outgoing` → `toolbar-slot-outgoing` |
| `ToolbarSection`    | `ToolbarSectionParts`   | `root` → `toolbar-section`; `context` → `toolbar-context`                                                       |
| `ToolbarFolder`     | `ToolbarFolderParts`    | `root` → `toolbar-folder`; `trigger` → `toolbar-folder-trigger`; `panel` → `toolbar-folder-panel`               |
| `ToolbarFanOutItem` | `ToolbarFanOutParts`    | `root` → `fanout-root`; `trigger` → `fanout-trigger`; `panel` → `fanout-panel`                                  |

The active tool, active context, and an open folder or fan-out also carry the canonical `data-selected` or `data-open` state. Contexts expose `data-context-name` and `data-active`; sections and slots expose `data-transitioning`. Folder and fan-out panels expose `data-expanded` and `data-direction`; fan-out also exposes `data-settled`, while folders expose `data-mode`. Collapsed/inactive panels and contexts are inert so hidden tools do not remain in keyboard navigation.
