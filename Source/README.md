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
npm install @cratis/components primereact @primereact/core @primereact/headless primeicons
# or
yarn add @cratis/components primereact @primereact/core @primereact/headless primeicons
```

**PrimeReact is a peer dependency** as of 3.0.0. You install it; the library uses
your copy. This is deliberate: when `primereact` was a regular dependency, an app
that also depended on it could end up with **two copies** — and two copies mean two
`PrimeReactProvider` React contexts, so components rendered from the library read a
different config, theme and z-index registry than components you render yourself.
Nothing errors; overlays just stack wrongly and `pt` / `unstyled` silently fail to
apply. If your app carries a `resolutions` / `overrides` pin to collapse PrimeReact
into one copy, you can now delete it.

`primereact` pins `@primereact/core` and `@primereact/headless` to its own exact
version, so one `primereact@11.x` install gives you matching copies of all three;
declaring them is what makes a strict installer (pnpm, Yarn PnP) resolve them for the
library too. `@primereact/types` is an **optional** peer — needed only if your own
code imports the prop types the wrappers re-export.

The other **peer dependencies** you provide are `react` / `react-dom` (**19+**), the
`@cratis/arc*` packages (`>=20.3.1 <22` — Arc 20 and 21 both work), `reflect-metadata`
and `tsyringe`; you typically already have these in a Cratis app. `pixi.js`,
`framer-motion`, `allotment` and `react-icons` remain regular dependencies and are
installed for you. The styled `@primeuix/themes` presets are optional and only needed
if you opt into a preset (see [Styling](#styling)).

### Stylesheets

Component CSS is no longer imported by the JavaScript — import it once in your app
entry point, in this order:

```ts
import '@cratis/components/tokens';   // the --cratis-* token layer
import '@cratis/components/styles';   // every component stylesheet, in one file
import '@cratis/components/theme';    // optional — the Cratis baseline look (MIT CSS)
```

`./styles` also vendors `allotment/dist/style.css`, which `DataPage` needs for its
split view, so you do not have to import that yourself.

## Licensing

**As of 3.0.0 this library builds on PrimeReact 11, which is no longer MIT.** PrimeReact 10
was; PrimeReact 11 is part of PrimeTek's commercial **PrimeUI** family, and so are the
packages it brings with it.

| Package | v10 | v11 |
|---|---|---|
| `primereact` | MIT | PrimeUI commercial |
| `primeicons` | MIT (7.x) | PrimeUI commercial (8.x) |
| `@primereact/core`, `@primereact/headless` | — | PrimeUI commercial |
| `@primeuix/themes`, `@primeuix/styled` | — | PrimeUI commercial |

`@cratis/components` itself remains **MIT**. The change is in what it depends on, and it is
yours to satisfy: PrimeReact is a peer dependency, so you install it and its license terms
apply to you directly.

### A key is required regardless of how you style

PrimeReact 11 verifies a license key when `PrimeReactProvider` mounts. The check is not
conditional on `unstyled`, on whether a theme preset is applied, or on `NODE_ENV` — so
every styling setup in [Styling](#styling) reaches it. Without a valid key you get a
console warning and a fixed *"Invalid PrimeUI License"* banner, in development **and**
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
  organization it requires *all* of: under $1M USD annual gross revenue, fewer than 5
  developers, fewer than 10 employees, and under $3M USD in outside funding. Supports up to
  4 developers and is renewed annually by confirming continued eligibility.
- **[Commercial License](https://primeui.dev/licenses/commercial)** — for everyone else.
  Per developer, perpetual, with one year of updates.

### If you redistribute

PrimeReact 11's terms state: *"You may not … redistribute it as a component library or
development tool … Redistributing the software so that third parties can develop with it
requires a separate OEM License."*

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
- `@cratis/components/Notifications` — `Toaster`, `toast`, `toastCommandResult`
- `@cratis/components/ObjectContentEditor`
- `@cratis/components/ObjectNavigationalBar`
- `@cratis/components/PivotViewer`
- `@cratis/components/SchemaEditor`
- `@cratis/components/TimeMachine`
- `@cratis/components/Toolbar`
- `@cratis/components/types`

Stylesheets:

- `@cratis/components/theme` — the **Cratis baseline theme** (light + dark, Cratis-authored MIT CSS, no `@primeuix/themes` dependency); import it and add `class="cratis-theme"` to skin every component from the token layer
- `@cratis/components/styles` — **required**: every component stylesheet, the Tailwind utilities used inside the package, and the `allotment` rules `DataPage` needs, in one file
- `@cratis/components/tokens` — **required**: the `--cratis-*` CSS variable tokens every component reads from

## Styling

This package ships primarily for its functionality and Arc integrations.
Styling is designed to stay out of the way: choose the setup that matches how
much control you want, and the other layers stay invisible.

> **Tip — see each setup live:** every Storybook story includes a **Styling**
> toolbar (paintbrush icon) that flips between the modes demonstrating the
> setups below: *Aura Dark* and *Aura Light* (an `@primeuix/themes`
> preset), *Cratis baseline theme* (light and dark), *Unstyled
> (bare structure)*, and *Unstyled + Tailwind pt*. Open any story (`yarn dev`)
> and switch modes to see the same component under each setup.

### TL;DR — choose a styling setup

> **A PrimeUI license key is required for every row below** — see [Licensing](#licensing).
> The styling choice changes how it looks and whether you additionally pull in
> `@primeuix/themes`; it does not change whether you need a key.

| Setup | When | Effort | Extra dependency | What you write |
|---|---|---|---|---|
| **Cratis baseline theme** | You want a polished default look without adding a theme package. | Lowest | None | `unstyled` + `import '@cratis/components/theme'` + `class="cratis-theme"` |
| **A styled `@primeuix/themes` preset** | You want a prebuilt design system to tweak from. | Low | `@primeuix/themes` | `value={{ theme: { preset } }}` on the provider |
| **A custom palette over a preset** | You want the preset's structure but your own colors. | Low | `@primeuix/themes` | A preset + CSS variable overrides |
| **Fully unstyled** | You're integrating into a tightly controlled design system. | Highest | None | `unstyled: true` + a `pt` preset in CSS or Tailwind |

> **Why you need a theme, a baseline stylesheet, or a `pt` preset**
>
> PrimeReact 11 is **unstyled-first**: the primitives render structural markup
> with no built-in visuals. A look comes from one of three sources — a
> `@primeuix/themes` preset (token-based), the Cratis baseline
> theme (`@cratis/components/theme`), or your own `pt`/CSS. Load
> none of them and the components render as their raw HTML primitives.
>
> The `--cratis-*` token layer is an **additive Cratis-scoped tint** for
> surfaces *our* wrappers own (validation error text, the FormElement addon,
> breadcrumb borders, etc.). It is not, by itself, enough to skin the
> PrimeReact widgets — pair it with the baseline theme, a preset, or a `pt`
> preset. Override the PrimeReact variables (or a preset's `--p-*` tokens) when
> you want the whole UI in your palette.

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
  the optional `value={{ theme: { preset } }}` styled layer). Drop in the raw
  `PrimeReactProvider` from `@primereact/core` if you'd rather.

The setups below differ only in **what else** you load on top of this
provider setup.

---

### Use a styled preset

PrimeReact 11 dropped the v10 `primereact/resources/themes/*/theme.css`
stylesheets in favor of the token-based `@primeuix/themes` layer. Apply a
preset by passing `value={{ theme: { preset } }}` to `CratisComponentsProvider` —
no theme CSS import. PrimeReact's own widgets paint themselves from the preset, and the
`--cratis-*` tokens cascade to the matching variables so Cratis-scoped surfaces
follow along.

```tsx
import Aura from '@primeuix/themes/aura';   // or lara / nora / material
import 'primeicons/primeicons.css';
import '@cratis/components/styles';

import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider value={{ theme: { preset: Aura } }}>
        <YourApp />
    </CratisComponentsProvider>
);
```

Omit `theme` entirely to stay unstyled-first — ship only structure plus the
`--cratis-*` tokens and bring your own visuals (see the pass-through / `pt`
options below).

### Use the Cratis baseline theme

Want a polished default look **without adding `@primeuix/themes`**? Ship the
components unstyled and import the Cratis baseline theme — Cratis-authored MIT
CSS that styles every component from the `--cratis-*` layer. (You still need a
PrimeUI key to run PrimeReact itself — see [Licensing](#licensing).)

```tsx
import 'primeicons/primeicons.css';
import '@cratis/components/theme';   // the baseline theme

export const App = () => (
    <CratisComponentsProvider value={{ unstyled: true }}>
        <div className="cratis-theme">   {/* scope: put on <body>, app root, or a subtree */}
            <YourApp />
        </div>
    </CratisComponentsProvider>
);
```

Add `cratis-dark` to an ancestor for the dark palette. The theme defers to a
`@primeuix/themes` preset's `--p-*` tokens when one is present, so you can layer
it under a preset too, and every rule is overridable via your own CSS or `pt`.

#### Override a single component with CSS

Plain CSS works fine on top of the theme. Target either PrimeReact's class
names or your own `className`:

```css
/* yourApp.css */
.p-button {
    border-radius: 999px;            /* pill buttons everywhere */
}

