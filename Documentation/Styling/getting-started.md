---
title: Set up styling
description: Import Components structure and choose baseline or product-owned token values.
---

Import the token and structural layers once:

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles';
```

For the baseline appearance, also import:

```ts
import '@cratis/components/theme';
```

For a custom product, omit `theme` and define the semantic `--cratis-*` variables in the product stylesheet. Import product values after `tokens` so they win in the cascade.

Components no longer imports or requires PrimeReact, PrimeIcons, PrimeUI themes, or a renderer provider.

See [Build a product theme](themed.md) and [Stable component parts](pass-through.md).
