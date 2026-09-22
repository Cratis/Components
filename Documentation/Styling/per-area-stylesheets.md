---
title: Per-area stylesheets
description: Import only the CSS for the Components surfaces an application actually mounts.
---

`@cratis/components/styles` is the whole library's CSS in one file. That is the right default, and it
is unchanged. It is the wrong default for an application that mounts two dialogs and a data table: a
`PivotViewer`, a `TimeMachine` and a `Canvas` it will never render are downloaded and parsed anyway.

Every JavaScript subpath therefore also publishes its own stylesheet at `<subpath>/styles`, alongside
one shared base:

```ts
import '@cratis/components/tokens';       // the --cratis-* seam (always)
import '@cratis/components/styles/base';  // shared utilities and layer order (always)
import '@cratis/components/Dialogs/styles';
import '@cratis/components/DataTables/styles';
import '@cratis/components/theme';        // optional baseline look
```

Nothing else changes: the same class names, the same `data-cratis-part` hooks, the same `--cratis-*`
tokens, the same cascade layers.

## Which one to use

| Situation | Import |
| --- | --- |
| Getting started, or the app mounts most of the library | `@cratis/components/styles` |
| The app mounts a handful of surfaces and its CSS payload matters | `@cratis/components/styles/base` plus one `<subpath>/styles` per surface |
| A specialist surface is loaded lazily (`PivotViewer`, `Canvas`, `Chat`, `TimeMachine`) | Load `<subpath>/styles` with the route or chunk that mounts it |

Mixing is fine. The aggregate and the per-area sheets contain the same rules in the same cascade
layer and the same order, so importing both is redundant rather than wrong.

## The two rules

**Always import `@cratis/components/styles/base` exactly once.** It carries the internal
Tailwind-generated utilities every component's markup uses, and the `@layer cratis-theme,
cratis-components, cratis-utilities` statement that fixes cascade order. It is deliberately not
copied into each area sheet — that would duplicate it once per surface and let two sheets disagree
about layer order. Without it, components render unstyled. The aggregate already contains it, so an
application using `@cratis/components/styles` must not import it as well.

**Each `<subpath>/styles` is self-contained for that subpath.** An area sheet contains the rules of
every Components directory that subpath actually reaches, not just its own folder, because the split
is derived from the built module graph rather than from a maintained list. `PivotViewer` renders a
`FilterPanel`, so `@cratis/components/PivotViewer/styles` contains `Filter`'s rules too;
`@cratis/components/DataPage/styles` contains the vendored Allotment split-view rules. There is never
a second import to remember.

## Entry points

| Entry point | Covers |
| --- | --- |
| `@cratis/components/styles/base` | Internal utilities and cascade-layer order — required by every entry point below |
| `@cratis/components/Canvas/styles` | Canvas, Chat, Common, Dialogs, Notifications |
| `@cratis/components/Chat/styles` | Chat |
| `@cratis/components/CommandDialog/styles` | CommandDialog, CommandForm, Common, Dialogs, Notifications |
| `@cratis/components/CommandStepper/styles` | CommandDialog, CommandForm, Common, Notifications |
| `@cratis/components/CommandForm/styles` | CommandForm, Common, Dropdown, Notifications |
| `@cratis/components/CommandForm/fields/styles` | Same sheet as `CommandForm/styles` |
| `@cratis/components/Common/styles` | Common, Notifications |
| `@cratis/components/DataPage/styles` | Common, DataPage (Allotment), DataTables, Dropdown, Notifications |
| `@cratis/components/DataTables/styles` | Common, DataTables, Dropdown, Notifications |
| `@cratis/components/Dialogs/styles` | Common, Dialogs, Display, Notifications |
| `@cratis/components/Display/styles` | Common, Display |
| `@cratis/components/Dropdown/styles` | Common, Dropdown, Notifications |
| `@cratis/components/Filter/styles` | Filter |
| `@cratis/components/Notifications/styles` | Common, Notifications |
| `@cratis/components/ObjectContentEditor/styles` | Common, Notifications, ObjectNavigationalBar |
| `@cratis/components/ObjectNavigationalBar/styles` | Common, ObjectNavigationalBar |
| `@cratis/components/PivotViewer/styles` | Filter, PivotViewer |
| `@cratis/components/renderer/builtin/styles` | Common, DataTables, Dialogs, Display, Dropdown, Notifications |
| `@cratis/components/SchemaEditor/styles` | Common, DataTables, Display, Dropdown, Notifications, SchemaEditor |
| `@cratis/components/TimeMachine/styles` | TimeMachine |
| `@cratis/components/Toolbar/styles` | Common, Notifications, Toolbar |

## What it saves

Indicative gzip transfer at the time of writing, against roughly 32 KiB for the aggregate: about
2 KiB for the shared base, 6.4 KiB for `Dialogs`, 6.1 KiB for `DataTables`, 6.7 KiB for
`PivotViewer`, 4.3 KiB for `TimeMachine`, 2.7 KiB for `Filter`. An application that mounts dialogs
and data tables transfers roughly a third of the aggregate. Exact sizes move with the components;
each entry point has its own reviewed ceiling in the published-archive gate, so none of them can
grow unnoticed.

## Cascade and ordering

Import order between area sheets does not matter. They all write into the single `cratis-components`
layer in the library's own authoring order, and only `styles/base` establishes layer precedence — so
the [cascade contract](index.md#cascade-contract) is identical whichever entry points are used. A
product that names the Cratis layers in its own first `@layer` statement keeps doing so unchanged.

## See also

- [Styling overview](index.md) — the token, structure, and theme layers
- [Set up styling](getting-started.md) — the default import order
- [Stable component parts](pass-through.md) — the supported styling hooks
