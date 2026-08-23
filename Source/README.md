# Cratis Components

A collection of React components for building modern applications with Cratis.

## Requirements

### Minimum Versions

- TypeScript: 4.7+
- React: 19.0+
- Node.js: 18+ (for development)

### TypeScript Configuration

This package is compatible with all modern TypeScript `moduleResolution` strategies:

- ✅ `"bundler"` (recommended for Vite, esbuild, webpack 5+)
- ✅ `"node16"` / `"nodenext"` (for Node.js projects)

The package is **ESM-only** (`"type": "module"`) — PrimeReact 11 dropped the
CommonJS build. It ships subpath `exports` with per-entry `types` for optimal
module resolution and tree-shaking. Consume it from an ESM or bundler context;
there is no `require()` entry.

## Installation

```bash
npm install @cratis/components primereact @primereact/core @primereact/headless @primereact/hooks primeicons
# or
yarn add @cratis/components primereact @primereact/core @primereact/headless @primereact/hooks primeicons
```

**PrimeReact is a peer dependency** as of 3.0.0. You install it; the library uses
your copy. This is deliberate: when `primereact` was a regular dependency, an app
that also depended on it could end up with **two copies** — and two copies mean two
`PrimeReactProvider` React contexts, so components rendered from the library read a
different config, theme and z-index registry than components you render yourself.
Nothing errors; overlays just stack wrongly and `pt` / `unstyled` silently fail to
apply. If your app carries a `resolutions` / `overrides` pin to collapse PrimeReact
into one copy, you can now delete it.

`primereact` pins `@primereact/core`, `@primereact/headless` and `@primereact/hooks` to its own exact
version, so one `primereact@11.x` install gives you matching copies of all three;
declaring them is what makes a strict installer (pnpm, Yarn PnP) resolve them for the
library too. `@primereact/types` is an **optional** peer — needed only if your own
code imports the prop types the wrappers re-export.

The other **peer dependencies** you provide are `react` / `react-dom` (**19+**), the
`@cratis/arc*` packages (`>=20.3.1 <23` — Arc 20, 21 and 22 work), `reflect-metadata`
and `tsyringe`; you typically already have these in a Cratis app. `pixi.js`,
`framer-motion`, `allotment` and `react-icons` remain regular dependencies and are
installed for you. `@primereact/styles` and `@primeuix/themes` are **optional** peers,
needed only for PrimeReact's styled mode (see [Styling](#styling)).

### Stylesheets

Component CSS is no longer imported by the JavaScript — import it once in your app
entry point, in this order:

```ts
import '@cratis/components/tokens'; // the --cratis-* token layer
import '@cratis/components/styles'; // every component stylesheet, in one file
import '@cratis/components/theme'; // optional — the Cratis baseline look (MIT CSS)
```

`./styles` also vendors `allotment/dist/style.css`, which `DataPage` needs for its
split view, so you do not have to import that yourself.

## Licensing

**As of 3.0.0 this library builds on PrimeReact 11, which is no longer MIT.** PrimeReact 10
was; PrimeReact 11 is part of PrimeTek's commercial **PrimeUI** family, and so are the
packages it brings with it.

| Package                                                                               | v10       | v11                      |
| ------------------------------------------------------------------------------------- | --------- | ------------------------ |
| `primereact`                                                                          | MIT       | PrimeUI commercial       |
| `primeicons`                                                                          | MIT (7.x) | PrimeUI commercial (8.x) |
| `@primereact/core`, `@primereact/headless`, `@primereact/hooks`, `@primereact/styles` | —         | PrimeUI commercial       |
| `@primeuix/themes`, `@primeuix/styled`                                                | —         | PrimeUI commercial       |

`@cratis/components` itself remains **MIT**. The change is in what it depends on, and it is
yours to satisfy: PrimeReact is a peer dependency, so you install it and its license terms
apply to you directly. `@primereact/styles` and `@primeuix/themes` — the two styled mode
adds — are PrimeUI-licensed too.

### A key is required regardless of how you style

