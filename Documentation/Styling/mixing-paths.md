---
title: Mix baseline and custom styling
description: Combine token overrides and stable part customization safely.
---

Start with the baseline theme, override product tokens, and add part-specific CSS only where the product needs a distinct structure.

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles';
import '@cratis/components/theme';
import './product-components.css';
```

```css
:root {
    --cratis-primary-color: var(--product-accent);
}

.product-toolbar[data-cratis-part='root'] {
    border-radius: 1rem;
}
```

All three layers are Cratis-owned. There is no provider theme or renderer cascade layer to coordinate.
