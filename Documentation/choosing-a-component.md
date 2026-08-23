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

Rule of thumb: **if confirming the dialog executes a generated command, it's a `CommandDialog`** (or its
stepper variant). If it just gathers values and returns them, it's a `Dialog`. Never reach for
an application-owned modal — these wrappers handle validation timing, loading state, focus, and footers
consistently.

## Displaying data

Both render a query or observable query; the question is whether you want a **whole page** or a **table
to drop into one**.

| You want to…                                               | Use                                   | Why                                                                                              |
| ---------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| A full screen: a list, a toolbar of actions, detail panels | [`DataPage`](./DataPage/index.md)     | A resizable page composition with toolbar and detail areas wired to the query.                   |
| Just a grid inside a layout you already have               | [`DataTables`](./DataTables/index.md) | The table wrappers — paging, sorting, and selection over a query — without the page scaffolding. |

If you're building a list-screen-with-actions from scratch, start with the
[list screen recipe](./list-screen-with-actions.md), which composes `DataPage` with `CommandDialog`
actions.

## Spatial workspaces

Use [`Canvas`](./Canvas/index.md) for a pan/zoom workspace containing positioned DOM or Pixi items, optional minimap/controls, notes, regions, or collaborative chat shapes. Canvas owns interaction and rendering primitives; the application still owns persistence and behavior through Arc commands, queries, and Chronicle read models.

## Putting it together

A typical CRUD screen combines these: a `DataPage` lists the rows, a toolbar button opens a
`CommandDialog` to add one, and selecting a row opens another `CommandDialog` to edit it. That whole
screen is the [list screen with actions](./list-screen-with-actions.md) recipe.

Still deciding how to style any of this? See [Styling](./Styling/index.md).
