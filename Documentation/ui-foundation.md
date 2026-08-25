---
title: UI foundation
description: Why Components owns its public design system and uses React Aria for accessible behavior.
sidebar:
    order: 2
---

Components 4 gives Cratis applications a stable UI API without exposing a mandatory rendering kit. The package owns its markup, TypeScript types, tokens, stable parts, and product-level behavior. React Aria supplies complex accessible interaction behavior internally.

## Shipped architecture

```mermaid
graph TD
    App[Consumer application] --> Components[@cratis/components]
    Components --> Contracts[Cratis-owned APIs, parts, tokens, and state attributes]
    Components --> Aria[React Aria interaction behavior]
    Components --> Native[Semantic native HTML]
    Components --> Arc[@cratis/arc.react bindings]
```

Consumers import `@cratis/components/*`. React Aria does not appear in public prop types, declarations, or styling contracts. Arc command, query, and dialog bindings remain owned by `@cratis/arc.react`; Components builds visual behavior around them.

“Renderer-independent” here means that React applications depend on Cratis-owned contracts rather than one internal React renderer. `@cratis/components` is still a React package. A future Vue, Svelte, or other frontend should use Arc's transport/client contracts and framework-native bindings; genuinely cross-framework behavior belongs in Arc only after a second implementation proves that seam.

## Consumer contract

The shipped styling contract contains:

- Semantic color, surface, border, radius, and focus variables under `--cratis-*`.
- Typed `pt` keys for foundation components that support per-instance part attributes.
- Stable `data-cratis-part` values and component-specific state attributes documented in [Stable component parts](Styling/pass-through.md).
- `className` and `style` on public roots where applicable.
- Baseline light/dark/forced-colors values in the optional theme.

Spacing, typography, motion, elevation, and product-specific dimensions remain product design-system concerns unless a component documents a dedicated token or prop. A product can map its own token families to the Cratis semantic values and style stable parts without targeting React Aria DOM.

## Import surface: setup-only root, explicit subpaths

The canonical import rule: **the package root is setup-only; every component ships from its own subpath.**

```ts
// Setup surface — root
import { CratisComponentsProvider } from '@cratis/components';

// Components — explicit subpaths
import { CommandDialog } from '@cratis/components/CommandDialog';
import { DataTableForQuery, Column } from '@cratis/components/DataTables';
import { Canvas, CanvasItem } from '@cratis/components/Canvas';
```

