---
title: Choose Cratis Components per-area stylesheets
description: Load Cratis Components CSS for selected surfaces with a shared base and per-area imports, while keeping the same tokens and styling hooks.
---

Per-area stylesheets let you load CSS for the Cratis Components surfaces your application mounts instead of the whole library. Use them when a page needs only a few surfaces, such as dialogs and a data table, or when a specialist surface loads with a route. Keep `@cratis/components/styles` for the simplest first setup.

Replace the aggregate with `@cratis/components/styles/base` and the published `<subpath>/styles` entries you need. Keep `tokens`, and retain `theme` if you want the baseline appearance.

For a new setup, put the package imports in a local CSS file as shown in [Set up styling](getting-started.md#import-only-the-surfaces-you-mount). The equivalent direct TypeScript imports are below. These stylesheet subpaths have no type declarations; if your compiler reports `TS2882`, declare each imported package subpath in a project-included `.d.ts` file or use the CSS-first setup.

```ts
import '@cratis/components/tokens';       // the --cratis-* seam (always)
import '@cratis/components/styles/base';  // shared utilities and layer order (always)
import '@cratis/components/Dialogs/styles';
import '@cratis/components/DataTables/styles';
import '@cratis/components/theme';        // optional baseline look
```

The choice changes which component rules you load. Class names, `data-cratis-part` hooks, `--cratis-*` tokens, and cascade-layer names stay the same.

## Which one to use

| Situation | Import |
| --- | --- |
| Getting started, or the app mounts most of the library | `@cratis/components/styles` |
| The app mounts a handful of surfaces and its CSS payload matters | `@cratis/components/styles/base` plus one `<subpath>/styles` per surface |
| A specialist surface is loaded lazily (`PivotViewer`, `Canvas`, `Chat`, `TimeMachine`) | Load `<subpath>/styles` with the route or chunk that mounts it |

Avoid loading the aggregate and area sheets together: they duplicate component rules without narrowing the CSS selection. They use the same cascade layer, so adding an area sheet does not create a separate styling priority.

## The two rules

Load `@cratis/components/styles/base` once before the area sheets. It supplies the internal Tailwind-generated utilities and the `@layer cratis-theme, cratis-components, cratis-utilities` ordering statement. Area sheets do not include that shared base. Without it, controls can lose layout utilities and the layer order depends on which sheet loads first. The aggregate already includes the base, so it needs no separate base import.

An area sheet includes its internal structural dependencies. The package derives those dependencies from the built JavaScript module graph: the modules reachable from that entry point. For example, `PivotViewer` renders `FilterPanel`, so its stylesheet includes Filter rules; `DataPage` includes the vendored Allotment split-view rules. You do not need separate area imports for those internal dependencies, but you do need entries for other surfaces your application mounts.

Each published stylesheet includes an `Areas:` comment listing its coverage. Check that comment in your installed package when you need the exact dependency set.

## Entry points

| Entry point | Surface or role |
| --- | --- |
| `@cratis/components/styles/base` | Internal utilities and cascade-layer order — required by every entry point below |
| `@cratis/components/Canvas/styles` | Canvas |
| `@cratis/components/Chat/styles` | Chat |
| `@cratis/components/CommandDialog/styles` | CommandDialog |
| `@cratis/components/CommandStepper/styles` | CommandStepper |
| `@cratis/components/CommandForm/styles` | CommandForm |
| `@cratis/components/CommandForm/fields/styles` | Same sheet as `CommandForm/styles` |
| `@cratis/components/Common/styles` | Common controls |
| `@cratis/components/ConfigurationEditor/styles` | ConfigurationEditor |
| `@cratis/components/DataPage/styles` | DataPage, including Allotment split-view rules |
| `@cratis/components/DataTables/styles` | Data tables |
| `@cratis/components/Dialogs/styles` | Dialogs |
| `@cratis/components/Display/styles` | Display components |
| `@cratis/components/Dropdown/styles` | Dropdown |
| `@cratis/components/Filter/styles` | FilterPanel |
| `@cratis/components/IconPicker/styles` | IconPicker |
| `@cratis/components/MarkdownEditor/styles` | MarkdownEditor |
| `@cratis/components/Notifications/styles` | Notifications |
| `@cratis/components/ObjectContentEditor/styles` | ObjectContentEditor |
| `@cratis/components/ObjectNavigationalBar/styles` | ObjectNavigationalBar |
| `@cratis/components/PivotViewer/styles` | PivotViewer, including Filter rules |
| `@cratis/components/renderer/builtin/styles` | Built-in renderer controls |
| `@cratis/components/SchemaEditor/styles` | SchemaEditor |
| `@cratis/components/TimeMachine/styles` | TimeMachine |
| `@cratis/components/Toolbar/styles` | Toolbar |

## What it saves

Per-area imports leave out component rules outside the selected entry points' dependency graphs. They still load the shared base, and area sheets can overlap where surfaces share dependencies. The final saving depends on your package version, selected surfaces, and bundler output; compare the resulting application CSS before choosing imports solely for size.

## Cascade and ordering

Every area sheet writes into `cratis-components`; none establishes the order of the Cratis layers. The shared base establishes that order unless your product has already declared it. Keep the same [cascade contract](index.md#cascade-contract) as the aggregate setup, including the Cratis names in your product's first layer declaration when it has one.

## See also

- [Styling overview](index.md) — the token, structure, and theme layers
- [Set up styling](getting-started.md) — the default import order
- [Stable component parts](pass-through.md) — the supported styling hooks
