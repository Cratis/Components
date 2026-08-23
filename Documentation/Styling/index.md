---
title: Styling
description: Style Components with Cratis tokens, structural CSS, and stable parts.
---

Components separates behavior from product appearance through three Cratis-owned layers:

1. `@cratis/components/tokens` declares semantic variables.
2. `@cratis/components/styles` supplies component structure.
3. `@cratis/components/theme` optionally supplies baseline values.

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles';
import '@cratis/components/theme';
```

A product design system omits `theme`, defines the token values itself, and uses stable parts for component-specific treatment.

## Choose a path

- [Use the baseline theme](baseline-theme.md)
- [Map a product theme](themed.md)
- [Own all styling](unstyled.md)
- [Use Cratis tokens](cratis-tokens.md)
- [Customize stable parts](pass-through.md)

React Aria is internal. Never style React Aria class names or undocumented DOM structure.
