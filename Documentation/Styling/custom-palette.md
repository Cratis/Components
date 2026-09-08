---
title: Customize the palette
description: Override the semantic Cratis color tokens without replacing component structure.
---

Define semantic values after importing the baseline theme:

```css
:root {
    --cratis-primary-color: #0f766e;
    --cratis-primary-color-text: #ffffff;
    --cratis-action-background: #0f766e;
    --cratis-action-background-hover: #115e59;
    --cratis-action-background-active: #134e4a;
    --cratis-action-text: #ffffff;
    --cratis-highlight-bg: #ccfbf1;
    --cratis-highlight-text-color: #115e59;
}

.cratis-dark {
    --cratis-primary-color: #5eead4;
    --cratis-primary-color-text: #042f2e;
    --cratis-action-background: #5eead4;
    --cratis-action-background-hover: #99f6e4;
    --cratis-action-background-active: #ccfbf1;
    --cratis-action-text: #042f2e;
}
```

Prefer semantic product variables when several libraries share the same design system, then map those values onto `--cratis-*` once.
