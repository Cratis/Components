# Toolbar

The `Toolbar` component provides a canvas-style icon toolbar with support for orientations, active states, animated context switching, separators, fan-out sub-panels, and drag & drop onto surfaces.

Pass React icon nodes or product-owned SVGs for a dependency-free toolbar. Consumer-owned icon-font class strings remain accepted, but Components does not install an icon font or infer provider base classes; the product must load the matching stylesheet and pass the complete class string.

## Components

| Component | Description |
|---|---|
| `Toolbar` | Container that groups toolbar buttons into a pill-shaped bar |
| `ToolbarButton` | Button that renders non-empty `text` or otherwise an `icon`, with a hover tooltip |
| `ToolbarSeparator` | Visual divider that separates groups of buttons |
| `ToolbarSection` | Section within a toolbar that animates between named contexts |
| `ToolbarContext` | Named context (set of buttons) inside a `ToolbarSection` |
| `ToolbarFanOutItem` | Button that slides out a horizontal sub-panel on click |
| `ToolbarFolder` | Button that reveals a dynamically sized grid of buttons on click |
| `ToolbarGroup` | Formal logical sub-group of toolbar items with an automatic visual separator between adjacent groups |
| `ToolbarSlotProvider` | Context provider that enables the slot system — wrap the application root or a feature boundary |
| `ToolbarSlot` | Renders nothing itself; injects its `children` into the named slot at the given `order` position |
| `ToolbarLayout` | Named layout boundary that swaps default content for matching slot content |

## Stable composition and measurement parts

Deeply styled products should measure and select Toolbar structure through typed `pt` surfaces and `data-cratis-part`, not implementation class names.

| Component | Type | Stable parts |
| --- | --- | --- |
| `Toolbar` | `ToolbarParts` | `root` → `root` |
| `ToolbarButton` | `ToolbarButtonParts` | `root`, `icon`, `label` |
| `ToolbarGroup` | `ToolbarGroupParts` | `root` → `toolbar-group`; `slot`, `incoming`, `outgoing` |
| `ToolbarSeparator` | `ToolbarSeparatorParts` | `root` → `toolbar-separator` |
| `ToolbarLayout` | `ToolbarLayoutParts` | `root` → `toolbar-layout`; `slot`, `incoming`, `outgoing` |
| `ToolbarSection` | `ToolbarSectionParts` | `root` → `toolbar-section`; `context` → `toolbar-context` |
| `ToolbarFolder` | `ToolbarFolderParts` | `root`, `trigger`, `panel` |
| `ToolbarFanOutItem` | `ToolbarFanOutParts` | `root`, `trigger`, `panel` |

Slot transitions expose `toolbar-slot`, `toolbar-slot-incoming`, and `toolbar-slot-outgoing`. Contexts expose `data-context-name` and `data-active`; sections and slots expose `data-transitioning`. Folder and fan-out panels expose `data-expanded`. Collapsed/inactive panels and contexts are inert so hidden tools do not remain in keyboard navigation.

