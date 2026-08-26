# Use PrimeReact's styled mode

You want components to look the way PrimeReact's own do — one of its design systems, painted by a `@primeuix/themes` preset. PrimeReact 11 ships zero CSS and is unstyled-first, so a *theme* is no longer a stylesheet you import. It is two things handed to the provider at runtime: a **preset** (a plain JavaScript token object that `@primeuix/styled` turns into `--p-*` custom properties) and PrimeReact's **component styles** (`@primereact/styles`, the `p-*` class names and the CSS the preset drives). `styledMode()` from `@cratis/components/styled` supplies both.

> [!IMPORTANT]
> **A preset alone styles nothing.** PrimeReact 11's `primereact` package is unstyled primitives: they render structural markup identified by `data-scope` / `data-part` attributes and **no `p-*` class names**. Handing the provider `theme: { preset }` by itself emits the `--p-*` tokens, but with no class names on the elements the preset has nothing to paint. PrimeReact's own styled components (`@primereact/ui`) are just the primitives with their `styles` prop preset from `@primereact/styles` — and `@cratis/components` builds on the primitives, so it needs the same gluing. That is what `styledMode()` does.

**Licensing.** A **PrimeUI license key** is required to run PrimeReact 11 at all — styled mode does not change that, and neither does going unstyled. See [Licensing](../Migration/2-to-3.md#licensing). What styled mode *does* add is two dependencies, `@primereact/styles` and `@primeuix/themes`; the [Cratis baseline theme](baseline-theme.md) gives a polished look without them.

## Setup

Install the two packages styled mode needs — both are optional peers of `@cratis/components` — and spread `styledMode()` into the provider's `value`, next to your license key:

```bash
npm install @primereact/styles @primeuix/themes
```

```tsx
import '@cratis/components/tokens';
import '@cratis/components/styles';
import { CratisComponentsProvider } from '@cratis/components';
import { styledMode } from '@cratis/components/styled';

export const App = () => (
    <CratisComponentsProvider value={{ license: 'YOUR-PRIMEUI-KEY', ...styledMode() }}>
        <YourApp />
    </CratisComponentsProvider>
);
```

`styledMode()` returns `{ theme, defaults }`:

- **`theme`** — a `@primeuix/themes` preset plus its options. The default preset is **`CratisPreset`**: Lara, with the blue primary and gray surfaces of PrimeReact 10's `lara-light-blue` / `lara-dark-blue`, and, in the dark scheme, content and overlays one step lighter than the page — the dark surface scale sits one step lighter than the light one, so Lara's own tokens land on the tones those themes used. Both color schemes are carried.
- **`defaults`** — `primeReactStyles`, PrimeReact's own component styles keyed by primitive name. The provider applies them to **every** primitive rendered under it — the ones this library renders *and* the ones your application renders itself — so the `p-*` class names appear and the preset paints them.

The `--cratis-*` tokens follow the preset's `--p-*` tokens, so Cratis-scoped surfaces stay in sync with the widgets. Without a license key, PrimeReact logs a warning and shows an "Invalid PrimeUI License" banner in development **and** production.

### Options

| Option | Default | What it does |
|---|---|---|
| `preset` | `CratisPreset` | Any `@primeuix/themes` preset — Aura, Lara, Nora, Material — or one derived with `definePreset`. |
| `darkModeSelector` | `cratisDarkModeSelector` (`.cratis-dark`) | How the dark scheme is activated: a selector, `'system'` for `prefers-color-scheme`, or `'none'` to stay light. The default is the class the Cratis baseline theme keys its dark palette off as well, so one `class="cratis-dark"` on the body serves both. |
| `cssLayer` | `{ name: primeReactCssLayer, order: primeReactCssLayerOrder }` | The cascade layer the theme is emitted into — `primereact`, declared between Tailwind's `base` and `components` layers (`theme, base, primereact, components, utilities`), so the preflight reset does not strip what the theme gives a cell or an input while a utility class on a PrimeReact element still wins. A string names the layer and keeps that order; `false` emits the theme unlayered. |

```tsx
import Aura from '@primeuix/themes/aura';
import { styledMode } from '@cratis/components/styled';

<CratisComponentsProvider value={{ license, ...styledMode({ preset: Aura, darkModeSelector: 'system' }) }}>
```

Extend `CratisPreset` the way you would any preset:

```ts
import { definePreset } from '@primeuix/themes';
import { CratisPreset } from '@cratis/components/styled';

export const BrandPreset = definePreset(CratisPreset, {
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
<CratisComponentsProvider value={{ license, ...styledMode({ preset: BrandPreset }) }}>
```

## Override one component with CSS

When you want to tweak a single widget without redesigning anything, plain CSS works on top of the theme. In styled mode PrimeReact's elements carry their `p-*` class names, so a global rule reaches them — and because the theme is emitted into the `primereact` cascade layer, a plain unlayered rule in your own stylesheet wins regardless of specificity or order, exactly as it did against PrimeReact 10's stylesheet themes (which were wrapped in `@layer primereact` too):

```css
/* yourApp.css */
.p-button {
    border-radius: 999px;  /* pill buttons everywhere */
}
```

> [!WARNING]
> Those class names exist **only in styled mode** — they come from `primeReactStyles`, not from the preset. Run unstyled, or under the [Cratis baseline theme](baseline-theme.md), and PrimeReact emits no `p-*` class at all; parts are identified by data attributes instead (`[data-scope="button"]`, `[data-scope="select"][data-part="trigger"]`). A selector written against a v10 class name silently matches nothing there.

Pass `cssLayer: false` to emit the theme unlayered instead; its rules then compete with yours on specificity and order alone, and being injected at runtime they arrive last.

…or target your own class names on Cratis wrappers:

```css
.dangerous-button {
    background: var(--cratis-red-500);
    color: white;
}
```

```tsx
<Button className="dangerous-button">Delete</Button>
```

## Override one component with Tailwind

Every Cratis wrapper accepts a `className` prop. Pass Tailwind utility classes straight through:

```tsx
<InputTextField value={c => c.name}
                className="rounded-2xl bg-slate-900 text-slate-50" />

<Dialog title="Confirm" className="shadow-2xl rounded-3xl">
    {/* … */}
</Dialog>
```

For multi-slot composites like `StepperCommandDialog` or `DataPage`, the `className` is on the outer wrapper. Use the per-slot props (`dialogClassName`, `tableClassName`, `menubarClassName`) when you need to target an inner widget. See the [pass-through cheat sheet](pass-through.md) for the full list.

## Tint a specific Cratis surface

Validation error text, the FormElement addon, breadcrumb bottom borders, and other Cratis-specific surfaces read from `--cratis-*` tokens (not from PrimeReact's design tokens). Override the relevant token to retint just those surfaces while leaving the theme untouched:

```css
:root {
    /* Make Cratis validation errors a brand-distinct orange-red. */
    --cratis-red-500: #f97316;

    /* Round Cratis addons a bit harder than the theme. */
    --cratis-border-radius: 12px;
}
```

See the [Cratis token reference](cratis-tokens.md) for the full list and which surface each token controls.

## Per-instance pass-through

When CSS overrides aren't enough — for example, when you need to attach a class to a specific slot inside a PrimeReact widget — use the `pt` prop:

```tsx
<Dialog
    title="Confirm"
    pt={{
        header: { className: 'bg-sky-600 text-white' },
        content: { className: 'p-6' },
    }}
>
    …
</Dialog>
```

`pt`, `ptOptions`, and `unstyled` are typed from the underlying PrimeReact component, so your IDE autocompletes the available slot names.

## Coming from a PrimeReact 10 theme stylesheet

If your CSS was written against the variables a v10 theme published on `:root` — `--surface-ground`, `--surface-card`, `--surface-border`, `--text-color`, `--primary-color`, the `--surface-0…900` and `--blue-*` / `--gray-*` scales — those names resolve to nothing on PrimeReact 11. `@cratis/components/primereact-v10-palette` restores every one of them with the `lara-light-blue` / `lara-dark-blue` values, following the active preset where v11 has an equivalent. Import it after `tokens` and `styles`; nothing new should be written against those names. See [the migration guide](../Migration/2-to-3.md#theming-without-a-theme-stylesheet).

## When to choose another setup

This setup stops being a good fit when:

- You don't want the extra `@primereact/styles` and `@primeuix/themes` dependencies — use the [Cratis baseline theme](baseline-theme.md) instead.
- The preset is "almost" but not your brand — use [a custom palette on top of a theme](custom-palette.md) and derive your own preset from `CratisPreset` with `definePreset`.
- You're integrating into a design system that defines its own button, dialog, and input visuals — use [fully unstyled mode](unstyled.md) and bring every visual yourself.
