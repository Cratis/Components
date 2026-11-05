---
title: Migrate PrimeReact screens to Cratis Components
description: Move PrimeReact screens to Cratis Components with Cratis-owned forms and tables, keeping direct vendor widgets where the migration needs them.
---

Move a PrimeReact screen to Cratis Components by replacing its layout and data workflow in batches. Components 4 has no PrimeReact dependency and uses Cratis-owned props, events, tokens, and parts instead of exposing Prime types. You can keep a vendor-specific widget while moving the surrounding form or table.

Start with one screen. Replace its imports using the table below, then check dialog close behavior, table data, and styling before removing the Prime provider.

## Replace direct imports

| PrimeReact                       | Components import                                                     |
| -------------------------------- | --------------------------------------------------------------------- |
| Button                           | `Button` from `@cratis/components/Common`                             |
| Dialog                           | `Dialog` from `@cratis/components/Dialogs`                            |
| Select / Dropdown                | `Dropdown` from `@cratis/components/Dropdown`                         |
| DataTable / Column               | `DataTableCore` and `Column` from `@cratis/components/DataTables`     |
| Input fields in command forms    | Field components from `@cratis/components/CommandForm`                |
| Tag / Badge / Message / Skeleton | `Tag`, `Badge`, `Message`, `Skeleton` from `@cratis/components/Display` |
| Toast / Toaster                  | `Toaster` and `toast` from `@cratis/components/Notifications`         |

Import each component from its subpath; the package root exports only `CratisComponentsProvider` and its configuration helpers.

Use native HTML for simple application-owned controls that do not need Components behavior. CommandForm fields are specifically for generated command properties; they are not a general local-state input suite.

Components does not provide one-for-one replacements for every Prime widget. Keep an application-owned or direct Prime surface during migration when it requires tabs, sidebars, timelines, knobs, select-button groups, general popovers, grouped/expandable tables, or controlled lazy/server table sorting. Components `Toolbar` is a canvas/tool-palette control, not a replacement for every page action bar.

If you want to keep vendor presentation, the optional MUI, PrimeReact 11, and PrimeReact 10 adapters cover nine `common.*` presentation slots, named replacement points for basic controls: button, icon-button, text-input, text-area, checkbox, radio, switch, progress, and surface. They do not replace Dialog, Dropdown, DatePicker, paginator, table, or another complete widget. Core retains focus, overlay, selection, and keyboard behavior; installing an adapter does not delegate key handling or recreate a Prime public API. See [Choose a renderer](renderers/index.md) before choosing an adapter.

## Map common Dialog props

| Prime Dialog             | Components Dialog                                     |
| ------------------------ | ----------------------------------------------------- |
| `header`                 | `title`                                               |
| `visible`                | `visible`                                             |
| `onHide`                 | `onCancel` or `onClose`, according to product meaning |
| `footer`                 | `buttons` custom content                              |
| `style={{ width }}`      | `width`                                               |
| Prime pass-through slots | `DialogParts` through `pt`                            |

A custom `buttons` footer owns its close result through `useDialogContext`; Components cannot infer which custom action confirms or cancels.

## Choose the table boundary

Choose the table according to who owns the data. `DataTableCore` renders an already-loaded local array. For a paged Arc query, use `DataTableForQuery`; if that query also delivers later results, use `DataTableForObservableQuery`. `DataPage` adds actions and optional details around the table.

Keep an application-owned/Prime adapter for grouping, row expansion, or controlled lazy/server sorting until an explicit state contract exists.

For direct Prime migration, rename `value` to `data`. Replace compact size, stripes, and column alignment with `DataTableParts`, `Column` classes/styles, and product CSS. Prime `Column` cannot be passed to a Components table or `DataPage`; import the Cratis marker for those surfaces.

## Replace provider configuration

If Components was the application's only Prime consumer, remove `PrimeReactProvider`, license keys, presets, renderer defaults, and global Prime pass-through configuration. Mount `CratisComponentsProvider` for locale, owned labels, and the optional toaster.

If the application still imports Prime directly, keep its installed-version provider, styling, dependencies, and license configuration around those remaining surfaces while mounting `CratisComponentsProvider` independently for Components. Remove the Prime root only after direct UI imports, icon classes, generated schemas, and any intentional prototype/catalog tooling are accounted for.

A PrimeReact 10 / Components 2 application may migrate directly to Components 4. It does not need to adopt PrimeReact 11 first; keep Prime 10 isolated while replacing surfaces in batches.

## Replace styling

- Map product values to `--cratis-*` tokens.
- Replace `.p-*`, `data-scope`, and `data-part` selectors with stable `data-cratis-part` selectors.
- Replace Prime pass-through keys with each component's Cratis-owned `pt` type.
- Replace PrimeIcons with React icon nodes or product-owned SVGs.

## Keep server data behavior explicit

Components tables render one Arc-provided page. Filtering and sorting the complete dataset belongs on the server before paging. Do not reproduce a client-side DataTable mode over partial data.

For a command form, follow [Building a form](building-a-form.md); for query-bound rows, use [Displaying data](displaying-data.md). If the application also uses an older Components version, follow the complete [Components 3 to 4 migration](Migration/3-to-4.md).
