---
title: Set up styling
description: Import Components structure and choose baseline or product-owned token values.
---

Import the semantic defaults and structural bundle once, in this order:

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles';
```

For automatic dark mode, explicit `cratis-dark` / `cratis-light`, forced-colors tuning, and independently themed subtrees, also import:

```ts
import '@cratis/components/theme';
```

For a custom product, omit `theme` and define the semantic `--cratis-*` variables in the product stylesheet. Import product values after both Components entries so they win in the cascade.

`styles` contains named, low-priority Cratis layers and no Tailwind Preflight, consumer reset, or token duplication. Components no longer imports or requires PrimeReact, PrimeIcons, PrimeUI themes, or a renderer provider.

## Import only the surfaces you mount

`styles` is every component's CSS in one file, which is the simplest thing to start with. When the payload matters, replace it with the shared base plus one entry point per surface the application actually mounts:

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles/base';
import '@cratis/components/Dialogs/styles';
import '@cratis/components/DataTables/styles';
```

Each `<subpath>/styles` is self-contained for that subpath, so there is never a second import to remember. See [Per-area stylesheets](per-area-stylesheets.md).

See [Build a product theme](themed.md) and [Stable component parts](pass-through.md).
