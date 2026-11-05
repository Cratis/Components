---
title: Choose a Cratis Components surface for your screen
description: Choose a Cratis Components surface for generated Arc commands and queries or application-owned local state, then follow the matching recipe.
---

To choose a Cratis React component, start with what the screen needs to do. Use `CommandDialog` to collect input and execute a generated Arc command, a query-backed table to display backend results, or `DataTableCore` for rows you already have. For local input, choose a controlled component: your React state supplies its value and receives changes. The tables below link each task to its component and recipe.

## Do you need a backend for this surface?

| Your starting point | Start with | Runtime boundary |
| --- | --- | --- |
| A generated command that should execute on confirm | `CommandDialog`, or inline `CommandForm` | Arc runtime and the application's backend |
| A generated query whose results belong on screen | Query-backed `DataTables` or `DataPage` | Arc runtime; live updates require an observable query |
| An array already loaded by the application | `DataTableCore` | The host supplies rows and owns data updates |
| Local input, display, or structured content | Controlled controls and presentational/editor surfaces | The host owns values, callbacks, and persistence |

Arc's npm packages are required peers even when the chosen surface does not make Arc requests. Chronicle is not required: an Arc backend can write directly to a database. Capability profiles describe purpose and adoption cost, not maturity or accessibility tiers; see [UI foundation](ui-foundation.md#capability-profiles).

For your first command/query screen, [configure the package and providers](getting-started.mdx), then follow the [library tutorial](tutorial/index.md). For an existing application, the recipes below show the smaller compositions.

## Collecting input

First decide what confirmation should do. If it runs a generated command, use a command form or dialog. If it only returns values to the caller, use `Dialog`. Then choose whether the input belongs inline, in one modal, or across named steps.

| You want to…                                             | Use                                                       | Why                                                                                                   |
| -------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Collect a few fields and run one command                   | [`CommandDialog`](./CommandDialog/index.md)               | Instantiates, validates, and executes the command; handles the footer and button states. The default. |
| Run a command through named steps in a modal               | [`StepperCommandDialog`](./StepperCommandDialog/index.md) | A wizard over a single command — validate per step, navigate back and forth, execute at the end.      |
| Run a command through named steps inline on the page       | [`CommandStepper`](./CommandStepper/index.md)             | The inline command wizard for a panel, route, or page region; it executes on the final step.       |
| Embed command fields **in a page**, not a dialog           | [`CommandForm`](./CommandForm/index.md)                   | The same typed fields `CommandDialog` uses, without the dialog chrome.                                |
| Collect data and return it **without** running a command   | [`Dialog`](./Dialogs/dialog.md)                           | A confirmation or data-entry dialog that hands values back to the caller. No command involved.        |
| Edit ordinary local React state                            | [`Common` basic controls](./Common/basic-controls.md)      | Native text and choice controls expose semantic values without binding an Arc command.                 |
| Select one or more values in ordinary local React state    | [`Dropdown`](./Dropdown/index.md)                         | Binds a value or array to local options without binding an Arc command.                               |
| Choose an icon from a host-supplied catalog                  | [`IconPicker`](./IconPicker/index.md)                     | A controlled popout with search, categories, provider filtering, and qualified `library`/`key`/`variant` values. |
| Let a user point at a component on screen and read what it is and which presentation properties it has | [`ComponentPicker`](./ComponentPicker/index.md) | An overlay and hook that highlight, name and return the component under the pointer or keyboard cursor, with a property editor that proposes changes. |
| Write markdown with formatting, a preview, and completion   | [`MarkdownEditor`](./MarkdownEditor/index.md)             | A controlled editor with a toolbar, host-rendered preview, configurable triggers, and file uploads.   |
| Configure a component: ordered items, layout settings, a component-specific editor | [`ConfigurationEditor`](./ConfigurationEditor/index.md) | Controlled editors that emit validated proposals while the host owns capabilities, templates and persistence. |

Rule of thumb: **if confirming the dialog executes a generated command, it's a `CommandDialog`** (or its
stepper variant). If it just gathers values and returns them, it's a `Dialog`. Use these wrappers
when their contracts fit, so validation timing, loading state, focus, and footers stay consistent.
An inline field or local control does not need to become a modal just to use Components.

## Displaying data

For backend results, choose a table to place in your existing layout or `DataPage` for a list with actions and detail panels. An observable query supplies updated results over time; a non-observable query supplies a result when executed. If your application already has an array, pass it to `DataTableCore` instead.

| You want to…                                               | Use                                   | Why                                                                                               |
| ---------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| A full screen: a list, a toolbar of actions, detail panels | [`DataPage`](./DataPage/index.md)     | A resizable page composition with toolbar and detail areas wired to the query.                    |
| A table over an Arc query or observable query              | [`DataTables`](./DataTables/index.md) | Query wrappers with server paging and loaded-page rendering.                                      |
| A semantic table over an already-loaded array              | [`DataTableCore`](./DataTables/index.md) | Local rows, single or multiple selection, loaded-page filtering/sorting, scrolling, and stable parts.         |
| Grouping, row expansion, or controlled lazy/server sorting | Product-owned/retained table adapter  | Components does not claim these advanced state contracts; keep the existing adapter deliberately. |

