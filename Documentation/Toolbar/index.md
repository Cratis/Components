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
- `focusMode` defaults to `ToolbarFocusMode.Arrows`: Up/Down move between tools in the default vertical orientation; a horizontal toolbar uses Left/Right (reversed in RTL). Home/End move to the first/last available tool in DOM order. Navigation skips disabled, hidden, and inert tools and stops at either end; it does not wrap. Each tool remains its own Tab stop, so Tab and Shift+Tab work as before.
- Set `focusMode={ToolbarFocusMode.SingleTabStop}` for one roving Tab stop **among non-widget tools**: Tab enters on the last focused tool (or the first available tool), and arrows/Home/End move only among those tools, skipping widgets. Inputs other than buttons, textareas, selects, contenteditable elements, and slider, spinbutton, textbox, combobox, listbox, menu, menubar, tree, grid, and application roles keep their own native Tab stop and keys. The toolbar therefore has one Tab stop per widget plus one for the remaining tools; Tab/Shift+Tab move between those stops and out of the toolbar. Aria-disabled tools do not add Tab stops. Set `focusMode={ToolbarFocusMode.None}` to restore native Tab behavior without any toolbar key handling. Import `ToolbarFocusMode` from `@cratis/components/Toolbar`. The single-Tab-stop mode will become the default in the next major release ([#353](https://github.com/Cratis/Components/issues/353)).
- Arrows and Home/End inside inputs, sliders, selects, and custom widgets retain their own behavior. Nested toolbars handle their own keys. Key handlers on a tool or `pt.root` can cancel navigation with `preventDefault()` or `stopPropagation()`.
- `title` is required on `ToolbarButton` and `ToolbarFolder`, and `tooltip` on `ToolbarFanOutItem`. That text becomes the button's `aria-label` and its tooltip, which appears on hover and on keyboard focus.
- Passing `active` sets `aria-pressed` to `true` or `false` as well as the visual state (`data-active`, `data-selected`); omitting `active` leaves it unset. See [Active state](active-state.md).
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