.dangerous-button {
    background: var(--cratis-red-500);
    color: white;
}
```

```tsx
<Button label="Delete" className="dangerous-button" />
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

**Use this setup when:** you're prototyping, building internal tools, or are
happy with one of the prebuilt PrimeReact themes.

---

### Use a custom palette on top of a PrimeReact theme

Keep a PrimeReact theme as your **structural baseline** (so every widget gets
its padding, dialog frame, button shape, focus ring, etc.) and override the
PrimeReact CSS variables on `:root` to repaint the whole UI in your own
colors. The `--cratis-*` tokens follow along through tokens.css's cascade, so
Cratis-scoped surfaces stay in sync — and you can override the Cratis tokens
independently if you want Cratis surfaces to differ from PrimeReact widgets.

#### With plain CSS

```css
/* palette.override.css — imported once, after @cratis/components/styles */
:root {
    /* PrimeReact variables — these are what PrimeReact widgets read. */
    --surface-0:        #1e293b;
    --surface-100:      #1e293b;
    --surface-ground:   #020617;
    --surface-section:  #0f172a;
    --surface-card:     #1e293b;
    --surface-overlay:  #1e293b;
    --surface-hover:    #334155;
    --surface-border:   #334155;

    --text-color:           #f8fafc;
    --text-color-secondary: #94a3b8;

    --primary-color:      #38bdf8;
    --primary-color-text: #0b1220;

    --highlight-bg:         #1e40af;
    --highlight-text-color: #ffffff;

    --border-radius: 10px;

    /* --cratis-* tokens default to var(--surface-*) etc. via tokens.css, so
       the overrides above flow through automatically. Set these explicitly
       only if you want Cratis-scoped surfaces tinted differently. */
    --cratis-red-500:   #ef4444;
    --cratis-green-500: #22c55e;
}
```

