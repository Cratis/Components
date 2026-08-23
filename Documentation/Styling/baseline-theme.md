---
title: Use the baseline theme
description: Apply the license-free Cratis baseline appearance.
---

Import the baseline after tokens and structural styles:

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles';
import '@cratis/components/theme';
```

The stylesheet supplies light and dark semantic values. Add `cratis-dark` to an ancestor to select the dark values.

```tsx
<div className={dark ? 'cratis-dark' : undefined}>
    <Application />
</div>
```

Override any `--cratis-*` variable after the theme import to adapt the baseline. For a complete product design, omit the baseline and follow [Build a product theme](themed.md).
