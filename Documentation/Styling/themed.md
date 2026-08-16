# Use a PrimeReact theme

You want components to look reasonable out of the box using one of PrimeReact's own design systems. PrimeReact 11 ships zero CSS and is unstyled-first, so a *theme* is no longer a stylesheet you import — it is a **`@primeuix/themes` preset**, a plain JavaScript token object that `@primeuix/styled` turns into `--p-*` custom properties at runtime when you hand it to the provider.

> **Licensing.** Applying a `@primeuix/themes` preset needs a **PrimeUI license key** (a free community tier or a paid one). If you want a polished look with **no license**, use the [Cratis baseline theme](baseline-theme.md) instead.

## Setup

Install `@primeuix/themes`, pick a preset, and pass it — together with your license key — through the provider's single `value` prop. The preset paints PrimeReact's own widgets, and the `--cratis-*` tokens follow the preset so Cratis-scoped surfaces stay in sync:

```tsx
import '@cratis/components/tokens';
import '@cratis/components/styles';
import Aura from '@primeuix/themes/aura';
import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider value={{ theme: { preset: Aura }, license: 'YOUR-PRIMEUI-KEY' }}>
        <YourApp />
    </CratisComponentsProvider>
);
```

Presets ship in the `@primeuix/themes` package — Aura, Lara, Nora, and Material — each customizable with `definePreset`. `npm i @primeuix/themes` for this path only; it is not a peer dependency of `@cratis/components`. Without a license key, PrimeReact logs a warning and shows an "Invalid PrimeUI License" banner in development **and** production.

## Override one component with CSS

When you want to tweak a single widget without redesigning anything, plain CSS works on top of the preset. Applying a preset is what makes PrimeReact emit its own `.p-*` class names, so a global rule reaches them:

```css
/* yourApp.css */
.p-button {
    border-radius: 999px;  /* pill buttons everywhere */
}
```

> [!WARNING]
> Those class names exist **only while a preset is applied**. Run unstyled — or under the [Cratis baseline theme](baseline-theme.md) — and PrimeReact emits no `p-*` class at all; parts are identified by data attributes instead (`[data-scope="button"]`, `[data-scope="select"][data-part="trigger"]`). A selector written against a v10 class name silently matches nothing.

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

Validation error text, the FormElement addon, breadcrumb bottom borders, and other Cratis-specific surfaces read from `--cratis-*` tokens (not from PrimeReact's design tokens). Override the relevant token to retint just those surfaces while leaving the preset untouched:

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

## When to choose another setup

This setup stops being a good fit when:

- You don't want a PrimeUI license — use the license-free [Cratis baseline theme](baseline-theme.md).
- The preset is "almost" but not your brand — use [a custom palette on top of a theme](custom-palette.md) and customize the preset's design tokens.
- You're integrating into a design system that defines its own button, dialog, and input visuals — use [fully unstyled mode](unstyled.md) and bring every visual yourself.
