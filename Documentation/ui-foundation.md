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

Known upstream failures are bounded in `Source/scripts/verify-public-types.exceptions.json`. Each exception names exact package versions, diagnostic codes, affected subpaths and resolution modes, and an objective removal condition. Unlisted diagnostics, any diagnostic in Components-owned declarations, a TypeScript-version mismatch, or an exception that stops reproducing all fail the gate.

The current exceptions are:

- **`@webgpu/types@0.1.72` through `pixi.js@8.20.0`:** its ambient WebGPU declarations conflict with TypeScript 6's built-in DOM declarations for the root and `Canvas` subpaths (`TS2403`, `TS2687`, `TS2717`, `TS6200`).
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
- npm, pnpm, and Yarn PnP packed-consumer fixtures pass.
- Supported Arc versions load from the packed artifact.
- Representative custom-theme and pass-through consumers compile after following the guide.
- Specs, Storybook, package exports, SSR, keyboard/focus behavior, responsive layouts, dark mode, forced colors, and reduced motion pass.
- The migration guide works without repository-specific knowledge.
- Every packed public JavaScript subpath passes strict TypeScript 6 validation or matches a bounded machine-readable upstream exception whose removal condition is still unmet.

Track acceptance evidence in [the UI foundation issue](https://github.com/Cratis/Components/issues/170).
