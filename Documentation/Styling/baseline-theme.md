# Use the Cratis baseline theme (no license)

PrimeReact 11 is unstyled-first, and its styled `@primeuix/themes` presets need a PrimeUI license. If you want a polished default look **without a license**, ship the components unstyled and import the **Cratis baseline theme** — a token-based stylesheet that skins every component from the `--cratis-*` layer.

## Setup

Two things: run the provider unstyled, and import the theme plus add the `cratis-theme` class to an ancestor.

```tsx
import 'primeicons/primeicons.css';
import '@cratis/components/theme';   // the baseline theme
import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider value={{ unstyled: true }}>
        <div className="cratis-theme">   {/* on <body>, your app root, or a subtree */}
            <YourApp />
        </div>
    </CratisComponentsProvider>
);
```

The rules are scoped under `.cratis-theme`, so you can theme the whole document or just a subtree.

## Dark mode

Add the `cratis-dark` class to an ancestor for the dark palette:

```tsx
<body className="cratis-dark">
    <div className="cratis-theme">…</div>
</body>
```

## Layering under a preset

The baseline theme defers to a `@primeuix/themes` preset's `--p-*` tokens when one is present, so you can also run it underneath a licensed preset — the preset drives the palette and the baseline theme fills the gaps.

## Overriding

Every rule is overridable with your own CSS or `pt`. The baseline theme styles the unstyled primitives through their `[data-scope]` attributes, so target those (or your own `className`, or the `--cratis-*` tokens):

```css
.cratis-theme [data-scope='button'] { border-radius: 999px; }   /* pill buttons */
.dangerous { background: var(--cratis-red-500); color: white; }
```

The baseline theme also maps the `--color-*` token family that `@cratis/arc.react` reads, so Arc's form-field chrome (labels, borders, validation errors) is themed alongside the PrimeReact components.

## When this is the wrong fit

- You want one of PrimeReact's prebuilt design systems (Aura, Lara, …) — [use a preset](./themed.md) instead (needs a PrimeUI license).
- You have a strict design system to honor — go [fully unstyled](./unstyled.md) with your own `pt`.
