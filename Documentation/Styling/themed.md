# Path A — PrimeReact-themed (fastest start)

You want components to look reasonable out of the box and only intervene when needed. Pick this path for prototypes, internal tools, or any app where one of the prebuilt PrimeReact themes is good enough.

## Setup

Load any PrimeReact theme stylesheet alongside Cratis Components. PrimeReact's own widgets paint themselves from the theme, and the `--cratis-*` tokens cascade to the matching theme variables so Cratis-scoped surfaces follow along:

```tsx
// 1. Theme first, then Cratis styles so any --cratis-* override wins.
import 'primereact/resources/themes/lara-dark-blue/theme.css';
import 'primeicons/primeicons.css';
import '@cratis/components/styles';

import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider>
        <YourApp />
    </CratisComponentsProvider>
);
```

Available themes ship inside the `primereact/resources/themes/` directory — Lara, Soho, Viva, Vela, Bootstrap, Material, Tailwind, and others, each in light/dark and a handful of accent colors. Pick whichever matches your app.

## Override one component with CSS

When you want to tweak a single widget without redesigning anything, plain CSS works on top of the theme. Target PrimeReact's own class names for global overrides:

```css
/* yourApp.css */
.p-button {
    border-radius: 999px;  /* pill buttons everywhere */
}
```

…or target your own class names on Cratis wrappers:

```css
.dangerous-button {
    background: var(--cratis-red-500);
    color: white;
}
```

```tsx
<Button label="Delete" className="dangerous-button" />
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

Validation error text, the FormElement addon, breadcrumb bottom borders, and other Cratis-specific surfaces read from `--cratis-*` tokens (not from PrimeReact's variables). Override the relevant token to retint just those surfaces while leaving the PrimeReact theme untouched:

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

## When to switch paths

You'll outgrow Path A when:

- The PrimeReact theme is "almost" but not your brand — switch to [Path B](custom-palette.md) and override the PrimeReact variables on `:root`.
- You're integrating into a design system that defines its own button, dialog, and input visuals — switch to [Path C](unstyled.md) and bring everything yourself.
