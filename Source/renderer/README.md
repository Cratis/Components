<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# Experimental renderer contracts

This directory contains only the D1 renderer contracts. Provider/context wiring, resolution,
`RendererScope`, hooks, preloading, built-in manifests, and component routing are deliberately
deferred.

The initial slot table contains only components with real standalone public contracts:

- `common.button` — presentation candidate.
- `common.tooltip`, `dropdown.select`, `dialogs.dialog`, `display.datePicker` — interaction-heavy.
- `datatables.paginator` — interaction-heavy and composite-adjacent.

Icon button, text input, text area, checkbox, radio, switch, progress, and surface are intentionally
absent because Components does not yet expose matching standalone primitives. Arc-bound
`CommandForm` fields are not substitutes and must never be registered as those slots.
