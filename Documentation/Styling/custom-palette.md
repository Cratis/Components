# Use a custom palette on top of a theme

You want a theme's chrome — its dialog frames, button shapes, focus rings, input borders — but in your own colors. You don't want to write a theme from scratch.

This setup keeps a theme as the **structural baseline** and repaints it with your palette. Which knob you turn depends on which theme you started from in [Use a theme](themed.md):

- **Cratis baseline theme** (license-free) — override the `--cratis-*` tokens in CSS.
- **`@primeuix/themes` preset** (license) — customize the preset's design tokens with `definePreset`.

Either way the `--cratis-*` layer follows your palette, so Cratis-scoped surfaces stay in sync.

## With the Cratis baseline theme (CSS token overrides)

The baseline theme paints everything from the `--cratis-*` tokens. Override them under `.cratis-theme` (loaded after the theme so your values win):

```tsx
import '@cratis/components/styles';
import '@cratis/components/theme';
import './palette.override.css';   // after the theme so it wins
```

```css
/* palette.override.css */
.cratis-theme {
    /* Surfaces */
    --cratis-surface-0:       #1e293b;
    --cratis-surface-100:     #1e293b;
    --cratis-surface-section: #0f172a;
    --cratis-surface-card:    #1e293b;
    --cratis-surface-overlay: #1e293b;
    --cratis-surface-hover:   #334155;
    --cratis-surface-border:  #334155;

    /* Text */
    --cratis-text-color:           #f8fafc;
    --cratis-text-color-secondary: #94a3b8;

    /* Brand */
    --cratis-primary-color:      #38bdf8;
    --cratis-primary-color-text: #0b1220;

    /* Selection */
    --cratis-highlight-bg:         #1e40af;
    --cratis-highlight-text-color: #ffffff;

    /* Geometry */
    --cratis-border-radius: 10px;
}

/* Dark palette is applied when `cratis-dark` is on the same ancestor. */
.cratis-theme.cratis-dark {
    --cratis-surface-card: #0b1220;
    --cratis-text-color:   #e2e8f0;
}
```

## With a `@primeuix/themes` preset (`definePreset`)

Presets are customized in TypeScript, not CSS: derive a new preset from a base one with `definePreset` and hand it to the provider. Design-token references like `{sky.500}` point at the preset's built-in primitive palette:

```ts
// brand-preset.ts
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const BrandPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{sky.50}',   100: '{sky.100}', 200: '{sky.200}',
            300: '{sky.300}', 400: '{sky.400}', 500: '{sky.500}',
            600: '{sky.600}', 700: '{sky.700}', 800: '{sky.800}',
            900: '{sky.900}', 950: '{sky.950}',
        },
    },
});
```

```tsx
import { CratisComponentsProvider } from '@cratis/components';
import { BrandPreset } from './brand-preset';

export const App = () => (
    <CratisComponentsProvider value={{ theme: { preset: BrandPreset }, license: 'YOUR-PRIMEUI-KEY' }}>
        <YourApp />
    </CratisComponentsProvider>
);
```

## Scoped overrides

The `--cratis-*` tokens cascade like any other CSS variable, so an ancestor scope works for region-specific looks with the baseline theme:

```css
.dark-zone {
    --cratis-surface-card:  #0b1220;
    --cratis-text-color:    #f8fafc;
    --cratis-primary-color: #60a5fa;
}
```

```tsx
<>
    <Dialog title="Standard look">…</Dialog>

    <div className="dark-zone">
        <Dialog title="Always dark in here">…</Dialog>
    </div>
</>
```

## Shipping multiple palettes (light / dark / brand variants)

Put each palette behind a class on the root element and toggle the class with your theme switcher:

```css
.cratis-theme.theme-light {
    --cratis-surface-card: #ffffff;
    --cratis-text-color:   #0f172a;
    /* … */
}

.cratis-theme.theme-dark {
    --cratis-surface-card: #1e293b;
    --cratis-text-color:   #f8fafc;
    /* … */
}

.cratis-theme.theme-brand {
    --cratis-surface-card:  #1f1147;
    --cratis-text-color:    #ede9fe;
    --cratis-primary-color: #a78bfa;
    /* … */
}
```

```tsx
document.documentElement.classList.add('theme-dark');
```

The baseline theme's own `cratis-dark` class is the simplest light/dark switch when you only need those two — add it alongside `cratis-theme` for dark, remove it for light.

## What `--cratis-*` tokens are for in this setup

Two override surfaces are available, with different reach:

- **The theme's palette** (`--cratis-*` for the baseline theme, or the preset's `--p-*` design tokens) — read by the widgets. Override these to repaint the whole UI.
- **`--cratis-*` tokens on a Cratis-only scope** — read by Cratis-scoped surfaces (validation errors, the FormElement addon, breadcrumb borders, etc.). Override these when you want Cratis surfaces to differ from the surrounding widgets.

See [Cratis token reference](cratis-tokens.md) for the full Cratis token list, and [Pass-through cheat sheet](pass-through.md) when you want even tighter per-component control.

## When to use fully unstyled mode

This setup stops being a good fit when:

- You need to restyle the structural chrome itself — for example, a non-rectangular Dialog frame, a completely different Button shape, or a design system with a custom focus-ring system. Use [fully unstyled mode](unstyled.md) and bring the visuals yourself.
