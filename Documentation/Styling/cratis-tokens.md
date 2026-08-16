# Cratis token reference

The `--cratis-*` CSS variable layer is the Cratis-scoped tint surface every Cratis wrapper reads from. Each token resolves the **PrimeReact v11 design token first** (e.g. `--p-content-border-color`), falling back to the **legacy v10 theme variable** (e.g. `--surface-border`):

```css
--cratis-surface-border: var(--p-content-border-color, var(--surface-border));
/*                            ^ v11 (@primeuix/themes)      ^ v10 legacy      */
```

`@cratis/components` 3.0 requires `primereact@^11` as a peer, so the **v11 arm is the one that resolves in a correctly installed app**. The v10 arm is kept deliberately for the upgrade window, when an app still has a compiled v10 theme stylesheet on the page while it ports its own screens. Nothing breaks the day that stylesheet is removed — the v11 arm was already winning.

This indirection is the single seam that insulates your code (and your consumers' `--cratis-*` overrides) from PrimeReact's token system changing underneath you. It is the reason this library could span a PrimeReact major version at all.

You override `--cratis-*` tokens when you want **just** Cratis-scoped surfaces (validation error text, FormElement addon, breadcrumb borders, …) tinted independently of PrimeReact widgets. To repaint PrimeReact widgets themselves, customize the preset — see [the custom palette setup](custom-palette.md).

## Where the values come from

PrimeReact 11 ships **zero CSS**, so nothing populates `--p-*` until something does it at runtime. Two things can:

- **A `@primeuix/themes` preset.** A preset is a plain JavaScript token object; `@primeuix/styled` turns it into `--p-*` custom properties when you hand it to the provider (`value={{ theme: { preset: Aura } }}`). This path is [license-gated](themed.md).
- **The [Cratis baseline theme](baseline-theme.md).** `@cratis/components/theme` skips `--p-*` entirely and assigns the `--cratis-*` tokens concrete values directly, light and dark — no preset needed. It still defers to a preset's `--p-*` when one is present.

With neither, the tokens resolve to nothing and the rules that read them no-op. That is deliberate: the library stays theme-agnostic rather than imposing a default palette on consumers.

## Loading the tokens

The token layer is its own stylesheet, imported alongside the component CSS:

```ts
import '@cratis/components/tokens';   // the --cratis-* declarations
import '@cratis/components/styles';   // every component stylesheet + the Tailwind utilities
```

Import `tokens` **first** — `styles` (and `theme`, if you use it) resolve variables that `tokens` declares.

> [!IMPORTANT]
> In 2.x, `@cratis/components/styles` carried the token declarations as well. It no longer does: `styles` is now the component CSS plus the compiled Tailwind utilities, and `tokens` is a separate import you always need. Upgrading apps must add the `tokens` line.

If you bring your own utility CSS solution and want nothing else from the package's Tailwind build, `tokens` still works on its own — but note that omitting `styles` also omits every component stylesheet, so wrappers like `DataPage` and `Toolbar` will lose their layout.

## Token catalog

v11 is not a 1:1 rename of v10 — where v11's vocabulary has no direct equivalent for a v10 concept (`surface-ground`, `surface-section`, `surface-overlay`, the composite `focus-ring`), the closest durable v11 semantic token is used (see the inline notes in `tokens.css`). Set the `--cratis-*` token to override regardless of which PrimeReact version is loaded.

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
@import "@cratis/components/styles";

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

- Repaint PrimeReact itself — customize the preset with `definePreset` so the `--p-*` tokens change — and both PrimeReact widgets *and* Cratis surfaces follow. (During an upgrade window, a still-loaded v10 theme's legacy `--surface-*` / `--text-color` variables reach the Cratis surfaces the same way, through the fallback arm.)
- Override `--cratis-surface-card` → only Cratis surfaces follow; PrimeReact widgets keep their existing color.
- Under the [Cratis baseline theme](baseline-theme.md) the distinction collapses: the theme skins the widgets from the same `--cratis-*` tokens, so one override repaints both.

Use the preset when you want a whole-UI repaint. Use the Cratis token when you want a Cratis-specific accent that differs from PrimeReact widgets.

## See also

- [Use a custom palette on top of a PrimeReact theme](custom-palette.md) — for whole-UI repainting with PrimeReact variables
- [Pass-through cheat sheet](pass-through.md) — for per-slot styling beyond what tokens reach
