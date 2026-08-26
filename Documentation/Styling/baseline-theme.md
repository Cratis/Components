# Use the Cratis baseline theme

PrimeReact 11 is unstyled-first, and [its styled mode](themed.md) needs two more packages — `@primereact/styles` and `@primeuix/themes`. If you want a polished default look **without them**, ship the components unstyled and import the **Cratis baseline theme** — a token-based stylesheet that skins every component from the `--cratis-*` layer. (A PrimeUI license key is still required to run PrimeReact 11 itself — see [Licensing](../Migration/2-to-3.md#licensing).)

## Setup

Two things: run the provider unstyled, and import the theme plus add the `cratis-theme` class to an ancestor.

```tsx
import 'primeicons/primeicons.css';
import '@cratis/components/tokens';  // the --cratis-* token layer
import '@cratis/components/styles';  // every component stylesheet
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

The rules are scoped under `.cratis-theme`, so you can theme the whole document or just a subtree. Keep the import order — `theme` assigns `--cratis-*` values that `styles` reads.

## Dark mode

Add the `cratis-dark` class to an ancestor for the dark palette:

```tsx
<body className="cratis-dark">
    <div className="cratis-theme">…</div>
</body>
```

## Layering under a preset

The baseline theme defers to a `@primeuix/themes` preset's `--p-*` tokens when one is present, so you can also run it underneath [styled mode](themed.md) — the preset drives the palette and the baseline theme fills the gaps. `styledMode()`'s dark scheme keys off the same `.cratis-dark` class by default, so one class switches both.

## Overriding

Every rule is overridable with your own CSS or `pt`. The baseline theme styles the unstyled primitives through their `[data-scope]` attributes, so target those (or your own `className`, or the `--cratis-*` tokens):

```css
.cratis-theme [data-scope='button'] { border-radius: 999px; }   /* pill buttons */
.dangerous { background: var(--cratis-red-500); color: white; }
```

The baseline theme also maps the `--color-*` token family that `@cratis/arc.react` reads, so Arc's form-field chrome (labels, borders, validation errors) is themed alongside the PrimeReact components.

## When this is the wrong fit

- You want PrimeReact's own look — one of its design systems (Aura, Lara, …) painted by PrimeReact's component styles — [use styled mode](./themed.md) instead.
- You have a strict design system to honor — go [fully unstyled](./unstyled.md) with your own `pt`.
