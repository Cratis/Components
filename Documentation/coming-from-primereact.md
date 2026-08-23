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

Use native HTML for simple application-owned controls that do not need Components behavior.

## Replace provider configuration

Remove `PrimeReactProvider`, license keys, presets, renderer defaults, and global Prime pass-through configuration. Mount `CratisComponentsProvider` for locale, owned labels, and the optional toaster.

## Replace styling

- Map product values to `--cratis-*` tokens.
- Replace `.p-*`, `data-scope`, and `data-part` selectors with stable `data-cratis-part` selectors.
- Replace Prime pass-through keys with each component's Cratis-owned `pt` type.
- Replace PrimeIcons with React icon nodes or product-owned SVGs.

## Keep server data behavior explicit

Components tables render one Arc-provided page. Filtering and sorting the complete dataset belongs on the server before paging. Do not reproduce a client-side DataTable mode over partial data.

Follow the complete [Components 3 to 4 migration](migration.md).
