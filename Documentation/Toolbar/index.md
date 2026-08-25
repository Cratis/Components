# Toolbar

The `Toolbar` component provides a canvas-style icon toolbar with support for orientations, active states, animated context switching, separators, fan-out sub-panels, and drag & drop onto surfaces.

Toolbar belongs to the [Advanced React capability profile](../ui-foundation.md#capability-profiles) — a specialized, React-only surface with no Pixi dependency, despite its canvas-adjacent purpose.

**`Toolbar` is not a default page action row.** It is built for a canvas/tool-palette interaction — active tools, groups, slots, folders, and fan-out panels — not for an ordinary page's list of commands. `DataPage`'s built-in action row renders `ActionMenubar` (from `@cratis/components/Common`), not `Toolbar`. Reach for `ActionMenubar`, or a product-owned action row, for flat page-level actions; reach for `Toolbar` only when the surface is genuinely a spatial tool palette. See [Choosing a component: Actions and tool palettes](../choosing-a-component.md#actions-and-tool-palettes).

Pass React icon nodes or product-owned SVGs for a dependency-free toolbar. Consumer-owned icon-font class strings remain accepted, but Components does not install an icon font or infer provider base classes; the product must load the matching stylesheet and pass the complete class string.

The root renders `role='toolbar'`, orientation semantics, and an accessible name. `aria-label` defaults to `Tools`; localize it or use `aria-labelledby`. Folder and fan-out panels close on Escape, return focus to their trigger, become inert while collapsed, and suppress transitions under reduced motion.

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
| `ToolbarGroup`        | Formal logical sub-group of toolbar items with an automatic visual separator between adjacent groups |
| `ToolbarSlotProvider` | Context provider that enables the slot system — wrap the application root or a feature boundary      |
| `ToolbarSlot`         | Renders nothing itself; injects its `children` into the named slot at the given `order` position     |
| `ToolbarLayout`       | Named layout boundary that swaps default content for matching slot content                           |

## Stable composition and measurement parts

Deeply styled products should measure and select Toolbar structure through typed `pt` surfaces and `data-cratis-part`, not implementation class names.

| Component           | Type                    | Stable parts                                              |
| ------------------- | ----------------------- | --------------------------------------------------------- |
| `Toolbar`           | `ToolbarParts`          | `root` → `root`                                           |
| `ToolbarButton`     | `ToolbarButtonParts`    | `root`, `icon`, `label`                                   |
| `ToolbarGroup`      | `ToolbarGroupParts`     | `root` → `toolbar-group`; `slot`, `incoming`, `outgoing`  |
| `ToolbarSeparator`  | `ToolbarSeparatorParts` | `root` → `toolbar-separator`                              |
| `ToolbarLayout`     | `ToolbarLayoutParts`    | `root` → `toolbar-layout`; `slot`, `incoming`, `outgoing` |
| `ToolbarSection`    | `ToolbarSectionParts`   | `root` → `toolbar-section`; `context` → `toolbar-context` |
| `ToolbarFolder`     | `ToolbarFolderParts`    | `root`, `trigger`, `panel`                                |
| `ToolbarFanOutItem` | `ToolbarFanOutParts`    | `root`, `trigger`, `panel`                                |

Slot transitions expose `toolbar-slot`, `toolbar-slot-incoming`, and `toolbar-slot-outgoing`. Contexts expose `data-context-name` and `data-active`; sections and slots expose `data-transitioning`. Folder and fan-out panels expose `data-expanded` and `data-direction`; fan-out also exposes `data-settled`, while folders expose `data-mode`. Collapsed/inactive panels and contexts are inert so hidden tools do not remain in keyboard navigation.
