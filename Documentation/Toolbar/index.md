---
title: Cratis Components Toolbar tool palettes
description: Use Toolbar for canvas tool selection, with named controls, keyboard navigation, and grouped palettes. Use ActionMenubar for page commands.
---

`Toolbar` in Cratis Components is a tool palette for canvas-style interfaces where users choose a mode such as Select or Draw. Give tools accessible names, keep selection in application state, and arrange related tools into groups so users can find and switch tools with a pointer or keyboard.

For page commands such as Add or Edit, use [`ActionMenubar`](../Common/action-menubar.md) from `@cratis/components/Common`, or your own action row. `DataPage` already uses `ActionMenubar` for its built-in actions. Choose `Toolbar` when the interface needs a tool palette, with selected tools or expandable sets of tools. See [Choosing a component: Actions and tool palettes](../choosing-a-component.md#actions-and-tool-palettes).

Toolbar belongs to the [Advanced React capability profile](../ui-foundation.md#capability-profiles). It renders React and DOM elements and has no Pixi dependency; using it beside a canvas does not require the Spatial profile.

Pass React icon nodes or your own SVGs to avoid an icon-font dependency. Icon-font class strings are also accepted, but Components does not install a font or infer provider base classes. Load the matching stylesheet and pass the complete class string yourself.

Import every Toolbar component from its subpath:

```tsx
import { Toolbar, ToolbarButton } from '@cratis/components/Toolbar';
```

Start with [Basic usage](basic-usage.md) to compose and name a palette, then [Active state](active-state.md) to connect tool selection to your application.

## Keyboard and accessibility

The root renders `role='toolbar'` and `aria-orientation`. Give each palette an accessible name with `aria-label` or `aria-labelledby`, especially when several appear on one screen. Without an explicit name, it uses the provider's `messages.toolbar.label`, then `Tools`.

`title` is required on `ToolbarButton` and `ToolbarFolder`, and `tooltip` on `ToolbarFanOutItem`. This text supplies the trigger's `aria-label` and its tooltip on hover or keyboard focus. Passing `active` sets `aria-pressed` to `true` or `false`; omitting it leaves the attribute unset. Use [Active state](active-state.md) for persistent tool selection, not for one-time actions such as Undo.

### Choose a focus mode

Import `ToolbarFocusMode` from `@cratis/components/Toolbar` and set `focusMode` on the root:

| Mode | Keyboard behavior |
| --- | --- |
| `ToolbarFocusMode.Arrows` (default) | Arrow keys and Home/End move focus; each tool keeps its own Tab stop. |
| `ToolbarFocusMode.SingleTabStop` | The toolbar's own tools share one Tab stop, following the WAI-ARIA toolbar pattern. Arrow keys move between them. |
| `ToolbarFocusMode.None` | Native Tab behavior, without toolbar key handling. |

In either arrow-navigation mode, Up/Down move through a vertical palette. A horizontal palette uses Left/Right, with the direction reversed in right-to-left layouts. Home/End move to the first/last available tool in DOM order. Navigation skips disabled, hidden, and inert tools and stops at either end without wrapping.

With `SingleTabStop`, `ToolbarButton` elements and folder and fan-out triggers share a Tab stop. It starts at the first available tool and returns to the last focused tool. If that tool becomes disabled, hidden, or removed, the first available tool takes its place. Tools in open folder and fan-out panels are reached with arrow keys as part of the same Tab stop. Until the toolbar chooses its active focus target, such as before hydration of server-rendered markup, tools keep their individual Tab stops. See [#353](https://github.com/Cratis/Components/issues/353) for the default-mode change discussion.

Controls you add yourself, including inputs and sliders, keep their own Tab stops. So do tools rendered through a portal or inside a nested `role="toolbar"`. An explicit `pt.root.tabIndex` on a `ToolbarButton`, or `pt.trigger.tabIndex` on a folder or fan-out trigger, also opts that tool out of the shared Tab stop. A value of 0 or higher still allows arrow-key navigation; `-1` removes the tool from both Tab and arrow-key navigation.

Arrows and Home/End retain their own behavior inside inputs, sliders, selects, and custom widgets. Nested toolbars handle their own keys. A key handler on a tool or `pt.root` can cancel toolbar navigation with `preventDefault()` or `stopPropagation()`.

### Expand and collapse tools

Folder and fan-out triggers expose `aria-expanded` and `aria-controls`. Their panels close on Escape or a mouse press outside. Escape also returns focus to the trigger. Collapsed panels are `inert` and `aria-hidden`, so their tools are unavailable to keyboard navigation and assistive technology.

Toolbar, folder, fan-out, and context transitions are suppressed under `prefers-reduced-motion: reduce`.

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

When customizing or measuring a palette, use typed `pt` surfaces and `data-cratis-part` to target its structure. These are the stable parts; implementation class names can change.

| Component           | Type                    | `pt` key → `data-cratis-part`                                                                                   |
| ------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `Toolbar`           | `ToolbarParts`          | `root` → `root`                                                                                                 |
| `ToolbarButton`     | `ToolbarButtonParts`    | `root` → `button`; `icon` → `icon`; `label` → `label`                                                           |
| `ToolbarGroup`      | `ToolbarGroupParts`     | `root` → `toolbar-group`; `slot` → `toolbar-slot`; `incoming` → `toolbar-slot-incoming`; `outgoing` → `toolbar-slot-outgoing`  |
| `ToolbarSeparator`  | `ToolbarSeparatorParts` | `root` → `toolbar-separator`                                                                                    |
| `ToolbarLayout`     | `ToolbarLayoutParts`    | `root` → `toolbar-layout`; `slot` → `toolbar-slot`; `incoming` → `toolbar-slot-incoming`; `outgoing` → `toolbar-slot-outgoing` |
| `ToolbarSection`    | `ToolbarSectionParts`   | `root` → `toolbar-section`; `context` → `toolbar-context`                                                       |
| `ToolbarFolder`     | `ToolbarFolderParts`    | `root` → `toolbar-folder`; `trigger` → `toolbar-folder-trigger`; `panel` → `toolbar-folder-panel`; drawer: `drawerHeader`, `drawerTitle`, `drawerClose`, `tile`, `tileIcon`, `tileLabel` (see [Headed drawer](drawer.md)) |
| `ToolbarFanOutItem` | `ToolbarFanOutParts`    | `root` → `fanout-root`; `trigger` → `fanout-trigger`; `panel` → `fanout-panel`                                  |

The active tool, active context, and an open folder or fan-out also carry the canonical `data-selected` or `data-open` state. Contexts expose `data-context-name` and `data-active`; sections and slots expose `data-transitioning`. Folder and fan-out panels expose `data-expanded` and `data-direction`; fan-out also exposes `data-settled`, while folders expose `data-mode`. Collapsed/inactive panels and contexts are inert so hidden tools do not remain in keyboard navigation.
