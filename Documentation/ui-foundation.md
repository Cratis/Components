---
title: UI foundation
description: How Components owns its public React contracts and delegates selected interaction primitives.
sidebar:
    order: 2
---

Components 4 owns its public React markup, TypeScript types, tokens, documented parts, and component behavior without exposing its internal interaction library as a consumer contract. The public component contract is deliberately coupled to React and the browser DOM: standard HTML attributes, React refs, native element types, form behavior, and DOM event semantics are intentional guarantees. React Aria supplies selected focus, keyboard, overlay, collection, and date interaction primitives internally. These implementation facts do not establish accessibility conformance for every component or application.

## Why this changed

Components 3 shipped with PrimeReact, PrimeIcons, and PrimeUI theme packages as its declared foundation, so installing `@cratis/components` inherited that dependency tree, its release cadence, and its license terms whether or not an application's own code imported Prime directly. Components 4 removes that inherited coupling: the package manifest declares no Prime dependency or peer, and a [release gate](#release-gates) confirms the emitted JavaScript and declarations contain no Prime imports or type references. Components-owned public types, typed parts, `data-cratis-part` state attributes, and server-paged table contracts (see [Table architecture](#table-architecture)) replace the Prime renderer contracts a consumer previously had to target.

Long term, that ownership is what the rest of this page documents: one `--cratis-*` token source instead of a translation chain through a third-party preset, a package/version/license boundary an application controls directly instead of inheriting it transitively (see [Prime dependency boundary](#prime-dependency-boundary)), and a public API surface Components validates and evolves on its own release cadence rather than one bound to an upstream renderer's compatibility timeline. React Aria remains an internal implementation dependency rather than a second inherited public contract — see [Why React Aria](#why-react-aria) — so this change moves ownership to Components rather than moving the same coupling to a different upstream package.

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

“Renderer-independent” here does not mean framework-neutral or DOM-neutral. It means React applications depend on Components-owned markup and types rather than an internal renderer vendor's component types, implementation DOM, or styling hooks. `@cratis/components` intentionally exposes React and native HTML semantics while keeping React Aria and any future internal vendor private. Arc's generated transport/client contracts remain a separate boundary from Components' React composition.

The accepted [DOM-coupled public contract](decisions/0001-dom-coupled-contract.md) records that boundary. The accepted [component classification](decisions/0002-component-classification.md) records which public exports are visual primitives, interaction primitives, high-order composites, or interop-only components.

## Consumer contract

The shipped styling contract contains:

- Semantic color, surface, border, radius, and focus variables under `--cratis-*`.
- Typed `pt` keys for foundation components that support per-instance part attributes.
- Stable `data-cratis-part` values and component-specific state attributes documented in [Stable component parts](Styling/pass-through.md).
- `className` and `style` on public roots where applicable.
- Standard HTML attributes, native element refs, DOM events, and native form semantics where a component exposes them.
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

Components 4 removes the Components 3 component-family namespaces from the root. Imports such as `import { Canvas } from '@cratis/components'` no longer resolve; use `@cratis/components/Canvas` instead. [Migrate from Components 3 to 4](Migration/3-to-4.md) carries the current namespace-to-subpath mapping, codemod command, and stop conditions. The `CommandStepper` mapping is intentionally special: the historical namespace represented the full `CommandDialog` module, so it migrates to `@cratis/components/CommandDialog`; the narrower `@cratis/components/CommandStepper` subpath exports only the standalone component.

## Capability profiles

Components groups its subpaths into three capability profiles for documentation, dependencies, and adoption. The profiles do not assign maturity, accessibility, support, or quality tiers:

- **Foundation** — the components most applications reach for immediately: `Common`, `CommandDialog` (and its `CommandStepper` alias), `CommandForm` (and `CommandForm/fields`), `DataPage`, `DataTables`, `Dialogs`, `Display`, `Dropdown`, `Filter`, `Notifications`, and `types`. Forms, dialogs, tables, and notifications for an ordinary Arc-backed CRUD screen.
- **Advanced React** — specialized, still Pixi-free React surfaces used by fewer applications, or by fewer screens within an application: `Chat`, `ObjectContentEditor`, `ObjectNavigationalBar`, `SchemaEditor`, `TimeMachine`, and `Toolbar`. Conversation and topic surfaces, JSON Schema authoring, object/schema navigation, version scrubbing, and canvas-style tool palettes.
- **Spatial** — pan/zoom and large-dataset visualization surfaces backed by Pixi: `Canvas` and `PivotViewer`. These install the optional `pixi.js` peer; see [Optional Pixi, clean no-Pixi core](#optional-pixi-clean-no-pixi-core).

All three profiles and the setup-only root are exported from the same package version. “Advanced React” and “Spatial” describe purpose and additional dependency shape, not how carefully a component is built, tested, supported, or versioned. Review the exact package manifest, subpath, component documentation, and application evidence for the profile you use.

## Capability matrix

| Capability profile | Subpaths                                                                                                                                                                           | Extra peer                                                                                                      | State Components owns                                                                                       | Data & persistence                                                                                                                                                                                                       | Arc / Chronicle relationship                                                                                                                                                                                      | SSR                                                                                                                                                                                                                                                            | Performance shape                                                                                                                                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Setup** (root)   | `@cratis/components`                                                                                                                                                               | —                                                                                                               | Locale, provider-owned labels, toast-region wiring                                                          | none                                                                                                                                                                                                                     | none                                                                                                                                                                                                              | Renders no browser-only API; safe to import and render on the server                                                                                                                                                                                           | negligible                                                                                                                                                                                                                                               |
| **Foundation**     | `Common`, `CommandDialog` / `CommandStepper`, `CommandForm` / `CommandForm/fields`, `DataPage`, `DataTables`, `Dialogs`, `Display`, `Dropdown`, `Filter`, `Notifications`, `types` | —                                                                                                               | Widget interaction state: open/closed, focus, loaded-page sort/filter, paginator position, toast queue      | Command execution and query results are `@cratis/arc.react` state; Components never fetches, caches, or persists data                                                                                                    | Commands and queries run through Arc; Arc may itself be backed by Chronicle in an event-sourced application, but Components has no direct Chronicle dependency and behaves the same over a plain Arc.Core backend | Every surface that portals or reads `document` (`Dialog`, `FilterPanel`, `Toaster`) gates on a shared `useSyncExternalStore` browser check and renders a stable placeholder until mounted                                                                      | Table/paging cost scales with the loaded page only; complete-result filtering/sorting is a server concern (see [Update tables](Migration/3-to-4.md#update-tables))                                                                                       |
| **Advanced React** | `Chat`, `ObjectContentEditor`, `ObjectNavigationalBar`, `SchemaEditor`, `TimeMachine`, `Toolbar`                                                                                   | —                                                                                                               | Draft, topic selection, local edit-buffer, breadcrumb, scrub-position, and active-tool/expanded-panel state | Host-supplied through props (`messages`, `topics`, `object`, `schema`, `versions`, `navigationPath`, …); `ChatSidebarForObservableQueries` can subscribe through Arc, while Components does not persist application data | Chat offers an optional Arc observable-query binding and optional messenger publication; the other subpaths assume no Arc integration. A Chronicle-backed host may supply any of their data                       | Plain React trees; Chat overlays and `Toolbar` folder/fan-out/slot pieces portal or attach browser listeners and therefore require a browser when those interactions mount                                                                                     | Cost follows the messages/topics/object/schema/version data the host passes; Chat conversations render the supplied message list, while the other surfaces document their own performance shape                                                          |
| **Spatial**        | `Canvas`, `PivotViewer`                                                                                                                                                            | `pixi.js@^8.20.0` (optional, single shared resolution — see [Optional Pixi](#optional-pixi-clean-no-pixi-core)) | Camera/viewport/gesture transforms, measured item bounds, worker/index/filter state                         | Item, shape, and card data is host-supplied; Components renders and lets you query it, never persists it                                                                                                                 | Same as Foundation: an event-sourced host may project Chronicle read models into the data it passes in, but neither component has a Chronicle dependency                                                          | `PIXI.Application` creation and PivotViewer's Web Worker setup run inside effects, guarded and skipped — with a synchronous fallback for the worker — when `window`/`Worker` is unavailable; `CanvasOverlay` uses the same browser-check pattern as Foundation | Pixi rendering and PivotViewer's Web Worker indexing exist specifically to keep large item counts off the DOM and main thread — see [Canvas](Canvas/index.md#dom-and-pixi-layers) and [PivotViewer](PivotViewer/index.md#worker-and-search-architecture) |

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

For the current package, one manifest keeps component and stylesheet reachability under one repository gate rather than introducing multiple manifests that can drift.

## Package split criteria

`@cratis/components` is one npm package covering all three capability profiles today, and stays that way unless a concrete, measured need crosses one of these lines:

- **Peer isolation stops being enough.** The optional `pixi.js` peer plus subpath exports already means a Foundation-only application installs no Pixi code and imports no Pixi module. A split would only remove marginal package-manager or type-resolution overhead beyond what the optional peer already removes — that overhead would need to be measured and real, not assumed.
- **A capability profile needs an independent release cadence.** For example, a Pixi major upgrade that must ship for `Canvas`/`PivotViewer` without forcing a coordinated release of every Foundation and Advanced React component, or vice versa. Today all three profiles share one version and one release process by design — see [Capability profiles](#capability-profiles).
- **A separately owned non-visual contract is proven outside Components' React composition.** The [table architecture](#table-architecture) section keeps Arc query/transport ownership separate from visual table state today.
- **The aggregate CSS manifest is split first.** See [Aggregate CSS today, future split criteria](#aggregate-css-today-future-split-criteria) — a package split typically follows the same boundary as its stylesheets, so splitting packages before an already-justified CSS split would just recreate the drift problem the manifest exists to prevent, across package boundaries instead of within one.

None of these conditions is met today. A single package with subpath exports, an optional Pixi peer, and one aggregate stylesheet already delivers tree-shakeable code, no forced Pixi install, one `--cratis-*` token source, and one release/versioning/CI surface — the practical benefits a split would chase — without a multi-package version matrix to keep compatible across three profiles that already share every build, spec, and release gate.

## Why React Aria

[React Aria Components](https://react-aria.adobe.com/getting-started) is style-free and Apache-2.0 licensed. It supplies difficult interaction behavior such as focus management, keyboard navigation, screen-reader semantics, overlays, collection behavior, and internationalized dates.

Components still owns labels, error association, visual focus, contrast, hit targets, responsive composition, and behavior specs. React Aria is not treated as proof that a composed component is automatically accessible.

The React Aria Components Toast API remains unstable, so Components 4 ships its own queue, dispatch, timer, frame, and accessible region rather than exposing that unstable API.

## Table architecture

Components 4 uses semantic React HTML and Cratis-owned table state. `DataTableCore` is a rendered React component, not a headless or framework-neutral table engine. Arc remains authoritative for server paging. Client filtering and sorting operate only on the loaded page. Complete-result filtering and sorting require consumer-defined query arguments and server query logic that applies them before paging; Components does not automatically forward table state to the server.

The reusable product boundary today is Arc's generated query/transport contract and explicit paging/query arguments—not Components' React table state. Components does not currently export `DataTableCore` as a framework-neutral table engine or forward loaded-page table state to the server automatically.

## Prime dependency boundary

The Components 4 package manifest does not declare PrimeReact, PrimeIcons, PrimeUI, or PrimeUI theme packages as dependencies or peers. Applications that still import those packages directly retain their own package, provider, styling, version, and license boundaries. Review the exact third-party package terms for the version an application keeps; this page makes no licensing conclusion for that application.

## Why Components does not implement every interaction itself

Owning the API does not mean independently rebuilding dialog focus traps, composite keyboard navigation, international calendars, and collection selection. Components delegates selected low-level behaviors to an open specialized foundation and exercises the resulting component behavior through owning repository specs and diagnostics.

Simple controls use semantic native HTML when that is more robust than introducing an abstraction.

## Release sequence

The transition is split by current artifact behavior:

1. Components 3 retains its documented Prime-backed package and migration starting point.
2. Components 4 changes the default foundation, removes Prime runtime/declaration references from its package, and introduces Components-owned provider and styling contracts.
3. The migration guide records the current breaking changes and mechanical import path. It does not establish a support window or future maintenance commitment for either major.

Repository specs compare bounded behaviors needed by the current migration; they do not establish universal behavior parity or accessibility conformance. Adapter authors can run the independently versioned development package `@cratis/components.conformance` against a public `UiLibrary` manifest. The built-in proof manifest is an explicit heavy import from `@cratis/components/renderer/builtin`; neither the package root nor the lean `./renderer` contract subpath reaches its implementation graph. A passing report is evidence only for the exercised manifest and environment, and the separate Storybook browser/axe gate remains required.

## Strict public-type validation

Components 4 validates every public JavaScript subpath as a strict external TypeScript 6 consumer of the actual packed artifact. Run `yarn workspace @cratis/components verify-public-types` after building the package. The verifier creates isolated Bundler and NodeNext fixtures with `skipLibCheck: false`, confirms that TypeScript resolved declarations from the fresh archive rather than source or stale output, and emits a machine-readable report when requested.

Known upstream failures are bounded in `Source/scripts/verify-public-types.exceptions.json`. Each exception names exact installed package versions, diagnostic codes, affected subpaths and resolution modes, and an objective removal condition. Unlisted diagnostics, version/metadata drift, a TypeScript-version mismatch, or an exception that stops reproducing all fail the gate. A diagnostic anchored in a Components declaration is never covered by message matching alone: the same compiler run must also contain the reviewed TS2834/TS2835 root cause under the exact upstream package named by that diagnostic. Synthetic specs prove absent and unrelated root causes remain failures.

The current exceptions are:

- **`@webgpu/types@0.1.72` through `pixi.js@8.20.1`:** its ambient WebGPU declarations conflict with TypeScript 6's built-in DOM declarations for the `Canvas` subpath (`TS2403`, `TS2687`, `TS2717`, `TS6200`). The setup-only root has no Pixi type exception.
- **`@cratis/arc.react@22.5.0`:** its published global JSX declarations expose unresolved identifiers in strict external Bundler consumers of command/dialog subpaths (`TS2503`).
- **`@cratis/arc@22.5.0`, `@cratis/arc.react@22.5.0`, and `@cratis/fundamentals@7.18.1`:** their published ESM declarations use extensionless relative specifiers rejected by NodeNext, with missing-export cascades (`TS2834`, `TS2835`, `TS2305`, `TS2694`). Components' own declaration rewrite emits explicit extensions.

### Why the Canvas Pixi surface remains public

`CanvasContext`, `renderItem`, and pointer callbacks intentionally expose real Pixi objects so consumers can build arbitrary Pixi content. Replacing those types with reduced Cratis facades would either duplicate Pixi's API or force consumers to cast back to it. The bounded WebGPU declaration exception is preferable to weakening this intentional extensibility contract. `pixi.js` is therefore an optional peer: Canvas/PivotViewer consumers install one compatible `^8.20.0` resolution, preventing nested nominally-incompatible Pixi instances while non-Pixi subpaths impose no installation requirement. PivotViewer does not expose Pixi types publicly and needs no equivalent declaration exception.

## Current limitations and work records

Components 4 does not treat adjacent gaps as part of the current package contract:

- Complete-result filtering and sorting remain server-query concerns before paging; loaded-page controls do not supply that behavior.
- Some generated labels and plural/relative text remain outside the current provider-message subset.
- The current package has no Components-owned locale-aware number input.
- Exact-artifact downstream runtime and visual evidence remains part of the major release review.

Repository issues may track these gaps, but an open issue is not a public roadmap or delivery commitment.

## Post-V4 issue index

The following issues preserve follow-up decisions outside the Components 4 contract. They are
tracking records, not promises that an unstable API already exists or will ship unchanged:

| Issue                                                   | Tracked decision or evidence gap                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [#207](https://github.com/Cratis/Components/issues/207) | Owner-authorized Components 4 publication; publication remains disabled until that separate review completes. |
| [#208](https://github.com/Cratis/Components/issues/208) | Proof and possible promotion of atomic slots and mixed-renderer islands.                                      |
| [#209](https://github.com/Cratis/Components/issues/209) | Schema-driven public renderer discovery tooling.                                                              |
| [#210](https://github.com/Cratis/Components/issues/210) | Lazy renderer preload semantics for streaming server rendering.                                               |
| [#211](https://github.com/Cratis/Components/issues/211) | Cross-browser and assistive-technology renderer certification.                                                |
| [#212](https://github.com/Cratis/Components/issues/212) | CSS theme bridges and vendor portal-interoperability recipes.                                                 |
| [#213](https://github.com/Cratis/Components/issues/213) | Source-map preservation through ESM specifier rewriting.                                                      |
| [#214](https://github.com/Cratis/Components/issues/214) | Evidence for or against a renderer-exclusive slim distribution.                                               |
| [#215](https://github.com/Cratis/Components/issues/215) | Reviewed dependency-update pull requests.                                                                     |
| [#216](https://github.com/Cratis/Components/issues/216) | Packed public-API snapshots and semantic-version surface diffs.                                               |
| [#217](https://github.com/Cratis/Components/issues/217) | Generated evidence inventories instead of hardcoded check counts.                                             |
| [#218](https://github.com/Cratis/Components/issues/218) | Renderer bundle and runtime-performance regression budgets.                                                   |

Until those issues produce reviewed changes, the stable boundary remains the setup-only root, the
exact nine-slot `stable-presentation/v1` profile, boolean setup attestations, and
`CratisOverlayEnvironment`.

## Release gates

The Components 4 major candidate uses these repository release checks:

- Emitted JavaScript and declarations contain no Prime imports or type references.
- Real npm, strict pnpm, and Yarn PnP packed consumers pass with Pixi both absent and present; present topologies prove Components and the consumer resolve one Pixi instance.
- The setup root and every non-spatial subpath load without Pixi, while Canvas and PivotViewer fail specifically on the missing optional peer until it is installed.
- Declared Arc peer versions are exercised against the packed artifact.
- Representative custom-theme and pass-through consumers compile after following the guide.
- Specs, Storybook, package exports, SSR, keyboard/focus behavior, responsive layouts, dark mode, forced colors, and reduced motion pass.
- The migration guide works without repository-specific knowledge.
- Every packed public JavaScript subpath passes strict TypeScript 6 validation or matches a bounded machine-readable upstream exception with exact installed versions and an unmet removal condition. Components-owned cascades additionally require their matching upstream TS2834/TS2835 root cause in the same compiler run.

Generated conformance reports, the checked-in compatibility contract, and `release.md` at the
repository root own the exact current evidence and publication limitations.
