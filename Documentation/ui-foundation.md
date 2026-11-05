---
title: Cratis Components UI foundation and public contracts
description: Cratis Components gives React apps public UI contracts for markup, styling, and Arc bindings, with optional renderer adapters and Pixi-backed views.
---

Cratis Components gives React applications UI contracts for command forms, query-backed tables, and other interactive views. Use it when you want those screens to share typed props and styling hooks while Arc handles command and query execution. Components owns the public markup, types, and behavior; it does not provide a framework-neutral UI layer or require Chronicle.

That ownership lets you style documented parts instead of depending on an internal library's markup. It also sets an adoption boundary: Components uses React and browser DOM semantics, and an optional renderer adapter changes selected controls rather than replacing an entire screen.

## Why this changed

Components 3 used PrimeReact, PrimeIcons, and PrimeUI theme packages as its foundation. Components 4 removes Prime dependencies and peers from `@cratis/components`. Its [release gates](#release-gates) check that emitted JavaScript and declarations contain no Prime imports or type references.

If you are migrating, target Components-owned props, typed parts, `data-cratis-part` attributes, and [table contracts](#table-architecture) rather than the former Prime renderer contracts. Styling uses `--cratis-*` tokens instead of a third-party theme preset. Direct Prime usage in your application remains your responsibility; see the [Prime dependency boundary](#prime-dependency-boundary). React Aria still supplies selected interactions internally, but is not a public styling or prop contract; [Why React Aria](#why-react-aria) explains that choice.

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

The public contract deliberately uses React refs, native HTML attributes and element types, DOM events, and native form behavior where each component exposes them. “Renderer-independent” means you target Components' contract rather than an internal vendor's types or styling hooks. It does not mean the components can render in another frontend framework.

Arc owns command and query execution and its generated client contracts. Components adds visual interaction around those contracts. Chronicle can supply the backend's event history and projected read models, but Components has no direct Chronicle dependency. An Arc backend using current-state storage can serve the same kind of UI; persistence is a backend choice, not a renderer choice.

The accepted [DOM-coupled public contract](decisions/0001-dom-coupled-contract.md) records that boundary. The accepted [component classification](decisions/0002-component-classification.md) records which public exports are visual primitives, interaction primitives, high-order composites, or interop-only components.

## Consumer contract

To integrate an existing design system, use the documented styling surfaces:

- Semantic color, surface, border, radius, and focus variables under `--cratis-*`.
- Typed `pt` keys for foundation components that support per-instance part attributes.
- Stable `data-cratis-part` values and component-specific state attributes documented in [Stable component parts](Styling/pass-through.md).
- `className` and `style` on public roots where applicable.
- Standard HTML attributes, native element refs, DOM events, and native form semantics where a component exposes them.
- Baseline light/dark/forced-colors values in the optional theme.

Spacing, typography, motion, elevation, and product-specific dimensions remain product design-system concerns unless a component documents a dedicated token or prop. A product can map its own token families to the Cratis semantic values and style stable parts without targeting React Aria DOM.

## Import surface: setup-only root, explicit subpaths

Import application-wide setup from the package root and components from explicit subpaths. These imports illustrate the boundary; they are not a complete application setup:

```ts
// Setup surface — root
import { CratisComponentsProvider } from '@cratis/components';

// Components — explicit subpaths
import { CommandDialog } from '@cratis/components/CommandDialog';
import { DataTableForQuery, Column } from '@cratis/components/DataTables';
import { Canvas, CanvasItem } from '@cratis/components/Canvas';
```

The root exports `CratisComponentsProvider`, `useCratisComponentsConfig`, `cratisDefaults`, `mergeCratisComponentsConfig`, `useCratisIcon`, and configuration, message, icon, and dialog integration types. Component families in every [capability profile](#capability-profiles) are reached through their own subpaths, not the root.

Components 4 removes the Components 3 component-family namespaces from the root. Imports such as `import { Canvas } from '@cratis/components'` no longer resolve; use `@cratis/components/Canvas` instead. [Migrate from Components 3 to 4](Migration/3-to-4.md) carries the current namespace-to-subpath mapping, codemod command, and stop conditions. The `CommandStepper` mapping is intentionally special: the historical namespace represented the full `CommandDialog` module, so it migrates to `@cratis/components/CommandDialog`; the narrower `@cratis/components/CommandStepper` subpath exports only the standalone component.

## Capability profiles

The profiles below help you choose which subpaths to use. They group components by purpose and dependency needs, not by separate packages or release versions:

- Foundation covers forms, dialogs, tables, and notifications: `Common`, `CommandDialog`, `CommandStepper`, `CommandForm`, `CommandForm/fields`, `DataPage`, `DataTables`, `Dialogs`, `Display`, `Dropdown`, `Filter`, `Notifications`, and `types`.
- Advanced React covers more specialized screens: `Chat`, `ObjectContentEditor`, `ObjectNavigationalBar`, `SchemaEditor`, `TimeMachine`, and `Toolbar`. These use React and DOM rendering without Pixi.
- Spatial covers `Canvas` and `PivotViewer`, which require the optional `pixi.js` peer; see [Optional Pixi, clean no-Pixi core](#optional-pixi-clean-no-pixi-core).

All three profiles and the setup-only root share one package version. The package also exports controls such as `ConfigurationEditor`, `IconPicker`, and `MarkdownEditor`; the profiles are an adoption guide, not an exhaustive export list. Check the package manifest and the component's own documentation for its exact requirements.

## Capability matrix

| Surface | Use it for | Data boundary | Pixi required? |
| --- | --- | --- | --- |
| Setup root | Locale, messages, icons, and provider configuration | No Arc or Pixi import in the root's runtime or declaration graph | No |
| Foundation | Forms, dialogs, and query-backed tables | Arc executes commands and queries; Components owns visual interaction state | No |
| Advanced React | Conversations, editors, navigation, and tool palettes | Mostly host-supplied props; Chat also offers Arc query and messaging bindings | No |
| Spatial | Pan/zoom views and card collections | The host supplies items; Components owns viewport and visualization state | Yes, one shared compatible `pixi.js` resolution |

Components does not persist application data. Local-data components can render values you supply without using an Arc query, but that does not remove the package's declared peer requirements. React 19, ReactDOM 19, Arc, Fundamentals, and `reflect-metadata` are declared peers; Pixi and `tsyringe` are optional peers. The setup-only root has no Arc import edge even though the package declares Arc peers.

Server rendering also differs from browser interaction. Importing a surface without Pixi is a dependency guarantee, not proof that every interaction works on the server. Portals, focus handling, canvas rendering, and workers need their documented browser setup. Use the [Canvas](Canvas/index.md#dom-and-pixi-layers) and [PivotViewer](PivotViewer/index.md#worker-and-search-architecture) references for their rendering and worker boundaries. For existing tables, [Update tables](Migration/3-to-4.md#update-tables) explains the move to loaded-page controls.

## Optional Pixi, clean no-Pixi core

Only the Spatial profile touches Pixi. `Canvas` and `PivotViewer` are the only subpaths that import `pixi.js`; every Foundation and Advanced React subpath — including `Toolbar`, which looks canvas-adjacent by name — is plain React and DOM, with no Pixi reference anywhere in its module graph.

`pixi.js` is declared as an **optional peer** (`peerDependenciesMeta: { "pixi.js": { "optional": true } }`), not a Components dependency:

```bash
npm install pixi.js@^8.20.0
```

Install it in the application only when using `Canvas` or `PivotViewer`. Keep one compatible Pixi resolution shared by the application and Components. Duplicate installations can give `PIXI.Container` and pointer-event types incompatible identities, even when their versions satisfy the same peer range.

Canvas exposes real Pixi objects through `CanvasContext`, `renderItem`, and pointer callbacks so you can build content against that shared instance. PivotViewer uses Pixi internally without exposing those types. See [Strict public-type validation](#strict-public-type-validation) for the version boundary that affects strict TypeScript consumers.

Canvas can combine DOM content positioned through `CanvasItem` with a Pixi `items`/`renderItem` layer. You can use only the DOM layer, or mix both; importing the Canvas subpath still requires the Pixi peer. [Canvas: DOM and Pixi layers](Canvas/index.md#dom-and-pixi-layers) explains when to choose each layer. Foundation and Advanced React imports do not require Pixi.

## Aggregate CSS plus per-area entry points

Component JavaScript does not import CSS. Choose either the aggregate `@cratis/components/styles` or the shared `@cratis/components/styles/base` with the per-area sheets your application needs, such as `@cratis/components/Dialogs/styles` and `@cratis/components/PivotViewer/styles`.

The aggregate is the simpler setup: it includes styling across all three profiles, including components you do not render. That costs CSS transfer and parsing, but does not import Pixi or component JavaScript. Per-area sheets let a smaller application avoid unrelated styles. Follow [Per-area stylesheets](Styling/per-area-stylesheets.md) for the required base and component imports.

Both paths derive from `Source/styles.css`. Per-area output follows the component's module graph, so a sheet includes styles for the areas its implementation uses, not only its own folder. Keeping CSS outside the JavaScript graph also lets Node import component modules without trying to load `.css` files. The package checks stylesheet coverage and emitted exports, and the archive verifier enforces raw-size, gzip-size, and declaration-block budgets.

Separate stylesheets do not mean separate packages or release versions. The next section explains that distinction.

## Package split criteria

`@cratis/components` ships the three [capability profiles](#capability-profiles) together. Subpath imports isolate JavaScript dependencies, and [per-area styles](#aggregate-css-plus-per-area-entry-points) let you select CSS, but installing the package still gives you its full distribution. Choosing only Foundation does not create a smaller npm package or a separate upgrade schedule.

A package split would address a different need: a smaller installed distribution, independent release versions, or a separately supported non-visual contract. The current package does not offer those boundaries. In particular, [table state](#table-architecture) remains part of React composition, not a separately exported framework-neutral engine.

## Renderer adapters

Use the built-in renderer by mounting `CratisComponentsProvider` without a `library` prop. If your application already uses another control library, an adapter can change the presentation of nine primitives through the `stable-presentation/v1` profile: button, icon button, text input, text area, checkbox, radio, switch, progress, and surface.

An adapter does not replace `CommandForm`, `CommandDialog`, `DataTables`, `Canvas`, or other Components compositions. It also does not replace Arc's provider or execution state. The public renderer contract lives at `@cratis/components/renderer`; importing it or the setup root does not load the full built-in manifest. That manifest is an explicit import from `@cratis/components/renderer/builtin`.

Keep vendor providers, themes, credentials, and caches in application setup. `CratisRendererSetup` carries only adapter-declared boolean setup assertions, not those resources. `CratisOverlayEnvironment` lets the host resolve a portal container; it does not merge vendor overlay or z-index systems. When both systems open overlays, the application must coordinate their containers, layers, and focus behavior.

[Renderer adapters and coexistence](renderers/index.md) explains adapter selection and vendor setup. Broader renderer APIs retain their `unstable_` names and are outside the nine-slot compatibility contract.

## Why React Aria

[React Aria Components](https://react-aria.adobe.com/getting-started) supplies selected focus, keyboard, screen-reader, overlay, collection, and date interactions without supplying Components' visual design.

Components still owns labels, error association, visual focus, contrast, hit targets, responsive composition, and behavior specs. React Aria is not treated as proof that a composed component is automatically accessible.

Components 4 supplies its own toast queue, dispatch, timer, frame, and accessible region rather than exposing React Aria's Toast API.

## Table architecture

A query-backed table combines two responsibilities. Arc retrieves and pages query results; Components renders semantic HTML and manages the table's visual interaction state. `DataTableCore` is a rendered React component, not a headless or framework-neutral table engine.

By default, client filtering and sorting affect only the loaded page. To search or sort the complete result, opt into `serverQuery` and implement the corresponding backend query logic before paging. Components maps sort state to Arc sorting and maps filters and search text to the query arguments you define. It does not infer those arguments or apply server filtering for you. [Server mode](DataTables/data-table-for-query.md#server-mode) shows the handoff.

## Prime dependency boundary

The Components 4 package manifest does not declare PrimeReact, PrimeIcons, PrimeUI, or PrimeUI theme packages as dependencies or peers. Applications that still import those packages directly retain their own package, provider, styling, version, and license boundaries. Review the exact third-party package terms for the version an application keeps; this page makes no licensing conclusion for that application.

## Why Components does not implement every interaction itself

Dialog focus traps, composite keyboard navigation, calendars, and collection selection have interaction rules beyond their visual appearance. Components delegates selected behavior to React Aria and uses semantic native HTML for simple controls. This keeps the public contract under Components' control without making every interaction a separate implementation.

Application composition still matters. Verify keyboard order, focus restoration, and screen-reader output in the shell where the components will run; the choice of interaction library does not certify the finished application.

## Release sequence

Moving from Components 3 to 4 changes the foundation, import paths, provider setup, and styling contracts. Follow [Migrate from Components 3 to 4](Migration/3-to-4.md) for the breaking changes and mechanical import mapping. The guide does not establish a maintenance window for either major.

Adapter authors can use the separate `@cratis/components.conformance` package to check a renderer manifest. Conformance results cover the exercised contract and environment, not universal behavior parity or accessibility. Browser and axe checks remain separate release requirements.

## Strict public-type validation

Components 4 validates every public JavaScript subpath as a strict external TypeScript 6.0.3 and 7.0.2 consumer of the actual packed artifact. After building the public workspaces, run `yarn verify-typescript-consumers` for both compilers across Core, Conformance, and the renderer adapters. The verifier creates isolated Bundler and NodeNext fixtures with `skipLibCheck: false`, confirms that declarations come from the fresh archive rather than source or stale output, and reports the compiler version used. The separate spatial peer-topology fixture uses `skipLibCheck: true`; it does not replace this strict declaration matrix.

For a focused Core check, run `yarn workspace @cratis/components verify-public-types` (TypeScript 7 by default), or prefix the command with `CRATIS_TYPESCRIPT_VERSION=6` to select TypeScript 6. Invalid compiler selections fail rather than silently falling back. Both versions run in repository CI.

The repository compiles and emits declarations with TypeScript 7.0.2, installed under the `@typescript/native` alias. It retains TypeScript 6.0.3 under `typescript` for the compiler API used by Rollup, ESLint, Storybook, and the migrator; TypeScript 7 does not provide that API. CLI scripts select the compiler explicitly, avoiding ambiguous `tsc` binaries. This tooling split is not an extra runtime dependency for a Components consumer.

The verifier records any permitted upstream failures in `Source/scripts/verify-public-types.exceptions.json`, with exact versions, diagnostic codes, affected subpaths, resolution modes, and removal conditions. Unlisted diagnostics or stale exceptions fail the gate. A Components declaration diagnostic requires its reviewed TS2834/TS2835 upstream root cause in the same run; similar error text alone cannot suppress it.

The exception list is empty, and the repository pins `@cratis/arc.react` 22.156.2 for development and verification. The Arc package excludes its test-only global JSX declarations; [Cratis/Arc#3588](https://github.com/Cratis/Arc/issues/3588) records the related issue. The peer range still admits earlier Arc releases. If a strict (`skipLibCheck: false`) consumer reports `TS2503` for unresolved `JSX` identifiers in command/dialog subpaths, check that it resolves 22.156.2 or later.

When an exception is listed, a `PASS_WITH_EXCEPTION` result is not an error-free strict consumer: those upstream diagnostics remain reproducible with the pinned releases. The gate reports them rather than disabling declaration checks, and fails on any additional or Components-owned regression.

### Why the Canvas Pixi surface remains public

`CanvasContext`, `renderItem`, and pointer callbacks expose real Pixi objects so you can build content without converting to a reduced Components facade. That makes the installed Pixi version part of Canvas's type-checking boundary.

The repository pins `pixi.js@8.22.0` for development and verification, while the `^8.20.0` peer range also admits 8.20.x and 8.21.x. Strict consumers (`skipLibCheck: false`) on those earlier releases can encounter a WebGPU declaration conflict; use 8.22.0 or later. Keep one shared compatible resolution, as described under [Optional Pixi, clean no-Pixi core](#optional-pixi-clean-no-pixi-core). PivotViewer does not expose Pixi types publicly.

## Current limitations and work records

Components 4 does not treat adjacent gaps as part of the current package contract:

- Complete-result filtering and sorting remain server-query concerns before paging; loaded-page controls do not supply that behavior.
- Some generated labels and plural/relative text remain outside the current provider-message subset.
- Exact-artifact downstream runtime and visual evidence remains part of the major release review.

Repository issues may track these gaps, but an open issue is not a public roadmap or delivery commitment.

## Post-V4 issue index

These issue records explain decisions and evidence gaps outside the Components 4 contract. They are not a roadmap or a promise to expand the renderer API:

| Issue                                                   | Tracked decision or evidence gap                                                       |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [#207](https://github.com/Cratis/Components/issues/207) | Components 4 registry bootstrap, release execution, and post-publication verification. |
| [#208](https://github.com/Cratis/Components/issues/208) | Proof and possible promotion of atomic slots and mixed-renderer islands.               |
| [#209](https://github.com/Cratis/Components/issues/209) | Schema-driven public renderer discovery tooling.                                       |
| [#210](https://github.com/Cratis/Components/issues/210) | Lazy renderer preload semantics for streaming server rendering.                        |
| [#211](https://github.com/Cratis/Components/issues/211) | Cross-browser and assistive-technology renderer certification.                         |
| [#212](https://github.com/Cratis/Components/issues/212) | CSS theme bridges and vendor portal-interoperability recipes.                          |
| [#213](https://github.com/Cratis/Components/issues/213) | Source-map preservation through ESM specifier rewriting.                               |
| [#214](https://github.com/Cratis/Components/issues/214) | Evidence for or against a renderer-exclusive slim distribution.                        |
| [#215](https://github.com/Cratis/Components/issues/215) | Reviewed dependency-update pull requests.                                              |
| [#216](https://github.com/Cratis/Components/issues/216) | Packed public-API snapshots and semantic-version surface diffs.                        |
| [#217](https://github.com/Cratis/Components/issues/217) | Generated evidence inventories instead of hardcoded check counts.                      |
| [#218](https://github.com/Cratis/Components/issues/218) | Renderer bundle and runtime-performance regression budgets.                            |

Read the issue itself for its status and discussion. The public renderer boundary described on this page remains the exact nine-slot `stable-presentation/v1` profile, boolean setup assertions, and `CratisOverlayEnvironment`; an issue does not expand that contract.

## Release gates

Components 4 releases use these repository release checks:

- Emitted JavaScript and declarations contain no Prime imports or type references.
- Real npm, strict pnpm, and Yarn PnP packed consumers pass with Pixi both absent and present; present topologies prove Components and the consumer resolve one Pixi instance.
- The setup root and every non-spatial subpath load without Pixi, while Canvas and PivotViewer fail specifically on the missing optional peer until it is installed.
- Declared Arc peer versions are exercised against the packed artifact.
- Representative custom-theme and pass-through consumers compile after following the guide.
- Specs, package exports, SSR, keyboard/focus behavior, responsive layouts, dark mode, forced colors, and reduced motion pass.
- Storybook builds and runs under baseline light and dark modes for the built-in renderer and every metadata-discovered public adapter; private ui-adapter workspaces are excluded, and the Plain DOM renderer is a conformance fixture, not an adapter workspace.
- The migration guide works without repository-specific knowledge.
- Every packed public JavaScript subpath passes strict TypeScript 6 and 7 validation or matches a bounded machine-readable upstream exception with exact installed versions and an unmet removal condition. Components-owned cascades additionally require their matching upstream TS2834/TS2835 root cause in the same compiler run.

These checks cover package and component behavior, not every consuming application's theme, overlays, or accessibility needs. For adoption, use [Renderer adapters and coexistence](renderers/index.md) to keep vendor boundaries explicit, or follow [Migrate from Components 3 to 4](Migration/3-to-4.md) when upgrading an existing application.
