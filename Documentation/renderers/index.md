---
title: Renderer adapters and coexistence
description: Understand the built-in renderer, optional primitive adapters, and safe coexistence with application-owned vendor components.
---

<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

A product rarely replaces its entire interface at once. It may use Components for Arc-aware forms
and data surfaces, retain a vendor grid for one specialized screen, and adopt a different visual
language for ordinary controls. Components supports that coexistence without claiming that every
surface becomes interchangeable.

## The ownership boundary

The default path is built in. Install `@cratis/components`, mount `CratisComponentsProvider`, and
omit `library`. Components then renders its Components-owned React and HTML contracts. Semantic
native HTML handles simple controls, while the installed React Aria foundation supplies selected
focus, collection, date, and overlay behavior internally.

An optional adapter changes only the renderer slots that it declares:

| Package                           | Vendor peers                                                                                        | Declared coverage              |
| --------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------ |
| `@cratis/components.mui`          | `@mui/material >=9 <10`, `@emotion/react >=11.5 <12`, `@emotion/styled >=11.11 <12`                 | Nine stable presentation slots |
| `@cratis/components.primereact`   | `primereact`, `@primereact/core`, `@primereact/ui` `>=11 <12`; `@primeuix/themes >=3 <4`            | Nine stable presentation slots |
| `@cratis/components.primereact10` | `primereact >=10.9.9 <11`                                                                           | Nine stable presentation slots |

Every adapter also has React and ReactDOM 19 as peers. Each published adapter release declares a peer on exactly its own version of `@cratis/components` (for example, `@cratis/components.mui@4.14.0` requires `@cratis/components@4.14.0`), so install and upgrade the adapter and `@cratis/components` together at the same version. PrimeReact is a peer of the two PrimeReact adapters only; `@cratis/components` itself depends on no PrimeReact package.

All three adapters publish stable `CratisPresentationUiLibrary` manifests for renderer ABI version 1. They do not replace DataPage, DataTables, CommandDialog, CommandForm, Toolbar, Canvas, or another Components-owned composition. The [primitive adaptation reference](primitive-adaptation.md) lists the exact nine-slot profile. Stable profile selection means nine-slot primitive adaptation, never full-catalog replacement.

```mermaid
graph TD
    App[React application] --> Provider[CratisComponentsProvider]
    Provider --> Composite[Components-owned composite]
    Composite --> Slot{Declared renderer slot?}
    Slot -->|yes| Adapter[Selected adapter primitive]
    Slot -->|no| BuiltIn[Built-in implementation]
    App --> Vendor[Application-owned vendor surface]
```

The application-owned vendor surface is a sibling, not a hidden replacement for the Components
composite.

## Select an adapter

Pass the adapter's manifest to `library` on `CratisComponentsProvider`:

```tsx
import { CratisComponentsProvider } from '@cratis/components';
import { muiUiLibrary } from '@cratis/components.mui';

export const Application = () => (
    <CratisComponentsProvider value={{ locale: 'en-US' }} library={muiUiLibrary}>
        <main>Application content</main>
    </CratisComponentsProvider>
);
```

Each adapter then needs its own vendor setup around or beside that provider:

| Adapter                           | Manifest                | Application setup                                                                                                                                                                                                     |
| --------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@cratis/components.mui`          | `muiUiLibrary`          | Optional outer MUI `ThemeProvider`; the adapter reuses it, or MUI's default theme, as a CSS-variable theme. For server rendering, a request-local Emotion `CacheProvider` outside the Components provider.            |
| `@cratis/components.primereact`   | `primeReactUiLibrary`   | Required outer `PrimeReactProvider` from `@primereact/core/config` with the application's license key and theme, plus `rendererSetup` with `'cratis-primereact.license-configured'` set to `true` only when the key was supplied; see the [licensing policy](licensing.md#primereact-11-key-ownership). |
| `@cratis/components.primereact10` | `primeReact10UiLibrary` | One PrimeReact 10 theme stylesheet (for example `primereact/resources/themes/lara-light-cyan/theme.css`). An outer `PrimeReactProvider` from `primereact/api` is optional; the adapter mounts a default one when none exists. |

The renderer changes only the declared slots. Command and query components still need Arc's `<Arc>` provider from `@cratis/arc.react` around the application; an adapter does not replace it.

## Direct vendor coexistence

Keep direct vendor usage explicit. The application owns that vendor's package, provider, theme,
server-rendering setup, portal configuration, and license. Mount the vendor provider at the smallest
host boundary that needs it, and keep `CratisComponentsProvider` responsible only for Components
configuration and any selected adapter.

A direct vendor island does not need to register itself as a renderer. Register an adapter only when
it implements the public renderer ABI and accepts the exact slot props. Use [custom composition](custom-composition.md)
when an entire workflow needs vendor-native capabilities that a Components composite does not
claim.

## Providers and setup values

A renderer library may mount its own provider around the selected Components scope. Application
resources that the renderer ABI cannot safely transport stay outside that scope. The stable
`CratisRendererSetup` shape accepts only adapter-declared boolean attestations. Never place a
credential, license key, cache, provider instance, or mutable configuration object in it.

PrimeReact 11 demonstrates the boundary: the application passes its key directly to its own outer
PrimeReact provider, then gives Components only a non-secret boolean assertion that setup occurred.
The adapter fails closed with `CRATIS-UI-1005` when the provider or assertion is absent. The [licensing policy](licensing.md)
explains this boundary without making a licensing conclusion for an application.

## Portals and z-index

The built-in overlay environment resolves `document.body` only when an overlay needs a container.
A host may supply `overlayEnvironment` to return another container. Returning `null` defers the
overlay; it does not silently retarget it.

Direct vendor overlays keep their vendor configuration. Components does not merge a vendor portal
registry or z-index service with its built-in overlay environment. When both systems can open
simultaneously, the application must:

- choose containers that are not clipped by local overflow;
- assign an explicit layer order for Components and vendor overlays;
- verify nested menus, listboxes, dialogs, and toasts in the real application shell; and
- keep theme CSS and portal CSS available in every chosen container.

The nine-slot adapters do not include dialog, dropdown, date-picker, tooltip, or paginator atomic
slots. Those controls therefore use the built-in implementation unless another adapter explicitly
and honestly declares them.

## Focus ownership

One interactive surface owns one focus lifecycle. Do not place one modal implementation inside
another modal merely to borrow vendor appearance, and do not combine two focus traps, dismissal
listeners, or keyboard-selection owners for the same interaction. A presentation adapter must
preserve the Components contract without adding a second semantic control. An atomic adapter, if
one is selected, owns the complete interaction instead of wrapping the built-in owner.

This rule is structural, not a universal accessibility certification. Verify keyboard order, initial
focus, focus restoration, escape handling, background inertness, and screen-reader output in the
application's supported browsers and assistive technologies.

## Adapter package metadata schema

Adapter authors can validate the static `cratis` object in their package manifest against the public JSON Schema exported by Components:

```ts
import uiAdapterSchema from '@cratis/components/schemas/ui-adapter.schema.json' with { type: 'json' };
```

The export path is `@cratis/components/schemas/ui-adapter.schema.json`; its canonical `$id` is `https://cratis.io/schemas/ui-adapter.schema.json`, and it uses JSON Schema draft 2020-12. It validates the metadata object itself, not the entire `package.json`.

An adapter package places that object under the `cratis` key. The schema requires the adapter identity and display name, renderer ABI range, adaptation level and profile, category, package entry/export names, slot and mode declarations, capabilities, SSR behavior, accessibility claims, license information, and upstream dependency metadata. Unknown properties are rejected so misspelled or unsupported claims do not silently pass.

Use the schema for editor/build-time manifest validation, then run `@cratis/components.conformance` against the loaded adapter library for runtime contract checks. Schema validity proves only that the static declaration has the supported shape; it does not prove rendering fidelity, behavior, accessibility, SSR safety, or license compatibility. Changes to this exported schema follow the `@cratis/components` package's semantic versioning.

## Continue

- Use [primitive adaptation](primitive-adaptation.md) when the nine stable controls need vendor
  presentation.
- Use [custom composition](custom-composition.md) when the workflow itself must be vendor-native.
- Check [unsupported renderer claims](unsupported.md) before promising replacement behavior.
- Use [Troubleshooting](../troubleshooting.md#an-adapter-still-renders-a-built-in-control) when an active adapter falls back to a built-in control.