```tsx
// 1. A styled preset provides the structure (apply it via the provider — see above).
import 'primeicons/primeicons.css';
import '@cratis/components/styles';
// 2. Your palette overrides — must come after the styles so they win.
import './palette.override.css';
```

#### Scoped (dark-on-light, light-on-dark, etc.)

PrimeReact variables cascade like any other CSS variable, so an ancestor
scope works:

```css
.dark-zone {
    --surface-card: #0b1220;
    --text-color:   #f8fafc;
    --primary-color: #60a5fa;
}
```

```tsx
<div className="dark-zone">
    <Dialog title="Always dark">…</Dialog>
</div>
```

#### With Tailwind CSS

Tailwind's `@layer base` is the idiomatic spot — declare the palette once and
Tailwind handles cascade and dark mode:

```css
/* app.css */
@import "tailwindcss";
@import "@cratis/components/styles";

@layer base {
    :root {
        --surface-card:   theme('colors.slate.800');
        --surface-border: theme('colors.slate.700');
        --text-color:     theme('colors.slate.50');
        --primary-color:  theme('colors.sky.400');
        --cratis-red-500: theme('colors.red.500');
    }

    .dark {
        --surface-card: theme('colors.slate.900');
        --text-color:   theme('colors.slate.100');
    }
}
```

#### What `--cratis-*` tokens are for

PrimeReact widgets read PrimeReact's own variables (`--surface-card`,
`--text-color`, `--primary-color`, …) directly. Cratis wrappers add some
surfaces of their own (inline validation error text, the FormElement addon
background, the breadcrumb bottom border, etc.) — those use a parallel set
of `--cratis-*` tokens that default to the PrimeReact value via the cascade
defined in `tokens.css`.

The upshot:

- Override **PrimeReact variables** to repaint the whole UI (PrimeReact widgets + Cratis surfaces).
- Override **`--cratis-*` tokens** when you specifically want Cratis surfaces to differ from PrimeReact widgets.

#### `--cratis-*` token reference (Cratis-scoped surfaces)

