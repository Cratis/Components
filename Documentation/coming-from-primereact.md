---
title: Coming from PrimeReact
description: Map direct PrimeReact usage onto renderer-independent Components 4 APIs.
---

Components 4 does not render PrimeReact or expose Prime types. The public API uses Cratis-owned props, events, tokens, and parts.

## Replace direct imports

| PrimeReact                       | Components                            |
| -------------------------------- | ------------------------------------- |
| Button                           | `Common/Button`                       |
| Dialog                           | `Dialogs/Dialog`                      |
| Select / Dropdown                | `Dropdown`                            |
| DataTable / Column               | `DataTables/DataTableCore` / `Column` |
| Input fields in command forms    | `CommandForm` fields                  |
| Tag / Badge / Message / Skeleton | `Display`                             |
| Toast / Toaster                  | `Notifications`                       |

Use native HTML for simple application-owned controls that do not need Components behavior. CommandForm fields are specifically for generated command properties; they are not a general local-state input suite.

Components does not provide one-for-one replacements for every Prime widget. Keep an application-owned or direct Prime surface during migration when it requires tabs, sidebars, timelines, knobs, select-button groups, general popovers, grouped/expandable tables, or controlled lazy/server table sorting. Components `Toolbar` is a canvas/tool-palette control, not a replacement for every page action bar.

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

- Use `DataTableCore` for an already-loaded local array.
- Use `DataTableForQuery` for a paged Arc query.
- Use `DataTableForObservableQuery` for an observable paged Arc query.
- Use `DataPage` for a complete list screen with actions and optional details.
- Keep an application-owned/Prime adapter for grouping, row expansion, or controlled lazy/server sorting until an explicit state contract exists.

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

Follow the complete [Components 3 to 4 migration](migration.md).
