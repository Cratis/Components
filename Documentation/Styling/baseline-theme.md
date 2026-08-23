---
title: Use the baseline theme
description: Apply the license-free Cratis baseline appearance globally or to one subtree.
---

Import the baseline after tokens and structural styles:

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles';
import '@cratis/components/theme';
```

The import activates baseline values on `:root`, so no provider option or wrapper class is required for the normal whole-application setup.

## Dark mode

Apply `cratis-dark` to the document element:

```ts
document.documentElement.classList.toggle('cratis-dark', darkMode);
```

Use `cratis-light` to keep the light color scheme when the operating system prefers dark.

## Theme one subtree

The same values are scoped by `.cratis-theme` when a page needs an independently themed island:

```tsx
<div className={`cratis-theme ${dark ? 'cratis-dark' : ''}`}>
    <EmbeddedSurface />
</div>
```

Both arrangements are supported:

- `cratis-dark cratis-theme` on the same element
- `cratis-dark` on an ancestor of `cratis-theme`

Override any `--cratis-*` variable after the theme import to adapt the baseline. For a complete product design, omit the baseline and follow [Build a product theme](themed.md).
