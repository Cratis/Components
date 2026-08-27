<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# Experimental renderer contracts

This directory contains the D1 contracts and D2 provider/context/resolution infrastructure.
Built-in manifests and component routing remain deferred to Slice E. `preloadRenderer` and lazy
renderer entries are also deferred: `SlotDeclaration` has no load contract yet, so adding preload
behavior now would invent an ABI that adapter declarations cannot honor.

The initial slot table contains only components with real standalone public contracts:

- `common.button`, `common.iconButton`, `common.textInput`, `common.textArea`,
  `common.checkbox`, `common.radio`, `common.switch`, `common.progress`, and `common.surface` —
  element-bounded presentation candidates.
- `common.tooltip`, `dropdown.select`, `dialogs.dialog`, and `display.datePicker` —
  interaction-heavy.
- `datatables.paginator` — interaction-heavy and composite-adjacent.

The basic controls are standalone Common primitives. Arc-bound `CommandForm` fields remain
high-order composites and must never be registered as substitutes for these slots.