`@cratis/components` intentionally exports only `CratisComponentsProvider`, `useCratisComponentsConfig`, `cratisDefaults`, `mergeCratisComponentsConfig`, and their config/props/message types — the setup every application needs once, regardless of which components it uses. Every component family, in every [capability profile](#capability-profiles), is reached through its own subpath and never through the root.

Components 4 removes the Components 3 root namespace bridge. Imports such as `import { Canvas } from '@cratis/components'` no longer resolve; use `@cratis/components/Canvas` instead. [Migrate from Components 3 to 4](migration.md) carries the complete namespace-to-subpath mapping and the public codemod command. One compatibility nuance is encoded there and in the tooling: the historical root `CommandStepper` namespace represented the entire `CommandDialog` module, so it migrates to `@cratis/components/CommandDialog`; the narrower `@cratis/components/CommandStepper` subpath still exports only `CommandStepper`.

## Capability profiles

Components groups its subpaths into three capability profiles — a documentation and adoption grouping, not a support tier:

- **Foundation** — the components most applications reach for immediately: `Common`, `CommandDialog` (and its `CommandStepper` alias), `CommandForm` (and `CommandForm/fields`), `DataPage`, `DataTables`, `Dialogs`, `Display`, `Dropdown`, `Filter`, `Notifications`, and `types`. Forms, dialogs, tables, and notifications for an ordinary Arc-backed CRUD screen.
- **Advanced React** — specialized, still Pixi-free React surfaces used by fewer applications, or by fewer screens within an application: `ObjectContentEditor`, `ObjectNavigationalBar`, `SchemaEditor`, `TimeMachine`, and `Toolbar`. JSON Schema authoring, object/schema navigation, version scrubbing, and canvas-style tool palettes.
- **Spatial** — pan/zoom and large-dataset visualization surfaces backed by Pixi: `Canvas` and `PivotViewer`. These install the optional `pixi.js` peer; see [Optional Pixi, clean no-Pixi core](#optional-pixi-clean-no-pixi-core).

**Equal support, not weaker semver.** All three profiles, and the setup-only root, ship from the same package at the same version, pass the same [release gates](#release-gates) — build, specs, Storybook, package-export verification, SSR, accessibility, and strict public-type validation — and follow the same single semver line. A breaking change to `Toolbar` bumps the same major version as a breaking change to `DataTableForQuery`. "Advanced React" and "Spatial" describe what a component is _for_ and what it costs to adopt (peer install, bundle shape, typical audience) — never how carefully it is built, tested, or versioned.

## Capability matrix

| Capability profile | Subpaths                                                                                                                                                                           | Extra peer                                                                                                      | State Components owns                                                                                  | Data & persistence                                                                                                                                  | Arc / Chronicle relationship                                                                                                                                                                                      | SSR                                                                                                                                                                                                                                                            | Performance shape                                                                                                                                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Setup** (root)   | `@cratis/components`                                                                                                                                                               | —                                                                                                               | Locale, provider-owned labels, toast-region wiring                                                     | none                                                                                                                                                | none                                                                                                                                                                                                              | Renders no browser-only API; safe to import and render on the server                                                                                                                                                                                           | negligible                                                                                                                                                                                                                                               |
| **Foundation**     | `Common`, `CommandDialog` / `CommandStepper`, `CommandForm` / `CommandForm/fields`, `DataPage`, `DataTables`, `Dialogs`, `Display`, `Dropdown`, `Filter`, `Notifications`, `types` | —                                                                                                               | Widget interaction state: open/closed, focus, loaded-page sort/filter, paginator position, toast queue | Command execution and query results are `@cratis/arc.react` state; Components never fetches, caches, or persists data                               | Commands and queries run through Arc; Arc may itself be backed by Chronicle in an event-sourced application, but Components has no direct Chronicle dependency and behaves the same over a plain Arc.Core backend | Every surface that portals or reads `document` (`Dialog`, `FilterPanel`, `Toaster`) gates on a shared `useSyncExternalStore` browser check and renders a stable placeholder until mounted                                                                      | Table/paging cost scales with the loaded page only; complete-result filtering/sorting is a server concern (see [Update tables](migration.md#update-tables))                                                                                              |
| **Advanced React** | `ObjectContentEditor`, `ObjectNavigationalBar`, `SchemaEditor`, `TimeMachine`, `Toolbar`                                                                                           | —                                                                                                               | Local edit-buffer, breadcrumb, scrub-position, and active-tool/expanded-panel state                    | 100% host-supplied through props (`object`, `schema`, `versions`, `navigationPath`, …) — none of these components fetch, cache, or persist anything | None built in and none assumed; each page documents how a Chronicle-backed host typically supplies its data                                                                                                       | Plain React trees; `Toolbar`'s folder/fan-out/slot pieces use the same browser-detection pattern as Foundation where they portal or attach `document` listeners                                                                                                | Cost is proportional to the object/schema/version data the host passes in — see each page's own performance note                                                                                                                                         |
| **Spatial**        | `Canvas`, `PivotViewer`                                                                                                                                                            | `pixi.js@^8.20.0` (optional, single shared resolution — see [Optional Pixi](#optional-pixi-clean-no-pixi-core)) | Camera/viewport/gesture transforms, measured item bounds, worker/index/filter state                    | Item, shape, and card data is host-supplied; Components renders and lets you query it, never persists it                                            | Same as Foundation: an event-sourced host may project Chronicle read models into the data it passes in, but neither component has a Chronicle dependency                                                          | `PIXI.Application` creation and PivotViewer's Web Worker setup run inside effects, guarded and skipped — with a synchronous fallback for the worker — when `window`/`Worker` is unavailable; `CanvasOverlay` uses the same browser-check pattern as Foundation | Pixi rendering and PivotViewer's Web Worker indexing exist specifically to keep large item counts off the DOM and main thread — see [Canvas](Canvas/index.md#dom-and-pixi-layers) and [PivotViewer](PivotViewer/index.md#worker-and-search-architecture) |

## Optional Pixi, clean no-Pixi core

Only the Spatial profile touches Pixi. `Canvas` and `PivotViewer` are the only subpaths that import `pixi.js`; every Foundation and Advanced React subpath — including `Toolbar`, which looks canvas-adjacent by name — is plain React and DOM, with no Pixi reference anywhere in its module graph.

`pixi.js` is declared as an **optional peer** (`peerDependenciesMeta: { "pixi.js": { "optional": true } }`), not a Components dependency:

```bash
npm install pixi.js@^8.20.0
```

Install it once, in the application, only if that application uses `Canvas` or `PivotViewer`. Every other subpath needs nothing beyond React, Arc, and Fundamentals.

**Single-peer rule.** Keep exactly one compatible Pixi resolution across the application and Components — never a nested copy pulled in only for Components. Two installed copies of `pixi.js` produce nominally incompatible `PIXI.Container` and pointer-event types even when both satisfy `^8.20.0`, because TypeScript treats structurally similar classes from two different module instances as distinct nominal types. This is why `CanvasContext`, `renderItem`, and Canvas's pointer callbacks intentionally expose real Pixi types rather than a reduced Cratis facade: consumers build arbitrary Pixi content against the one Pixi instance the application already owns, and Components does not shadow it with a second one. `PivotViewer` uses Pixi internally for its card rendering but does not expose Pixi types publicly, so it needs no equivalent declaration exception (see [Strict public-type validation](#strict-public-type-validation)).

**DOM and Pixi as siblings, not a replacement.** Within the Spatial profile, `Canvas` itself composes two independent rendering layers rather than choosing one: arbitrary DOM content, positioned through `CanvasItem` and ordinary CSS transforms, and an optional Pixi `items`/`renderItem` layer for item counts where per-item DOM nodes would be the bottleneck. An application can use only the DOM layer (no `items`/`renderItem`, so no Pixi content ever mounts) or mix both in the same `Canvas`. See [Canvas: DOM and Pixi layers](Canvas/index.md#dom-and-pixi-layers).

Everything Pixi-related — the peer, the install, the single-resolution rule, and the type-validation exception it requires — is a Spatial-profile concern. Choosing Foundation or Advanced React components never pulls Pixi into an application's dependency graph, install size, or type-checking surface.

## Aggregate CSS today, future split criteria

`@cratis/components/styles` is one manifest — `Source/styles.css` — that `@import`s every component's stylesheet, across all three capability profiles, into one compiled `dist/esm/styles.css`. Component modules import no CSS themselves; every rule reaches the browser through this single entry point. That is a deliberate constraint, not an oversight: a CSS import inside the component JavaScript module graph is what made a previous published ESM unloadable from Node (`ERR_UNKNOWN_FILE_EXTENSION` on any subpath a spec or SSR run touched), so Components' build fails if a `.css` file under `Source/` is not reachable from the manifest — the styles and the components cannot drift apart.

This means Foundation, Advanced React, and Spatial CSS all ship together today: importing `@cratis/components/styles` once loads Canvas's and PivotViewer's rules alongside Dialog's and DataTable's, whether or not the application ever renders `Canvas`. That is an acceptable, and currently the simplest, aggregate cost — plain CSS custom properties and class rules are inert until a matching class or `data-cratis-part` renders, so unused component CSS costs parse time on an already-small stylesheet, not runtime behavior, layout, or a Pixi/JavaScript dependency.

The packed archive gate makes that trade-off measurable and fail-closed. The aggregate stylesheet currently has reviewed ceilings of **200 KiB raw**, **32 KiB gzip**, and **1,200 declaration blocks**. A change that crosses a ceiling must either reduce the payload or update the budget with measured consumer evidence; it cannot grow silently.

A future split — for example, a separate `@cratis/components/styles/spatial` alongside a slimmer default — would only be justified once one of these becomes true and measured, not merely theoretical:

- The aggregate manifest's compiled size becomes large enough that a Foundation-only application's CSS payload is a demonstrated problem, not a stylistic preference.
- A capability profile needs an independently versioned or independently loaded stylesheet — for example, a CDN-hosted or lazily loaded Spatial bundle separate from the application shell.
- Splitting no longer risks the two-file drift the single manifest exists to prevent, or the build gate that enforces it is extended to cover multiple manifests without weakening it.

Until then, one manifest is simpler to keep correct than several kept in sync, and it matches the "equal support" statement in [Capability profiles](#capability-profiles): no profile's styling is a second-class, separately loaded concern.

## Package split criteria

`@cratis/components` is one npm package covering all three capability profiles today, and stays that way unless a concrete, measured need crosses one of these lines:

- **Peer isolation stops being enough.** The optional `pixi.js` peer plus subpath exports already means a Foundation-only application installs no Pixi code and imports no Pixi module. A split would only remove marginal package-manager or type-resolution overhead beyond what the optional peer already removes — that overhead would need to be measured and real, not assumed.
- **A capability profile needs an independent release cadence.** For example, a Pixi major upgrade that must ship for `Canvas`/`PivotViewer` without forcing a coordinated release of every Foundation and Advanced React component, or vice versa. Today all three profiles share one version and one release process by design — see [Capability profiles](#capability-profiles).
- **A second framework binding needs to reuse non-visual logic without pulling in React-specific Spatial code.** The [table architecture](#table-architecture) section already anticipates this for an Arc React query/table binding; the same reasoning would apply to any Foundation/Advanced React logic a future Vue or Svelte binding wants to share, while Spatial's Pixi/React composition would not be reusable as-is regardless of packaging.
- **The aggregate CSS manifest is split first.** See [Aggregate CSS today, future split criteria](#aggregate-css-today-future-split-criteria) — a package split typically follows the same boundary as its stylesheets, so splitting packages before an already-justified CSS split would just recreate the drift problem the manifest exists to prevent, across package boundaries instead of within one.

None of these conditions is met today. A single package with subpath exports, an optional Pixi peer, and one aggregate stylesheet already delivers tree-shakeable code, no forced Pixi install, one `--cratis-*` token source, and one release/versioning/CI surface — the practical benefits a split would chase — without a multi-package version matrix to keep compatible across three profiles that already share every build, spec, and release gate.

## Why React Aria

[React Aria Components](https://react-aria.adobe.com/getting-started) is style-free and Apache-2.0 licensed. It supplies difficult interaction behavior such as focus management, keyboard navigation, screen-reader semantics, overlays, collection behavior, and internationalized dates.

Components still owns labels, error association, visual focus, contrast, hit targets, responsive composition, and behavior specs. React Aria is not treated as proof that a composed component is automatically accessible.

The React Aria Components Toast API remains unstable, so Components 4 ships its own queue, dispatch, timer, frame, and accessible region rather than exposing that unstable API.

## Table architecture

Components 4 uses semantic React HTML and Cratis-owned table state. `DataTableCore` is a rendered React component, not a headless or framework-neutral table engine. Arc remains authoritative for server paging. Client filtering and sorting operate only on the loaded page. Complete-result filtering and sorting require consumer-defined query arguments and server query logic that applies them before paging; Components does not automatically forward table state to the server.

The reusable cross-framework seam today is Arc's generated query/transport contract and explicit paging/query arguments—not Components' React table state. [Issue #109](https://github.com/Cratis/Components/issues/109) tracks a possible headless Arc React query/table binding. It should be designed in Arc React, separately from visual policy, and only after real consumer implementations establish the required sorting, filtering, selection, and observable-query state. A future Vue or Svelte binding would build framework-native state over the same Arc transport contract rather than reuse `DataTableCore`.

[TanStack Table](https://tanstack.com/table/latest/docs/overview) was evaluated but is not a Components 4 dependency. It remains a possible future implementation tool if advanced grouping, pinning, faceting, or sizing creates enough state complexity to justify it. Adopting it would not change the Cratis public contract.

## Why PrimeReact is no longer the default

PrimeReact 11 has a capable layered architecture, but PrimeUI's consumer contract is unsuitable as an invisible mandatory dependency of a general Cratis framework.

Two facts about that contract are directly verifiable. First, PrimeReact 11 enforces licensing at runtime: `PrimeReactProvider` verifies a PrimeUI license key when it mounts, with no condition on unstyled rendering, on the applied theme, or on the build environment — verified against the published `@primereact/core` 11.1.0 artifact. Without a valid key the application logs a warning and shows a fixed _"Invalid PrimeUI License"_ banner, in development and production. Verification is offline — a signature check against an embedded public key, with no telemetry. Second, the upstream `primefaces/primereact` repository is archived; PrimeReact development continues under the commercial PrimeUI model, and only the pre-11 MIT versions remain MIT. A mandatory dependency with runtime license enforcement and no open-source development line cannot sit invisibly underneath every Cratis application.

The [PrimeUI Community License](https://primeui.dev/licenses/community) says developers building on an internal wrapper or design system still need seats. Eligibility excludes organizations by revenue, team size, funding, or public-sector status. The [OEM guidance](https://primeui.dev/licenses/oem) identifies frameworks and SDKs used for third-party development as potential OEM uses while not clarifying peer-only open-source wrappers.

No `@cratis/components.primereact` package is published. Such a package is only a conditional future option and requires written PrimeTek confirmation first. Consumers that need the old implementation remain on the Components 3 release line while migrating.

This documentation summarizes public terms for architectural transparency; it is not legal advice. Consumers must consult the current authoritative license terms and their own counsel.

## Why Components does not implement every interaction itself

Owning the API does not mean independently rebuilding dialog focus traps, composite keyboard navigation, international calendars, and collection selection. Components delegates those low-level behaviors to an open specialized foundation and verifies the composed result.

Simple controls use semantic native HTML when that is more robust than introducing an abstraction.

## Release sequence

The transition was deliberately split:

1. Components 3 received a source-compatible stabilization release with accessibility, localization, filtering, notification, and paging fixes while retaining explicit PrimeUI requirements.
2. Components 4 changes the default foundation, removes Prime runtime/declaration references, and introduces Cratis-owned provider and styling contracts.
3. Components 3 remains the temporary compatibility line for applications that cannot migrate atomically, receiving security and critical defect fixes but no new features or foundation work.

The stabilization specs are the behavior parity contract for Components 4.

## Strict public-type validation

Components 4 validates every public JavaScript subpath as a strict external TypeScript 6 consumer of the actual packed artifact. Run `yarn workspace @cratis/components verify-public-types` after building the package. The verifier creates isolated Bundler and NodeNext fixtures with `skipLibCheck: false`, confirms that TypeScript resolved declarations from the fresh archive rather than source or stale output, and emits a machine-readable report when requested.

Known upstream failures are bounded in `Source/scripts/verify-public-types.exceptions.json`. Each exception names exact installed package versions, diagnostic codes, affected subpaths and resolution modes, and an objective removal condition. Unlisted diagnostics, version/metadata drift, a TypeScript-version mismatch, or an exception that stops reproducing all fail the gate. A diagnostic anchored in a Components declaration is never covered by message matching alone: the same compiler run must also contain the reviewed TS2834/TS2835 root cause under the exact upstream package named by that diagnostic. Synthetic specs prove absent and unrelated root causes remain failures.

The current exceptions are:

- **`@webgpu/types@0.1.72` through `pixi.js@8.20.0`:** its ambient WebGPU declarations conflict with TypeScript 6's built-in DOM declarations for the `Canvas` subpath (`TS2403`, `TS2687`, `TS2717`, `TS6200`). The setup-only root has no Pixi type exception.
- **`@cratis/arc.react@22.1.0`:** its published global JSX declarations expose unresolved identifiers in strict external Bundler consumers of command/dialog subpaths (`TS2503`).
- **`@cratis/arc@22.1.0`, `@cratis/arc.react@22.1.0`, and `@cratis/fundamentals@7.18.1`:** their published ESM declarations use extensionless relative specifiers rejected by NodeNext, with missing-export cascades (`TS2834`, `TS2835`, `TS2305`, `TS2694`). Components' own declaration rewrite emits explicit extensions.

### Why the Canvas Pixi surface remains public

`CanvasContext`, `renderItem`, and pointer callbacks intentionally expose real Pixi objects so consumers can build arbitrary Pixi content. Replacing those types with reduced Cratis facades would either duplicate Pixi's API or force consumers to cast back to it. The bounded WebGPU declaration exception is preferable to weakening this intentional extensibility contract. `pixi.js` is therefore an optional peer: Canvas/PivotViewer consumers install one compatible `^8.20.0` resolution, preventing nested nominally-incompatible Pixi instances while non-Pixi subpaths impose no installation requirement. PivotViewer does not expose Pixi types publicly and needs no equivalent declaration exception.

## Tracked follow-up work

Components 4 deliberately does not pretend every adjacent problem is solved by this renderer change:

- [#109](https://github.com/Cratis/Components/issues/109) tracks a future Arc React query/table state binding, to be extracted only after another renderer proves the contract.
- [#178](https://github.com/Cratis/Components/issues/178) tracks explicit complete-result filtering and sorting through server query arguments before paging. The deprecated `clientFiltering` compatibility prop is not that solution.
- [#174](https://github.com/Cratis/Components/issues/174) tracks localization beyond the pre-stable provider-message tranche, including generated labels and plural/relative text.
- [#175](https://github.com/Cratis/Components/issues/175) tracks a locale-aware number input so products can remove specialized Prime inputs without losing number UX.
- [#179](https://github.com/Cratis/Components/issues/179) tracks the exact-artifact downstream RC runtime and visual pilots required before stable release.

These are follow-up contracts, not undocumented work required to use the Components 4 foundation.

## Release gates

Components 4 is accepted only when:

- Emitted JavaScript and declarations contain no Prime imports or type references.
- A real npm packed consumer installs and runs with Pixi absent; strict pnpm and Yarn PnP consumers pass with Pixi both absent and present, and the present topology proves Components and the consumer resolve one Pixi instance.
- The setup root and every non-spatial subpath load without Pixi, while Canvas and PivotViewer fail specifically on the missing optional peer until it is installed.
- Supported Arc versions load from the packed artifact.
- Representative custom-theme and pass-through consumers compile after following the guide.
- Specs, Storybook, package exports, SSR, keyboard/focus behavior, responsive layouts, dark mode, forced colors, and reduced motion pass.
- The migration guide works without repository-specific knowledge.
- Every packed public JavaScript subpath passes strict TypeScript 6 validation or matches a bounded machine-readable upstream exception with exact installed versions and an unmet removal condition. Components-owned cascades additionally require their matching upstream TS2834/TS2835 root cause in the same compiler run.

Track acceptance evidence in [the UI foundation issue](https://github.com/Cratis/Components/issues/170).
