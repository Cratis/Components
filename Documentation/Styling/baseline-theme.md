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

`tokens` supplies conservative light defaults on `:root`. The `theme` import adds document foreground/background, system dark-mode values, explicit scheme classes, forced-colors tuning, and `.cratis-theme` subtree defaults. No provider option or wrapper class is required for the normal whole-application setup.

The baseline intentionally remains visually familiar to Components 2/3 consumers: Lara-adjacent blue actions, neutral surfaces, 6px radii, comparable control density, and similar overlay depth. It is implemented entirely with Cratis markup and tokens. Exact pixel identity is not promised where stronger focus, control-boundary, disabled-state, or status contrast improves accessibility.

## Dark mode

Apply `cratis-dark` to the document element:

```ts
document.documentElement.classList.toggle('cratis-dark', darkMode);
```

Use `cratis-light` to keep the light values when the operating system prefers dark. Without either explicit class, the baseline follows `prefers-color-scheme`.

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
