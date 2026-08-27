---
title: Choosing a component
description: A decision guide for the overlapping Components — CommandDialog vs StepperCommandDialog, DataPage vs DataTables, and Dialog vs CommandDialog.
---

Several Components solve similar-looking problems, and it's not always obvious which one to reach for.
This page is the decision guide: pick by what you're building, then follow the link to the recipe or
reference.

## Collecting input

The question is whether confirming the form **runs a command**, and whether it's one step or several.

| You want to…                                             | Use                                                       | Why                                                                                                   |
| -------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Collect a few fields and run one command                 | [`CommandDialog`](./CommandDialog/index.md)               | Instantiates, validates, and executes the command; handles the footer and button states. The default. |
| Run a command, but gather input across **named steps**   | [`StepperCommandDialog`](./StepperCommandDialog/index.md) | A wizard over a single command — validate per step, navigate back and forth, execute at the end.      |
| Embed command fields **in a page**, not a dialog         | [`CommandForm`](./CommandForm/index.md)                   | The same typed fields `CommandDialog` uses, without the dialog chrome.                                |
| Collect data and return it **without** running a command | [`Dialog`](./Dialogs/index.md)                            | A confirmation or data-entry dialog that hands values back to the caller. No command involved.        |
| Edit ordinary local React state                          | [`Common` basic controls](./Common/basic-controls.md)      | Native text and choice controls expose semantic values without binding an Arc command.                 |

Rule of thumb: **if confirming the dialog executes a generated command, it's a `CommandDialog`** (or its
stepper variant). If it just gathers values and returns them, it's a `Dialog`. Never reach for
an application-owned modal — these wrappers handle validation timing, loading state, focus, and footers
consistently.

## Displaying data

Both render a query or observable query; the question is whether you want a **whole page** or a **table
to drop into one**.

| You want to…                                               | Use                                   | Why                                                                                               |
| ---------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| A full screen: a list, a toolbar of actions, detail panels | [`DataPage`](./DataPage/index.md)     | A resizable page composition with toolbar and detail areas wired to the query.                    |
| A table over an Arc query or observable query              | [`DataTables`](./DataTables/index.md) | Query wrappers with server paging and loaded-page rendering.                                      |
| A semantic table over an already-loaded array              | `DataTableCore`                       | Local rows, single selection, loaded-page filtering/sorting, scrolling, and stable parts.         |
| Grouping, row expansion, or controlled lazy/server sorting | Product-owned/retained table adapter  | Components does not claim these advanced state contracts; keep the existing adapter deliberately. |

If you're building a list-screen-with-actions from scratch, start with the
[list screen recipe](./list-screen-with-actions.md), which composes `DataPage` with `CommandDialog`
actions.

## Actions and tool palettes

Use `ActionMenubar` or an ordinary product action row for flat page commands. `DataPage`'s built-in toolbar already renders `ActionMenubar`, not `Toolbar` — that is the default action row for a page, not a canvas tool palette. Use [`Toolbar`](./Toolbar/index.md) only for a genuine canvas/tool-palette interaction with active tools, groups, slots, folders, and fan-out panels. It is not a one-for-one replacement for a generic Prime Toolbar, and it is not a page-level action row wearing a different name.

## Spatial workspaces

Use [`Canvas`](./Canvas/index.md) for a pan/zoom workspace containing positioned DOM or Pixi items, optional minimap/controls, notes, regions, or collaborative chat shapes, or [`PivotViewer`](./PivotViewer/index.md) for a faceted, zoomable card grid over a large dataset. Both belong to the [Spatial capability profile](./ui-foundation.md#capability-profiles) and install the optional `pixi.js` peer — see [UI foundation: Optional Pixi, clean no-Pixi core](./ui-foundation.md#optional-pixi-clean-no-pixi-core). Spatial ships at the same version and quality bar as every other component; the profile label describes what it is for and what it costs to adopt, not a lower support tier.

Canvas and PivotViewer own interaction and rendering primitives; the application owns persistence and behavior. Arc can provide commands, queries, validation, authorization, and generated bindings on its own. Applications using Arc plus Chronicle can additionally project event streams into read models — neither component has a direct Chronicle dependency; see the [UI foundation capability matrix](./ui-foundation.md#capability-matrix).

## Putting it together

A typical CRUD screen combines these: a `DataPage` lists the rows, a toolbar button opens a
`CommandDialog` to add one, and selecting a row opens another `CommandDialog` to edit it. That whole
screen is the [list screen with actions](./list-screen-with-actions.md) recipe.

Components does not attempt to replace every toolkit widget. Tabs, sidebars, timelines, knobs, select-button groups, general popovers, and specialized locale-aware inputs may remain product-owned or in a separately configured UI toolkit until an intentional Components API exists.

Still deciding how to style any of this? See [Styling](./Styling/index.md).