If you're building a list-screen-with-actions from scratch, start with the
[list screen recipe](./list-screen-with-actions.md), which composes `DataPage` with `CommandDialog`
actions.

## Selection, status, and feedback

| You want to…                                      | Use                                            | Why                                                                                         |
| ------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Select one or more values from local options      | [`Dropdown`](./Dropdown/index.md)              | Supports single, filtered, and multiple selection through a controlled value.               |
| Show status, counts, people, progress, or loading | [`Display`](./Display/index.md)                | Provides tags, badges, chips, avatars, messages, progress indicators, and skeletons.        |
| Send an app-wide transient notification           | [`Notifications`](./Notifications/index.md)    | Provides one shared toast queue, an imperative API, and an optional app-wide toaster.        |

### Filtering

Choose the filtering surface by where its state belongs:

| You want to…                                          | Use                                                                 | Why                                                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Filter individual table columns                      | [`Column` filters](./DataTables/index.md#columnfiltermenu)          | A column can use the built-in `ColumnFilterMenu`; the menu keeps draft changes until Apply.            |
| Search configured fields in a `DataPage`             | [`DataPage.globalFilterFields`](./DataPage/index.md#filtering-scope) | Adds global search over the rows in the currently loaded query page.                                   |
| Present option, numeric-range, or custom filter groups | [`FilterPanel`](./Filter/index.md)                                  | Supplies a standalone faceted panel while the host owns how its filter state applies to the data view. |

Table column and `DataPage` global filters operate on the currently loaded query page. Filtering the complete result set belongs in query arguments and server logic before paging; see [`DataPage` filtering scope](./DataPage/index.md#filtering-scope).

## Actions and tool palettes

For page commands such as Add or Edit, use [`ActionMenubar`](./Common/action-menubar.md) or your own action row. `DataPage` already uses `ActionMenubar` in its built-in toolbar. Choose [`Toolbar`](./Toolbar/index.md) when users switch active tools in a canvas or tool palette: it supports groups, slots, folders, and fan-out panels. Its interaction model is not a one-for-one replacement for a generic Prime Toolbar or a page-level action row.

## Structured data, history, and conversation

| You want to…                                           | Use                                                               | Why                                                                                              |
| ------------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Explore or edit an object through a JSON Schema        | [`ObjectContentEditor`](./ObjectContentEditor/index.md)           | Renders schema-aware properties and navigation through nested objects and arrays.                |
| Create or edit a supported JSON Schema                 | [`SchemaEditor`](./SchemaEditor/index.md)                         | Edits properties, supported types, and formats in a validated table interface.                   |
| Add controlled breadcrumbs to hierarchical data       | [`ObjectNavigationalBar`](./ObjectNavigationalBar/index.md)       | Renders a host-owned navigation path with breadcrumb and back actions.                           |
| Explore supplied versions, events, and state changes   | [`TimeMachine`](./TimeMachine/index.md)                           | Provides an interactive timeline while the host supplies the version data.                       |
| Build topic-based conversations from host-owned data   | [`Chat`](./Chat/index.md)                                        | Provides topic, conversation, mention, emoji, and message-action surfaces with callback outputs. |

## Spatial workspaces

Use [`Canvas`](./Canvas/index.md) for a pan/zoom workspace containing positioned DOM or Pixi items, optional minimap/controls, notes, regions, or collaborative chat shapes, or [`PivotViewer`](./PivotViewer/index.md) for a faceted, zoomable card grid over a large dataset. Both belong to the [Spatial capability profile](./ui-foundation.md#capability-profiles) and install the optional `pixi.js` peer — see [UI foundation: Optional Pixi, clean no-Pixi core](./ui-foundation.md#optional-pixi-clean-no-pixi-core). Spatial ships at the same version and quality bar as every other component; the profile label describes what it is for and what it costs to adopt, not a lower support tier.

Canvas and PivotViewer own interaction and rendering primitives; the application owns persistence and behavior. Arc can provide commands, queries, validation, authorization, and generated bindings on its own. Applications using Arc plus Chronicle can additionally project event streams into read models — neither component has a direct Chronicle dependency; see the [UI foundation capability matrix](./ui-foundation.md#capability-matrix).

## Check the choice before composing

- A query-backed table handles query status and delivered results; it does not persist rows or guarantee immediate visibility after a write.
- A `CommandDialog` executes the generated command. A `Dialog` returns a result for the caller to interpret; it does not infer a command from its fields.
- `DataPage` adds selection, actions, and a detail layout. Supply a definite height and your own visible heading; `title` alone does not render one.
- Choose server query arguments for full-result filtering. Loaded-page filtering is not a search across every server page.

## Putting it together

Once you have chosen the pieces, follow the [list screen with actions](./list-screen-with-actions.md)
recipe to put them together. A `DataPage` lists the rows, an action-bar item opens a
`CommandDialog` to add one, and a selection-aware action opens another `CommandDialog` for the
selected row.

Components does not ship every toolkit widget. Tabs, general-purpose sidebars, knobs, select-button groups, general popovers, grouped or expandable tables, controlled lazy/server table sorting, and specialized locale-aware inputs remain product-owned or in a separately configured UI toolkit. See [Coming from PrimeReact](./coming-from-primereact.md) for the current replacement boundaries.

Still deciding how to style any of this? See [Styling](./Styling/index.md).
