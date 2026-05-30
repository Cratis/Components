# Use a custom palette on top of a PrimeReact theme

You want PrimeReact's chrome — its dialog frames, button shapes, focus rings, input borders — but in your own colors. You don't want to write a PrimeReact theme from scratch.

This setup keeps a PrimeReact theme as the **structural baseline** and overrides PrimeReact's own CSS variables on `:root` to repaint the whole UI. The `--cratis-*` tokens follow along through `tokens.css`'s cascade, so Cratis-scoped surfaces stay in sync. You can also override the Cratis tokens independently when you want Cratis surfaces to differ from PrimeReact widgets.

> **PrimeReact version note.** The examples below override PrimeReact **v10** theme variables (`--surface-*`, `--primary-color`, …). On **PrimeReact v11**, customize the palette through `@primeuix/themes` instead — define a preset with `definePreset` (or override the `--p-*` design tokens). Either way you don't touch the `--cratis-*` layer: it resolves the v11 design token first and falls back to the v10 variable, so Cratis-scoped surfaces follow your palette on both majors.

## Setup

```tsx
// 1. PrimeReact theme provides the structure.
import 'primereact/resources/themes/lara-dark-blue/theme.css';
import 'primeicons/primeicons.css';
import '@cratis/components/styles';
// 2. Your palette overrides — must come after the theme so they win.
import './palette.override.css';
```

## With plain CSS

Override PrimeReact's variables — these are what its widgets read directly:

```css
/* palette.override.css */
:root {
    /* Surfaces */
    --surface-0:        #1e293b;
    --surface-100:      #1e293b;
    --surface-ground:   #020617;
    --surface-section:  #0f172a;
    --surface-card:     #1e293b;
    --surface-overlay:  #1e293b;
    --surface-hover:    #334155;
    --surface-border:   #334155;

    /* Text */
    --text-color:           #f8fafc;
    --text-color-secondary: #94a3b8;

    /* Brand */
    --primary-color:      #38bdf8;
    --primary-color-text: #0b1220;

    /* Selection */
    --highlight-bg:         #1e40af;
    --highlight-text-color: #ffffff;

    /* Geometry */
    --border-radius: 10px;

    /* --cratis-* tokens default to var(--surface-*) etc. via tokens.css, so
       the overrides above flow through automatically. Set these explicitly
       only if you want Cratis-scoped surfaces tinted differently. */
    --cratis-red-500:   #ef4444;
    --cratis-green-500: #22c55e;
}
```

## With TailwindCSS

Tailwind's `@layer base` is the idiomatic spot — declare the palette once and Tailwind handles cascade and dark mode:

```css
/* app.css */
@import "tailwindcss";
@import "primereact/resources/themes/lara-dark-blue/theme.css";
@import "@cratis/components/styles";

@layer base {
    :root {
        --surface-card:    theme('colors.slate.800');
        --surface-border:  theme('colors.slate.700');
        --text-color:      theme('colors.slate.50');
        --primary-color:   theme('colors.sky.400');
        --cratis-red-500:  theme('colors.red.500');
    }

    .dark {
        --surface-card: theme('colors.slate.900');
        --text-color:   theme('colors.slate.100');
    }
}
```

## Scoped overrides

PrimeReact variables cascade like any other CSS variable, so an ancestor scope works for region-specific looks:

```css
.dark-zone {
    --surface-card:  #0b1220;
    --text-color:    #f8fafc;
    --primary-color: #60a5fa;
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
:root.theme-light {
    --surface-card: #ffffff;
    --text-color:   #0f172a;
    /* … */
}

:root.theme-dark {
    --surface-card: #1e293b;
    --text-color:   #f8fafc;
    /* … */
}

:root.theme-brand {
    --surface-card: #1f1147;
    --text-color:   #ede9fe;
    --primary-color: #a78bfa;
    /* … */
}
```

```tsx
document.documentElement.classList.add('theme-dark');
```

## What `--cratis-*` tokens are for in this setup

Two override surfaces are available, with different reach:

- **PrimeReact variables** (`--surface-card`, `--text-color`, `--primary-color`, …) — read by PrimeReact widgets directly. Override these to repaint the whole UI (PrimeReact widgets *and* Cratis-scoped surfaces, because Cratis tokens cascade to PrimeReact's via `tokens.css`).
- **`--cratis-*` tokens** — read only by Cratis-scoped surfaces (validation errors, FormElement addon, breadcrumb borders, etc.). Override these when you want Cratis surfaces to differ from PrimeReact widgets, *without* repainting PrimeReact widgets.

See [Cratis token reference](cratis-tokens.md) for the full Cratis token list, and [Pass-through cheat sheet](pass-through.md) when you want even tighter per-component control.

## When to use fully unstyled mode

This setup stops being a good fit when:

- You need to restyle the structural chrome itself — for example, a non-rectangular Dialog frame, a completely different Button shape, or a design system with a custom focus-ring system. Use [fully unstyled mode](unstyled.md) and bring the visuals yourself.
