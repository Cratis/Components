<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# Renderer contracts

This directory contains the stable nine-slot `stable-presentation/v1` façade alongside the broader
experimental D1 contracts, D2 provider/context/resolution infrastructure, and E1/E2 presentation
plus atomic self-hosting. `preloadRenderer` and lazy renderer entries remain deferred:
`SlotDeclaration` has no load contract yet, so adding preload behavior now would invent an ABI that
adapter declarations cannot honor.

All fourteen facades resolve external scopes/providers first and then pass a frozen, facade-local
Core declaration to `unstable_useSlot`. This keeps the application provider and package root
setup-only: neither imports the private all-family `coreSlots.ts` ABI-proof table. Zero-configuration
local Core resolution is silent, an active partial adapter reports fallback once after mount, and
`rendererFallback='throw'` rejects every Core fallback.

The initial slot table contains only components with real standalone public contracts:

- `common.button`, `common.iconButton`, `common.textInput`, `common.textArea`,
  `common.checkbox`, `common.radio`, `common.switch`, `common.progress`, and `common.surface` —
  element-bounded presentation candidates.
- `common.tooltip`, `dropdown.select`, `dialogs.dialog`, and `display.datePicker` —
  interaction-heavy.
- `datatables.paginator` — interaction-heavy and composite-adjacent.

The basic controls are standalone Common primitives. Arc-bound `CommandForm` fields remain
high-order composites and must never be registered as substitutes for these slots.

Renderer packages may declaration-merge non-secret boolean keys into
`CratisRendererSetupExtensions`. Applications pass those attestations through
`CratisComponentsProvider.rendererSetup`; the root freezes them, nested providers inherit them
unless an explicit nested setup replaces the map wholesale, and renderer scopes forward them to a
library Provider. Credentials, license strings, caches, provider
instances, and other values must never cross this boundary. The attestation says only that the host
completed its own setup and lets a renderer fail closed when its upstream context cannot expose
whether setup occurred.

The nine E1 presentation candidates are the immutable stable façade exposed through
`CratisPresentationUiLibrary` and `definePresentationUiLibrary`. Its runtime helper requires all
nine slots, presentation mode, supported fidelity, the exact profile and ABI, and the stable render,
parts, and static-SSR capabilities; it rejects duplicate capabilities and then freezes the manifest
through the existing machinery. E2 routes tooltip, dropdown, dialog, date picker, and
table paginator as atomic slots whose external adapters replace Core interaction ownership entirely.
Their Core implementations self-host React Aria portals through the local overlay environment only
around the overlay-owning subtree; merely reading the hook, rendering a closed control, or rendering
SSR never looks up a container. `null` defers the overlay rather than falling back to `document.body`.

`ButtonImplementation` composes `TooltipImplementation` directly to avoid slot recursion. Core
`TablePaginatorImplementation` intentionally composes public `Button` as a distinct nested
presentation slot. The private `coreSlots.ts` table names only non-facade implementations and remains unreachable
from the setup-only root, `./Common`, and public `./renderer` closures. Adapter authors may opt into
the deliberately heavy `@cratis/components/renderer/builtin` proof subpath, which exports only the
frozen `unstable_cratisBuiltIn` manifest and is the sole public closure allowed to reach that table
and all implementation families. Raw Core slots are never exported.
