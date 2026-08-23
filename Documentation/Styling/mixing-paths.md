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
    --cratis-action-background: var(--product-action);
    --cratis-action-background-hover: var(--product-action-hover);
    --cratis-action-background-active: var(--product-action-active);
    --cratis-action-text: var(--product-on-action);
}

.product-toolbar[data-cratis-part='root'] {
    border-radius: 1rem;
}
```

All three entries are Cratis-owned. Structural rules live in the low-priority `cratis-components` layer and internal utilities in `cratis-utilities`; the unlayered `product-components.css` import wins over both. There is no provider theme or renderer cascade layer to coordinate.
