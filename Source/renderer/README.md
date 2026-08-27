<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# Experimental renderer contracts

This directory contains the D1 contracts, D2 provider/context/resolution infrastructure, and E1
presentation self-hosting. `preloadRenderer` and lazy renderer entries remain deferred:
`SlotDeclaration` has no load contract yet, so adding preload behavior now would invent an ABI that
adapter declarations cannot honor.

The nine element-bounded presentation facades resolve external scopes/providers first and then pass
a frozen, facade-local Core declaration to `unstable_useSlot`. This keeps the application provider
and package root setup-only: neither imports the private all-family `coreSlots.ts` ABI-proof table.
Zero-configuration local Core resolution is silent, an active partial adapter reports fallback once
after mount, and `rendererFallback='throw'` rejects every Core fallback.

The initial slot table contains only components with real standalone public contracts:

- `common.button`, `common.iconButton`, `common.textInput`, `common.textArea`,
  `common.checkbox`, `common.radio`, `common.switch`, `common.progress`, and `common.surface` —
  element-bounded presentation candidates.
- `common.tooltip`, `dropdown.select`, `dialogs.dialog`, and `display.datePicker` —
  interaction-heavy.
- `datatables.paginator` — interaction-heavy and composite-adjacent.

The basic controls are standalone Common primitives. Arc-bound `CommandForm` fields remain
high-order composites and must never be registered as substitutes for these slots.

E1 routes only the nine presentation candidates. Tooltip, dropdown, dialog, date picker, and table
paginator remain atomic E2 work; `coreSlots.ts` names their current public components only to prove
the complete 14-slot ABI and must not become provider or public-barrel runtime input until E2
extracts recursion-safe implementations.
