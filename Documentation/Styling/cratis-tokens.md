# Cratis token reference

The `--cratis-*` CSS variable layer is the Cratis-scoped tint surface every Cratis wrapper reads from. Each token resolves the **PrimeReact v11 design token first** (`@primeuix/themes`, e.g. `--p-content-border-color`), falling back to the **legacy v10 theme variable** (e.g. `--surface-border`) via `tokens.css`. Loading any PrimeReact theme — v10 *or* v11 — therefore gives every Cratis surface the right color without any further work, and the same build keeps working across a PrimeReact 10 → 11 upgrade.

This indirection is deliberate: it is the single seam that insulates your code (and your consumers' `--cratis-*` overrides) from PrimeReact's token system changing underneath you.

You override `--cratis-*` tokens when you want **just** Cratis-scoped surfaces (validation error text, FormElement addon, breadcrumb borders, …) tinted independently of PrimeReact widgets. To repaint PrimeReact widgets themselves, override the PrimeReact variables directly — see [the custom palette setup](custom-palette.md).

## Loading the tokens

The token layer ships at two import paths:

```ts
import '@cratis/components/styles';
```

The recommended one — ships the Tailwind utility classes used inside the package **plus** the `--cratis-*` token declarations as a single stylesheet.

```ts
import '@cratis/components/tokens';
```

Just the token declarations, with no Tailwind utilities. Use this if you bring your own utility CSS solution (or use Tailwind with custom classnames that don't match what the package ships).

## Token catalogue

Each token resolves the PrimeReact v11 design token first, then the v10 legacy variable (e.g. `--cratis-surface-border` → `var(--p-content-border-color, var(--surface-border))`). v11 is not a 1:1 rename of v10 — where v11's vocabulary has no direct equivalent for a v10 concept (`surface-ground`, `surface-section`, `surface-overlay`, the composite `focus-ring`), the closest durable v11 semantic token is used (see the inline notes in `tokens.css`). Set the `--cratis-*` token to override regardless of which PrimeReact version is loaded.

### Surfaces

| Token | Cratis surfaces tinted by it |
|---|---|
| `--cratis-surface-0`      | Reserved for any Cratis-scoped surface that maps to PrimeReact's `--surface-0`. |
| `--cratis-surface-100`    | `FormElement` addon background. |
| `--cratis-surface-ground` | `PivotViewer` canvas and panel backgrounds. |
| `--cratis-surface-section` | `PivotViewer` panel section backgrounds. |
| `--cratis-surface-card`   | Backgrounds of the `ObjectContentEditor` snapshot card and similar panels; `PivotViewer` card gradients. |
| `--cratis-surface-overlay` | Overlay backgrounds inside Cratis wrappers. |
| `--cratis-surface-hover`  | Hover state on row alternation inside `ObjectContentEditor`. |
| `--cratis-surface-border` | `FormElement` addon border, `ObjectNavigationalBar` bottom border, `SchemaEditor` bottom border, table/paginator borders inside `DataTableForQuery` / `DataTableForObservableQuery`. |

### Text

| Token | Cratis surfaces tinted by it |
|---|---|
| `--cratis-text-color`           | Default body text inside Cratis wrappers. |
| `--cratis-text-color-secondary` | `ObjectContentEditor` label column, `ObjectNavigationalBar` breadcrumbs, `SchemaEditor` secondary labels. |

### Brand

| Token | Cratis surfaces tinted by it |
|---|---|
| `--cratis-primary-color`      | `ObjectContentEditor` navigation links into nested objects/arrays, default brand accent. |
| `--cratis-primary-color-text` | Foreground used on top of `--cratis-primary-color` backgrounds (e.g. CommandStepper step number color). |
| `--cratis-primary-300`        | `PivotViewer` loading spinner ring. |
| `--cratis-primary-400`        | `PivotViewer` loading spinner ring. |
| `--cratis-primary-500`        | `PivotViewer` loading spinner ring and card gradient. |
| `--cratis-primary-600`        | `PivotViewer` loading spinner ring. |

### Selection / highlight

| Token | Cratis surfaces tinted by it |
|---|---|
| `--cratis-highlight-bg`         | Background of timestamp/highlight chips inside `ObjectContentEditor`. |
| `--cratis-highlight-text-color` | Text on top of `--cratis-highlight-bg`. |

### Semantic accents

| Token | Cratis surfaces tinted by it |
|---|---|
| `--cratis-green-500`  | `CommandStepper` visited-step indicator. |
| `--cratis-orange-500` | Reserved for warning accents. |
| `--cratis-red-500`    | Inline validation error text (replaces PrimeReact's `.p-error` styling), `CommandStepper` error-step indicator, error border tint inside `ObjectContentEditor`. |

### Geometry

| Token | Cratis surfaces tinted by it |
|---|---|
| `--cratis-border-radius` | Border radius on `FormElement` addon and any Cratis surface that mirrors PrimeReact's `--border-radius`. |

### Effects

| Token | Cratis surfaces tinted by it |
|---|---|
| `--cratis-focus-ring` | Focus-ring box-shadow on interactive `PivotViewer` elements. |
| `--cratis-maskbg`     | `PivotViewer` modal mask background. |

## Overriding tokens

Apply on `:root` for an app-wide override:

```css
:root {
    --cratis-red-500: #f97316;
    --cratis-border-radius: 12px;
}
```

…or on an ancestor scope for a region-specific look:

```css
.brand-region {
    --cratis-surface-border: theme('colors.violet.500');
    --cratis-text-color-secondary: theme('colors.violet.300');
}
```

```tsx
<div className="brand-region">
    <ObjectNavigationalBar navigationPath={path} onNavigate={…} />
</div>
```

Cratis tokens cascade like any other CSS variable, so any selector that increases specificity over `:root` wins.

## With TailwindCSS

Tailwind's `@layer base` is the idiomatic spot — declare tokens once and let Tailwind handle cascade and dark mode:

```css
@import "tailwindcss";
@import "@cratis/components/tokens";

@layer base {
    :root {
        --cratis-surface-border: theme('colors.slate.700');
        --cratis-text-color:     theme('colors.slate.50');
        --cratis-red-500:        theme('colors.red.500');
    }

    .dark {
        --cratis-surface-border: theme('colors.slate.600');
        --cratis-text-color:     theme('colors.slate.100');
    }
}
```

## Relationship to PrimeReact variables

The Cratis token layer is **additive** on top of PrimeReact's theme system, not a replacement for it. The cascade in `tokens.css` resolves the v11 token first, then the v10 legacy variable:

```css
:root {
    /* v11 (@primeuix/themes) first, v10 legacy fallback */
    --cratis-surface-card: var(--p-content-background, var(--surface-card));
    --cratis-text-color:   var(--p-text-color, var(--text-color));
    /* … */
}
```

That means:

- Repaint PrimeReact itself — on **v11** customize the preset (`definePreset` / `--p-*` tokens), on **v10** override the legacy `--surface-*` / `--text-color` variables — and both PrimeReact widgets *and* Cratis surfaces follow.
- Override `--cratis-surface-card` (Cratis) → only Cratis surfaces follow; PrimeReact widgets keep their existing color, on either version.

Use the PrimeReact token when you want a whole-UI repaint. Use the Cratis token when you want a Cratis-specific accent that differs from PrimeReact widgets.

## See also

- [Use a custom palette on top of a PrimeReact theme](custom-palette.md) — for whole-UI repainting with PrimeReact variables
- [Pass-through cheat sheet](pass-through.md) — for per-slot styling beyond what tokens reach