| Group | Tokens |
|---|---|
| Surfaces | `--cratis-surface-0`, `--cratis-surface-100`, `--cratis-surface-ground`, `--cratis-surface-section`, `--cratis-surface-card`, `--cratis-surface-overlay`, `--cratis-surface-hover`, `--cratis-surface-border` |
| Text | `--cratis-text-color`, `--cratis-text-color-secondary` |
| Brand | `--cratis-primary-color`, `--cratis-primary-color-text`, `--cratis-primary-300`, `--cratis-primary-400`, `--cratis-primary-500`, `--cratis-primary-600` |
| Selection | `--cratis-highlight-bg`, `--cratis-highlight-text-color` |
| Semantic | `--cratis-green-500`, `--cratis-orange-500`, `--cratis-red-500` |
| Geometry | `--cratis-border-radius` |
| Effects | `--cratis-focus-ring`, `--cratis-maskbg` |

Each defaults to the PrimeReact variable with the same name minus the
`--cratis-` prefix (e.g. `--cratis-surface-card` → `var(--surface-card)`).

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
import '@cratis/components/styles';   // component rules + Tailwind utilities, still needed when unstyled
import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider value={{ unstyled: true, pt: globalPt }}>
        <YourApp />
    </CratisComponentsProvider>
);
```

#### A `pt` preset in plain CSS

Attach a `className` from your own stylesheet via a global preset:

```ts
// pt-preset.ts
export const globalPt = {
    button: {
        root: { className: 'my-btn' },
    },
    dialog: {
        root: { className: 'my-dialog' },
        header: { className: 'my-dialog__header' },
        content: { className: 'my-dialog__body' },
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
        root: { className: 'inline-flex items-center px-4 py-2 rounded-lg bg-sky-700 text-white hover:bg-sky-600 disabled:opacity-50' },
    },
    dialog: {
        root:    { className: 'rounded-2xl shadow-2xl overflow-hidden' },
        header:  { className: 'px-5 py-3 bg-slate-800 text-slate-50 font-semibold border-b border-slate-700' },
        content: { className: 'p-5 bg-slate-900 text-slate-100' },
    },
    inputtext: {
        root: { className: 'w-full px-3 py-2 rounded-md bg-slate-800 text-slate-50 border border-slate-700 focus:border-sky-400 focus:outline-none' },
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
  <Dialog title="Custom" unstyled pt={brandDialogPt}>…</Dialog>
  ```
- **Unstyled with one themed island** — wrap a subtree in a second
  `CratisComponentsProvider` that restores defaults:
  ```tsx
  <CratisComponentsProvider value={{ unstyled: true, pt: globalPt }}>
      <App />
      <CratisComponentsProvider value={{ unstyled: false }}>
          <PrimeReactThemedSubtree />
      </CratisComponentsProvider>
  </CratisComponentsProvider>
  ```
- **Dark mode** — scope the palette overrides to `.dark` (override
  `--surface-card`, `--text-color`, `--primary-color`, etc., plus any
  `--cratis-*` tokens you want to diverge) and toggle the class on the root
  element. PrimeReact widgets and Cratis surfaces both follow the cascade.

### Per-component `pt` cheat sheet

Three patterns, depending on how much PrimeReact a wrapper composes:

1. **Single-widget wrappers** — `Dialog`, every `CommandForm` field,
   `EventsView`, and `Dropdown` forward `pt`, `ptOptions`, `unstyled`, and
   `className` straight to their inner PrimeReact component.
2. **Multi-slot composites** — `StepperCommandDialog` (`pt` for Stepper,
   `dialogPt` for Dialog), `DataPage` (`tablePt` for DataTable, `menubarPt`
   for Menubar), and `DataTableForQuery` / `DataTableForObservableQuery`
   (`pt` for DataTable, `paginatorPt` for Paginator) — each slot has
   `*PtOptions`, `*Unstyled`, and (where applicable) `*ClassName` siblings.
3. **Large composites** — `ObjectContentEditor`, `ObjectNavigationalBar`,
   `SchemaEditor` expose `className` only; restyle internals via the global
   `pt` preset.

### What is *not* fully pass-through

A small number of internal usages opt into PrimeReact's slot-rendering by
name (for example, a custom Menubar item template uses `p-menuitem-link` /
`p-menuitem-text` to match the surrounding default-rendered items). These are
correct contracts with PrimeReact's own slot rendering, not hard-coded
theming — they have no effect in `unstyled` mode and match the rest of the
menu in themed mode.

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
    "moduleResolution": "bundler"  // or "node16" / "nodenext"
  }
}
```

### Import Errors

Ensure you're using the correct import paths. The package uses case-sensitive paths that match the actual component names.
