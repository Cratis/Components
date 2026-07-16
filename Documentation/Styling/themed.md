# Use a theme

You want components to look reasonable out of the box and only intervene when needed. PrimeReact 11 is unstyled-first — it ships no chrome on its own — so a *theme* supplies it. There are two ways to get one, and they differ by licensing:

- The **Cratis baseline theme** — a polished default look built entirely on the `--cratis-*` token layer. Needs **no license**, and is the fastest path for most apps.
- A **`@primeuix/themes` preset** — PrimeReact's own styled token system (Aura, Lara, Nora, Material). Applying a preset needs a **PrimeUI license key** (a free community tier or a paid one).

Both leave every other customization knob — `--cratis-*` tokens, per-instance `className`, and `pt` — available on top.

## Cratis baseline theme (no license)

Run the components unstyled, import the theme stylesheet, and add `class="cratis-theme"` to an ancestor (your `<body>` or app root):

```tsx
// App.tsx
import '@cratis/components/styles';
import '@cratis/components/theme';   // the license-free baseline theme
import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider value={{ unstyled: true }}>
        <YourApp />
    </CratisComponentsProvider>
);
```

```html
<!-- index.html -->
<body class="cratis-theme">…</body>
```

The theme's rules are scoped under `.cratis-theme`, so you can also theme just a subtree by putting the class on a wrapping element instead of `<body>`. For dark mode, add `cratis-dark` on the same ancestor:

```html
<body class="cratis-theme cratis-dark">…</body>
```

## A `@primeuix/themes` preset (license)

Install `@primeuix/themes`, pick a preset, and pass it through the provider's single `value` prop. Supply your PrimeUI license key the same way:

```tsx
import '@cratis/components/styles';
import Aura from '@primeuix/themes/aura';
import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider value={{ theme: { preset: Aura }, license: 'YOUR-PRIMEUI-KEY' }}>
        <YourApp />
    </CratisComponentsProvider>
);
```

Presets ship in the `@primeuix/themes` package — Aura, Lara, Nora, and Material — each customizable with `definePreset`. Without a license key, PrimeReact logs a warning and shows an "Invalid PrimeUI License" banner in development **and** production; the baseline theme and unstyled mode need no key.

## Override one component with CSS

When you want to tweak a single widget without redesigning anything, plain CSS works on top of the theme. Target your own class names on Cratis wrappers:

```css
.dangerous-button {
    background: var(--cratis-red-500);
    color: white;
}
```

```tsx
<Button className="dangerous-button">Delete</Button>
```

If you're on a `@primeuix/themes` preset, its widgets still carry PrimeReact's `.p-*` class names, so a global rule like `.p-button { border-radius: 999px; }` works for the styled path. Under the baseline theme or unstyled mode there are no `.p-*` classes — reach for the wrapper's `className`, the `--cratis-*` tokens, or a `pt` slot instead.

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

Validation error text, the FormElement addon, breadcrumb bottom borders, and other Cratis-specific surfaces read from `--cratis-*` tokens (not from PrimeReact's design tokens). Override the relevant token to retint just those surfaces while leaving the rest of the theme untouched:

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

- The theme is "almost" but not your brand — use [a custom palette on top of a theme](custom-palette.md) and override the design tokens.
- You're integrating into a design system that defines its own button, dialog, and input visuals — use [fully unstyled mode](unstyled.md) and bring every visual yourself.
