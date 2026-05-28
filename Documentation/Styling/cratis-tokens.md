# Cratis token reference

The `--cratis-*` CSS variable layer is the Cratis-scoped tint surface every Cratis wrapper reads from. Each token defaults to a matching PrimeReact theme variable via `tokens.css`, so loading a PrimeReact theme (Paths [A](themed.md) and [B](custom-palette.md)) automatically gives every Cratis surface the right color without any further work.

You override `--cratis-*` tokens when you want **just** Cratis-scoped surfaces (validation error text, FormElement addon, breadcrumb borders, …) tinted independently of PrimeReact widgets. To repaint PrimeReact widgets themselves, override the PrimeReact variables directly — see [Path B](custom-palette.md).

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

Each token defaults to the PrimeReact variable with the same name minus the `--cratis-` prefix (e.g. `--cratis-surface-card` → `var(--surface-card)`). Set the token to override that default.

### Surfaces

| Token | Cratis surfaces tinted by it |
|---|---|
| `--cratis-surface-0`      | Reserved for any Cratis-scoped surface that maps to PrimeReact's `--surface-0`. |
| `--cratis-surface-100`    | `FormElement` addon background. |
| `--cratis-surface-ground` | Reserved for any Cratis-scoped surface that maps to PrimeReact's `--surface-ground`. |
| `--cratis-surface-section` | Reserved for any Cratis-scoped surface that maps to PrimeReact's `--surface-section`. |
| `--cratis-surface-card`   | Backgrounds of the `ObjectContentEditor` snapshot card and similar panels. |
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
| `--cratis-primary-300`        | Reserved for lighter brand variants. |
| `--cratis-primary-400`        | Reserved for lighter brand variants. |
| `--cratis-primary-500`        | Reserved for brand mid-tones. |
| `--cratis-primary-600`        | Reserved for brand darker variants. |

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
| `--cratis-focus-ring` | Reserved for Cratis-managed focus rings. |
| `--cratis-maskbg`     | Reserved for any Cratis-managed modal mask. |

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

The Cratis token layer is **additive** on top of PrimeReact's theme system, not a replacement for it. The cascade in `tokens.css` looks like:

```css
:root {
    --cratis-surface-card: var(--surface-card);
    --cratis-text-color:   var(--text-color);
    /* … */
}
```

That means:

- Override `--surface-card` (PrimeReact) → both PrimeReact widgets *and* Cratis surfaces follow.
- Override `--cratis-surface-card` (Cratis) → only Cratis surfaces follow; PrimeReact widgets keep their existing color.

Use the PrimeReact variable when you want a whole-UI repaint (Path B). Use the Cratis token when you want a Cratis-specific accent that differs from PrimeReact widgets.

## See also

- [Path B — Custom palette](custom-palette.md) — for whole-UI repainting with PrimeReact variables
- [Pass-through cheat sheet](pass-through.md) — for per-slot styling beyond what tokens reach
