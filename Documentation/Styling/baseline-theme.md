---
title: Apply the Cratis Components baseline theme
description: Apply the Cratis Components baseline theme to an application or subtree, follow system dark mode, and control explicit light and dark states.
---

The Cratis Components baseline theme gives controls a shared appearance and follows the system's light or dark preference. Use it for an application without its own design system, or for an embedded surface that needs a separate color scheme.

Follow the CSS-first imports in [Set up styling](getting-started.md), retaining `theme` after tokens and structural styles. Existing applications can use these direct TypeScript imports with the [stylesheet module declarations](../getting-started.mdx#install-and-wire-it-up):

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles';
import '@cratis/components/theme';
```

`tokens` supplies light defaults on `:root`. The `theme` import adds document foreground/background, system dark-mode values, explicit scheme classes, forced-colors tuning, and `.cratis-theme` subtree defaults. A whole-application setup needs no theme provider option or wrapper class.

The baseline uses blue actions, neutral surfaces, and 6px radii, defined through Cratis CSS variables. Check the finished application for readable contrast, visible focus, and the other accessibility requirements of your product.

## Dark mode

Apply `cratis-dark` to the document element to force dark mode. With `cratis-light` absent, this excerpt uses your application's `darkMode` boolean to add or remove the class:

```ts
document.documentElement.classList.toggle('cratis-dark', darkMode);
```

Removing `cratis-dark` returns to the system preference; it does not force light mode. For an explicit light choice, apply `cratis-light`. When switching between explicit choices, remove the previous class as you add the new one.

On the root, `cratis-light` takes precedence if both classes are present. It also keeps ordinary `.cratis-theme` descendants light without repeating the class, while a subtree with its own `cratis-dark` can remain dark. Without either explicit class, the baseline follows `prefers-color-scheme`.

## Theme one subtree

Put `.cratis-theme` on a wrapper when an embedded surface needs its own token values. This JSX excerpt assumes an existing `EmbeddedSurface` component and a `dark` boolean:

```tsx
<div className={`cratis-theme ${dark ? 'cratis-dark' : ''}`}>
    <EmbeddedSurface />
</div>
```

The example forces dark when `dark` is true. When false, it removes that explicit choice; the subtree still follows applicable ancestor classes and system preference. Add `cratis-light` when the subtree must stay light.

The dark class can be on the `.cratis-theme` element itself or on an ancestor. The theme also supports an explicit light subtree under a dark root.

To change brand colors while keeping these behaviors, follow [Customize the palette](custom-palette.md). It matches the baseline's scheme selectors so overrides survive dark mode and subtree defaults. For a design system that owns the full appearance, omit the baseline and follow [Build a product theme](themed.md).
