<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# Configuration seam

The renderer-independent configuration every Components area reads at runtime: the
`CratisComponentsContext` singleton and its `useCratisComponentsConfig` hook, the `cratisDefaults`
value the context falls back to, and `useCratisIcon` — the resolver each icon site calls to apply
the provider's icon vocabulary.

`CratisComponentsProvider` itself stays in `Common/`, together with the configuration *types* it
declares. Only the pieces a consuming component imports at runtime live here.

## Why this is its own directory, and not `Common/`

Per-area stylesheets (`@cratis/components/Chat/styles`, `/Filter/styles`, …) are derived, not
hand-written: a subpath's sheet is the union of the stylesheets owned by every source directory its
**built runtime import closure** reaches, keyed on the first path segment
(`Source/scripts/lib/area-stylesheets.mjs`). `Common/` owns nine stylesheets, so *any* runtime
import of *any* module under `Common/` — including a module with no CSS of its own, such as a hook —
puts the whole of `Common`'s CSS into the importer's published sheet.

That is how a CSS-free icon hook placed in `Common/` grew `styles.Chat.css` from 5 864 to 9 642 gzip
bytes, `styles.Filter.css` from 2 742 to 6 651, and `styles.PivotViewer.css` from 6 840 to 10 655:
Chat, Filter and PivotViewer had reached no `Common/` module before, and one `import` made each of
them ship all of it. The per-area budgets in `scripts/verify-package-archive.mjs` are what caught it,
and they are the check that will catch the next one.

So: **shared code that carries no CSS must not live in a directory that owns CSS.** `types/` and
`renderer/` already follow that rule; this directory is the same idea for configuration. Put a new
cross-cutting hook, context or helper here (or in `types/`, or in `renderer/` when it is a renderer
contract) rather than in `Common/`, and the areas that import it keep paying only for what they
render.