PrimeReact 11 verifies a license key when `PrimeReactProvider` mounts. The check is not
conditional on `unstyled`, on whether a theme preset is applied, or on `NODE_ENV` — so
every styling setup in [Styling](#styling) reaches it. Without a valid key you get a
console warning and a fixed _"Invalid PrimeUI License"_ banner, in development **and**
production.

Supply your key through the provider:

```tsx
<CratisComponentsProvider value={{ license: '…' }}>
```

`@cratis/components/theme` is Cratis-authored MIT CSS that embeds no PrimeTek values, so
that **stylesheet** carries no PrimeTek terms — but rendering it still means running
PrimeReact 11, which needs a key.

### Which license you need

- **[Community License](https://primeui.dev/licenses/community)** — free. Covers
  individuals, students, non-profits and non-commercial open source outright. For an
  organization it requires _all_ of: under $1M USD annual gross revenue, fewer than 5
  developers, fewer than 10 employees, and under $3M USD in outside funding. Supports up to
  4 developers and is renewed annually by confirming continued eligibility.
- **[Commercial License](https://primeui.dev/licenses/commercial)** — for everyone else.
  Per developer, perpetual, with one year of updates.

### If you redistribute

PrimeReact 11's terms state: _"You may not … redistribute it as a component library or
development tool … Redistributing the software so that third parties can develop with it
requires a separate OEM License."_

If you are building an application, that clause is not aimed at you. If you are publishing
a library or tool that others build with, read it and check your position with PrimeTek.

### Staying on MIT

If a commercial dependency is not acceptable, **`@cratis/components` 2.x stays on
PrimeReact 10 and is fully MIT.** It is not getting new features, but it is the supported
way to remain MIT-only.

> Nothing here is legal advice, and this summary may lag PrimeTek's terms. The
> authoritative text is the `LICENSE.md` inside the `primereact` package and the pages
> linked above.

## Usage

### Importing Components

You can import components using subpath imports for better tree-shaking:

```typescript
// Import specific component modules
import { TimeMachine } from '@cratis/components/TimeMachine';
import { DataPage } from '@cratis/components/DataPage';
import { CommandForm } from '@cratis/components/CommandForm';

// Or import from the main entry point
import { TimeMachine, DataPage } from '@cratis/components';
```

### Available Subpath Exports

Components:

- `@cratis/components` — package root (re-exports `CratisComponentsProvider` and the namespaced component groups)
- `@cratis/components/CommandDialog`
- `@cratis/components/CommandStepper`
- `@cratis/components/CommandForm`
- `@cratis/components/CommandForm/fields`
- `@cratis/components/Common`
- `@cratis/components/DataPage`
- `@cratis/components/DataTables`
- `@cratis/components/Dialogs`
- `@cratis/components/Display` — `Tag`, `Badge`, `Chip`, `Skeleton`, `Avatar`, `ProgressBar`
- `@cratis/components/Dropdown`
- `@cratis/components/Notifications` — `Toaster`, Cratis-owned `toast` / `ToastDispatch`, `toastCommandResult`
- `@cratis/components/ObjectContentEditor`
- `@cratis/components/ObjectNavigationalBar`
- `@cratis/components/PivotViewer`
- `@cratis/components/SchemaEditor`
- `@cratis/components/TimeMachine`
- `@cratis/components/Toolbar`
- `@cratis/components/styled` — `styledMode`, `CratisPreset`, `primeReactStyles`, `primeReactCssLayer`, `primeReactCssLayerOrder`, `cratisDarkModeSelector`: PrimeReact's styled mode, wired for the provider (needs `@primereact/styles` + `@primeuix/themes`)
- `@cratis/components/types`

Stylesheets:

- `@cratis/components/theme` — the **Cratis baseline theme** (light + dark, Cratis-authored MIT CSS, no `@primereact/styles` / `@primeuix/themes` dependency); import it and add `class="cratis-theme"` to skin every component from the token layer
- `@cratis/components/styles` — **required**: every component stylesheet, the Tailwind utilities used inside the package, and the `allotment` rules `DataPage` needs, in one file
- `@cratis/components/tokens` — **required**: the `--cratis-*` CSS variable tokens every component reads from
- `@cratis/components/primereact-v10-palette` — the PrimeReact 10 theme variables (`--surface-*`, `--text-color`, `--primary-color`, the color scales, …) restored with the lara-blue values, for CSS already written against them

## Styling

This package ships primarily for its functionality and Arc integrations.
Styling is designed to stay out of the way: choose the setup that matches how
much control you want, and the other layers stay invisible.

> **Tip — see each setup live:** every Storybook story includes a **Styling**
> toolbar (paintbrush icon) that flips between the modes demonstrating the
> setups below: _Aura Dark_ and _Aura Light_ (an `@primeuix/themes`
> preset), _Cratis baseline theme_ (light and dark), _Unstyled
> (bare structure)_, and _Unstyled + Tailwind pt_. Open any story (`yarn dev`)
> and switch modes to see the same component under each setup.

### TL;DR — choose a styling setup

> **A PrimeUI license key is required for every row below** — see [Licensing](#licensing).
> The styling choice changes how it looks and whether you additionally pull in
> `@primeuix/themes`; it does not change whether you need a key.

| Setup                             | When                                                                                                 | Effort  | Extra dependency                          | What you write                                                                                           |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Cratis baseline theme**         | You want a polished default look without adding a theme package.                                     | Lowest  | None                                      | `unstyled` + `import '@cratis/components/theme'` + `class="cratis-theme"`                                |
| **PrimeReact's styled mode**      | You want PrimeReact's own look — a `@primeuix/themes` preset painting PrimeReact's component styles. | Low     | `@primereact/styles` + `@primeuix/themes` | `value={{ license, ...styledMode() }}` with `styledMode` from `@cratis/components/styled`                |
| **A custom palette over a theme** | You want the theme's structure but your own colors.                                                  | Low     | As above, or none                         | `--cratis-*` overrides on the baseline theme, or `styledMode({ preset: definePreset(CratisPreset, …) })` |
| **Fully unstyled**                | You're integrating into a tightly controlled design system.                                          | Highest | None                                      | `unstyled: true` + a `pt` preset in CSS or Tailwind                                                      |

> **Why you need a theme, a baseline stylesheet, or a `pt` preset**
>
> PrimeReact 11 is **unstyled-first**: the `primereact` package is primitives
> that render structural markup with `data-scope` / `data-part` attributes,
> no built-in visuals and **no `p-*` class names**. The class names and the
> CSS behind them live in `@primereact/styles`; PrimeReact's own styled
> components (`@primereact/ui`) are just the primitives with those styles
> preset, and this library builds on the primitives. So a look comes from one
> of three sources — PrimeReact's styled mode (`styledMode()`: a
> `@primeuix/themes` preset **plus** PrimeReact's component styles), the
> Cratis baseline theme (`@cratis/components/theme`), or your own `pt`/CSS.
> Load none of them and the components render as their raw HTML primitives.
> **A preset alone is not one of the three** — `theme: { preset }` by itself
> emits `--p-*` tokens but styles nothing rendered here.
>
> The `--cratis-*` token layer is an **additive Cratis-scoped tint** for
> surfaces _our_ wrappers own (validation error text, the FormElement addon,
> breadcrumb borders, etc.). It is not, by itself, enough to skin the
> PrimeReact widgets — pair it with the baseline theme, styled mode, or a `pt`
> preset. Derive the preset (styled mode) or override the `--cratis-*` tokens
> (baseline theme) when you want the whole UI in your palette.

All setups share the same one-line provider setup. You can change direction
later because the same provider, tokens, and `pt` hooks stay available.

### One-line setup (every styling option)

```tsx
import '@cratis/components/tokens';
import '@cratis/components/styles';
import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider>
        <YourApp />
    </CratisComponentsProvider>
);
```

- `@cratis/components/tokens` is the `--cratis-*` CSS variable layer every
  internal component reads from. It is the seam that lets the library span
  PrimeReact major versions, so it is always needed.
- `@cratis/components/styles` is every component stylesheet in one file, plus
  the Tailwind utility classes used inside the package and the third-party
  `allotment` rules `DataPage` needs. Components no longer import their own
  CSS — that is what made the published package unloadable in Node
  ([#118](https://github.com/Cratis/Components/issues/118)) — so this import is
  required, not optional.
- `CratisComponentsProvider` is a thin wrapper over `@primereact/core`'s
  `PrimeReactProvider` so Cratis has one place to layer in defaults (including
  the optional `...styledMode()` styled layer). Drop in the raw
  `PrimeReactProvider` from `@primereact/core` if you'd rather.

The setups below differ only in **what else** you load on top of this
provider setup.

---

### Use PrimeReact's styled mode

PrimeReact 11 dropped the v10 `primereact/resources/themes/*/theme.css`
stylesheets. A theme is now handed to the provider at runtime, in two halves: a
`@primeuix/themes` **preset** (a token object `@primeuix/styled` turns into
`--p-*` custom properties) and PrimeReact's **component styles**
(`@primereact/styles` — the `p-*` class names and the CSS the tokens drive).
`styledMode()` from `@cratis/components/styled` returns both as
`{ theme, defaults }`; spread it into the provider `value` next to your
license key. The `defaults` are `primeReactStyles`, PrimeReact's component
styles keyed by primitive name, which the provider applies to **every**
primitive rendered under it — the ones this library renders and the ones your
app renders itself. That is what puts the `p-*` class names on the elements and
lets the preset paint them; the `--cratis-*` tokens follow the preset's `--p-*`
so Cratis-scoped surfaces stay in sync.

```bash
npm install @primereact/styles @primeuix/themes   # optional peers, styled mode only
```

```tsx
import 'primeicons/primeicons.css';
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

The default preset is `CratisPreset` — Lara with the blue primary and gray
surfaces of PrimeReact 10's `lara-light-blue` / `lara-dark-blue`, with the dark
surface scale one step lighter so content sits above the page as it did there,
both color schemes.
Options: `preset` (any `@primeuix/themes` preset — Aura, Lara, Nora, Material —
or a `definePreset` result), `darkModeSelector` (default `.cratis-dark`, the
class the baseline theme uses too; `'system'` follows `prefers-color-scheme`),
`cssLayer` (default the `primereact` layer ordered between Tailwind's `base`
and `components`; `false` emits the theme unlayered).

> **A preset alone styles nothing.** `value={{ theme: { preset } }}` without the
> `defaults` emits the `--p-*` tokens, but the primitives keep rendering with no
> `p-*` class, so nothing rendered by this library is painted. Use
> `styledMode()`.

#### Override a single component with CSS

Plain CSS works fine on top of the theme. In styled mode PrimeReact's elements
carry their `p-*` class names, and the theme is emitted into the `primereact`
cascade layer, so a plain unlayered rule in your own stylesheet wins — exactly
as it did against PrimeReact 10's `@layer primereact` stylesheets. Or target
your own `className`:

```css
/* yourApp.css */
.p-button {
    border-radius: 999px; /* pill buttons everywhere */
}

.dangerous-button {
    background: var(--cratis-red-500);
    color: white;
}
```

```tsx
<Button className='dangerous-button'>Delete</Button>
```

#### Override a single component with Tailwind

Pass Tailwind utility classes through the wrapper's `className` prop:

```tsx
<InputTextField value={c => c.name}
                className="rounded-2xl bg-slate-900 text-slate-50" />

<Dialog title="Confirm" className="shadow-2xl rounded-3xl">
    {/* … */}
</Dialog>
```

**Use this setup when:** you're prototyping, building internal tools, want the
look Cratis apps had on PrimeReact 10, or are happy with one of the prebuilt
PrimeReact design systems.

### Use the Cratis baseline theme

Want a polished default look **without adding `@primereact/styles` and
`@primeuix/themes`**? Ship the components unstyled and import the Cratis baseline
theme — Cratis-authored MIT CSS that styles every component from the `--cratis-*`
layer. (You still need a PrimeUI key to run PrimeReact itself — see
[Licensing](#licensing).)

```tsx
import 'primeicons/primeicons.css';
import '@cratis/components/theme'; // the baseline theme

export const App = () => (
    <CratisComponentsProvider value={{ unstyled: true }}>
        <div className='cratis-theme'>
            {' '}
            {/* scope: put on <body>, app root, or a subtree */}
            <YourApp />
        </div>
    </CratisComponentsProvider>
);
```

Add `cratis-dark` to an ancestor for the dark palette. The theme defers to a
`@primeuix/themes` preset's `--p-*` tokens when one is present, so you can layer
it under styled mode too, and every rule is overridable via your own CSS or `pt`.
The baseline theme styles the unstyled primitives through their `[data-scope]`
attributes — there are no `p-*` class names outside styled mode — so target
those, or your own `className`, or the `--cratis-*` tokens:

```css
.cratis-theme [data-scope='button'] {
    border-radius: 999px;
} /* pill buttons */
.dangerous {
    background: var(--cratis-red-500);
    color: white;
}
```

---

### Use a custom palette on top of a PrimeReact theme

Keep a theme as your **structural baseline** (so every widget gets its
padding, dialog frame, button shape, focus ring, etc.) and repaint it with your
own colors. Which knob you turn depends on the theme:

- **Cratis baseline theme** — override the `--cratis-*` tokens in CSS; the
  theme paints the widgets from them, so one override repaints widgets and
  Cratis-scoped surfaces alike.
- **PrimeReact's styled mode** — derive your own preset with `definePreset` and
  hand it to `styledMode({ preset })`; the widgets read the preset's `--p-*`
  tokens, and the `--cratis-*` tokens follow.

#### Baseline theme, plain CSS

```css
/* palette.override.css — imported once, after @cratis/components/theme */
.cratis-theme {
    --cratis-surface-section: #0f172a;
    --cratis-surface-card: #1e293b;
    --cratis-surface-overlay: #1e293b;
    --cratis-surface-hover: #334155;
    --cratis-surface-border: #334155;

    --cratis-text-color: #f8fafc;
    --cratis-text-color-secondary: #94a3b8;

    --cratis-primary-color: #38bdf8;
    --cratis-primary-color-text: #0b1220;

    --cratis-highlight-bg: #1e40af;
    --cratis-highlight-text-color: #ffffff;

    --cratis-border-radius: 10px;
}
```

#### Styled mode, `definePreset`

```ts
// brand-preset.ts
import { definePreset } from '@primeuix/themes';
import { CratisPreset } from '@cratis/components/styled';

export const BrandPreset = definePreset(CratisPreset, {
    semantic: {
        primary: {
            50: '{sky.50}',
            100: '{sky.100}',
            200: '{sky.200}',
            300: '{sky.300}',
            400: '{sky.400}',
            500: '{sky.500}',
            600: '{sky.600}',
            700: '{sky.700}',
            800: '{sky.800}',
            900: '{sky.900}',
            950: '{sky.950}',
        },
    },
});
```

```tsx
<CratisComponentsProvider value={{ license, ...styledMode({ preset: BrandPreset }) }}>
```

#### Scoped (dark-on-light, light-on-dark, etc.)

`--cratis-*` tokens cascade like any other CSS variable, so an ancestor scope
works under the baseline theme (in styled mode, region-scoped widget colors come
from the preset; the `--cratis-*` overrides still retint Cratis-scoped surfaces):

```css
.dark-zone {
    --cratis-surface-card: #0b1220;
    --cratis-text-color: #f8fafc;
    --cratis-primary-color: #60a5fa;
}
```

```tsx
<div className='dark-zone'>
    <Dialog title='Always dark'>…</Dialog>
</div>
```

#### With Tailwind CSS

Tailwind's `@layer base` is the idiomatic spot — declare the palette once and
Tailwind handles cascade and dark mode:

```css
/* app.css */
@import 'tailwindcss';
@import '@cratis/components/tokens';
@import '@cratis/components/styles';

@layer base {
    :root {
        --cratis-surface-card: theme('colors.slate.800');
        --cratis-surface-border: theme('colors.slate.700');
        --cratis-text-color: theme('colors.slate.50');
        --cratis-primary-color: theme('colors.sky.400');
        --cratis-red-500: theme('colors.red.500');
    }

    .cratis-dark {
        --cratis-surface-card: theme('colors.slate.900');
        --cratis-text-color: theme('colors.slate.100');
    }
}
```

#### CSS written against PrimeReact 10's variables

If your stylesheets still use the names a v10 theme published on `:root` —
`--surface-ground`, `--surface-card`, `--surface-border`, `--text-color`,
`--primary-color`, the `--surface-0…900` and color scales — import
`@cratis/components/primereact-v10-palette` after `tokens` and `styles`. It
restores every one of them with the `lara-light-blue` / `lara-dark-blue`
values: the semantic names follow the active preset's `--p-*` tokens where
v11 has an equivalent (Lara as the fallback), the numbered scales are the
lara-blue values verbatim (the v10 dark surface scale was inverted, so
`--p-surface-*` cannot stand in for it), and light/dark switch through
`light-dark()` keyed off `.cratis-dark`. It exists so what is already written
keeps working — write nothing new against those names; use `--cratis-*` (or
`--p-*`).

#### What `--cratis-*` tokens are for

In styled mode PrimeReact widgets read the preset's `--p-*` design tokens
directly. Cratis wrappers add some surfaces of their own (inline validation
error text, the FormElement addon background, the breadcrumb bottom border,
etc.) — those use a parallel set of `--cratis-*` tokens that resolve the v11
token first and fall back to the v10 variable, via the cascade defined in
`tokens.css`. Under the baseline theme the widgets read the `--cratis-*` tokens
too.

The upshot:

- Repaint the whole UI by deriving the **preset** (styled mode) or overriding the **`--cratis-*` tokens** (baseline theme).
- Override **`--cratis-*` tokens** in styled mode when you specifically want Cratis surfaces to differ from PrimeReact widgets.

#### `--cratis-*` token reference (Cratis-scoped surfaces)

| Group     | Tokens                                                                                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surfaces  | `--cratis-surface-0`, `--cratis-surface-100`, `--cratis-surface-ground`, `--cratis-surface-section`, `--cratis-surface-card`, `--cratis-surface-overlay`, `--cratis-surface-hover`, `--cratis-surface-border` |
| Text      | `--cratis-text-color`, `--cratis-text-color-secondary`                                                                                                                                                        |
| Brand     | `--cratis-primary-color`, `--cratis-primary-color-text`, `--cratis-primary-300`, `--cratis-primary-400`, `--cratis-primary-500`, `--cratis-primary-600`                                                       |
| Selection | `--cratis-highlight-bg`, `--cratis-highlight-text-color`                                                                                                                                                      |
| Semantic  | `--cratis-green-500`, `--cratis-orange-500`, `--cratis-red-500`                                                                                                                                               |
| Geometry  | `--cratis-border-radius`                                                                                                                                                                                      |
| Effects   | `--cratis-focus-ring`, `--cratis-maskbg`                                                                                                                                                                      |

Each resolves the v11 design token first and falls back to the v10 variable
with the same name minus the `--cratis-` prefix (e.g. `--cratis-surface-card`
→ `var(--p-content-background, var(--surface-card))`).

**Use this setup when:** you want a custom look without writing a PrimeReact
theme from scratch, you're shipping multiple palette variants (light/dark/
brand), or you want Cratis-scoped surfaces tinted differently from PrimeReact
widgets.

---

### Use fully unstyled mode

Turn off every PrimeReact base style at the provider and supply visuals
through PrimeReact's `pt` (pass-through) mechanism, your own CSS, or both.
Components render structurally only and become a blank canvas.

```tsx
import '@cratis/components/styles'; // component rules + Tailwind utilities, still needed when unstyled
import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider value={{ unstyled: true, pt: globalPt }}>
        <YourApp />
    </CratisComponentsProvider>
);
```

#### Verify pass-through compatibility

Components 3 publishes its PrimeReact 11 slot and rendered-marker contract from `@cratis/components/compatibility`. In a DOM test, apply `primeReact11PassThroughSentinelPreset`, render the surfaces your application uses, and call `assertPrimeReact11PassThroughCompatibility(root, components)`. Additions pass; a missing or renamed contracted slot or marker produces an actionable error. The contract is major-version scoped and does not preserve PrimeReact 10 names.

The machine-readable `components3PrimeReact11PassThroughContract` is the source of truth. Contract revision 1 covers the parts rendered by Components 3's supported compositions on PrimeReact 11, rather than every optional part an application could compose directly. See the [pass-through contract documentation](https://cratis.io/Components/styling/pass-through.html) for the supported component and slot list.

#### A `pt` preset in plain CSS

Attach a `className` from your own stylesheet via a global preset:

```ts
// pt-preset.ts
export const globalPt = {
    button: {
        root: { className: 'my-btn' },
    },
    dialog: {
        root: {
            popup: { className: 'my-dialog' },
            header: { className: 'my-dialog__header' },
            content: { className: 'my-dialog__body' },
        },
    },
    inputtext: {
        root: { className: 'my-input' },
    },
} as const;
```

```css
/* yourApp.css */
.my-btn {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    background: var(--cratis-primary-color);
    color: var(--cratis-primary-color-text);
    border: none;
    border-radius: var(--cratis-border-radius);
    cursor: pointer;
}

.my-dialog__header {
    padding: 1rem 1.25rem;
    background: var(--cratis-surface-card);
    border-bottom: 1px solid var(--cratis-surface-border);
    font-weight: 600;
}
```

#### A `pt` preset in Tailwind

Same shape, Tailwind utilities as the class strings:

```ts
// pt-preset.ts
export const globalPt = {
    button: {
        root: {
            className:
                'inline-flex items-center px-4 py-2 rounded-lg bg-sky-700 text-white hover:bg-sky-600 disabled:opacity-50',
        },
    },
    dialog: {
        root: {
            popup: { className: 'rounded-2xl shadow-2xl overflow-hidden' },
            header: {
                className:
                    'px-5 py-3 bg-slate-800 text-slate-50 font-semibold border-b border-slate-700',
            },
            content: { className: 'p-5 bg-slate-900 text-slate-100' },
        },
    },
    inputtext: {
        root: {
            className:
                'w-full px-3 py-2 rounded-md bg-slate-800 text-slate-50 border border-slate-700 focus:border-sky-400 focus:outline-none',
        },
    },
} as const;
```

#### Per-instance overrides

Anything global can be overridden per-instance — useful when one component
needs to look different:

```tsx
<Dialog
    title="Brand callout"
    pt={{ root: { className: 'rounded-none' },
          header: { className: 'bg-pink-600 text-white' } }}>
    …
</Dialog>

<InputTextField value={c => c.name}
                pt={{ root: { className: 'border-2 border-pink-500' } }} />
```

#### Composite components in unstyled mode

`DataPage` and `StepperCommandDialog` compose multiple PrimeReact widgets and
expose explicit per-slot props. The global `pt` reaches every internal widget;
per-instance overrides target the inner slot directly:

```tsx
<DataPage<AllAuthors, Author, never>
    title="Authors" query={AllAuthors}
    tablePt={{ table: { className: 'min-w-full divide-y divide-slate-700' } }}
    menubarPt={{ root: { className: 'px-3 py-2 bg-slate-900' } }}>
    <DataPage.MenuItems>…</DataPage.MenuItems>
    <DataPage.Columns>…</DataPage.Columns>
</DataPage>

<StepperCommandDialog<RegisterOrder> command={RegisterOrder} title="New order"
    /* pt targets the Stepper */
    pt={{ stepperpanel: { content: { className: 'pt-6' } } }}
    /* dialogPt targets the outer Dialog */
    dialogPt={{ header: { className: 'bg-slate-900' } }}>
    …
</StepperCommandDialog>
```

`ObjectContentEditor`, `ObjectNavigationalBar`, and `SchemaEditor` accept only
`className` on the root — restyle their internals via the **global** `pt`
preset.

**Use this setup when:** you have a design system to honor, you're matching a
brand kit, or you want zero PrimeReact CSS in the final bundle.

---

### Combining styling setups

The styling options compose, so you don't have to choose one for the whole app:

- **Themed with one unstyled component** — keep the PrimeReact theme and pass
  `unstyled` per-component to opt that one widget out:

    ```tsx
    <Dialog title='Custom' unstyled pt={brandDialogPt}>
        …
    </Dialog>
    ```

- **Unstyled with one themed island** — the baseline theme's rules are scoped
  under `.cratis-theme`, so wrapping one element in the class themes just that
  subtree:

    ```tsx
    <CratisComponentsProvider value={{ unstyled: true, pt: globalPt }}>
        <App />
        <div className='cratis-theme'>
            <BaselineThemedSubtree />
        </div>
    </CratisComponentsProvider>
    ```

- **Dark mode** — toggle `cratis-dark` on the root element: the baseline
  theme's dark palette, `styledMode()`'s dark scheme (its default
  `darkModeSelector`) and the v10 palette all key off it, so PrimeReact widgets
  and Cratis surfaces follow together. Scope any `--cratis-*` tokens you want
  to diverge to `.cratis-dark` as well.

### Per-component `pt` cheat sheet

Three patterns, depending on how much PrimeReact a wrapper composes:

1. **Single-widget wrappers** — `Dialog`, every `CommandForm` field,
   `EventsView`, and `Dropdown` forward `pt`, `ptOptions`, `unstyled`, and
   `className` straight to their inner PrimeReact component.
2. **Multi-slot composites** — `StepperCommandDialog` (`pt` for Stepper,
   `dialogPt` for Dialog), `DataPage` (`tablePt` for DataTable, `menubarPt`
   for the action toolbar's buttons), and `DataTableForQuery` /
   `DataTableForObservableQuery` (`pt` for DataTable plus
   `paginatorClassName` / `paginatorAriaLabels` for the Cratis paginator).
3. **Large composites** — `ObjectContentEditor`, `ObjectNavigationalBar`,
   `SchemaEditor` expose `className` only; restyle internals via the global
   `pt` preset.

`Dropdown` routes `id`, `tabIndex`, `aria-label`, `aria-labelledby` and `aria-describedby` to its focusable `role="combobox"` trigger. The outer Select root remains a layout wrapper and does not duplicate the control id. For filterable dropdowns, `filterPlaceholder` can differ from the closed trigger's `placeholder` and defaults to it when omitted.

Filtered data-table columns accept partial `filterLabels` overrides for trigger, action and boolean-option text, plus a `filterElement` render callback that replaces the built-in value editor while keeping draft/apply behavior. `DataTableFilterMatchMode` supplies the Cratis-owned built-in vocabulary, and `registerDataTableFilterMatcher()` adds custom modes without importing the active rendering adapter.

`DatePickerInput` exposes `id`, `disabled`, `readOnly` and `showButtonBar` directly. Use its runtime `input` slot only for additional attributes; the public type intentionally rejects PrimeReact 11's stale `pcInputText` declaration, which the runtime never emits. The wrapper translates `invalid` to accepted `aria-invalid` and `data-invalid` input attributes instead of forwarding a rejected `invalid` DOM attribute:

```tsx
<DatePickerInput
    id='appointment-date'
    value={selectedDate}
    onChange={setSelectedDate}
    disabled={isDisabled}
    readOnly={isReadOnly}
    showButtonBar
    pt={{ input: { 'aria-label': 'Appointment date' } }}
/>
```

### What is _not_ fully pass-through

`BusyIndicatorDialog` only honors the global `pt` set via
`CratisComponentsProvider`; it does not accept per-instance `pt` because its
request type is owned by `@cratis/arc.react`.

## Troubleshooting

### Module Resolution Errors

If you encounter errors like:

```
Cannot find module '@cratis/components/TimeMachine' or its corresponding type declarations.
```

**Solution:** Ensure you're using the correct case-sensitive import paths (e.g., `TimeMachine`, not `timeMachine`).

If using TypeScript 4.7+, try updating your `tsconfig.json`:

```json
{
    "compilerOptions": {
        "moduleResolution": "bundler" // or "node16" / "nodenext"
    }
}
```

### Import Errors

Ensure you're using the correct import paths. The package uses case-sensitive paths that match the actual component names.
