# Cratis Components

A collection of React components for building modern applications with Cratis.

## Requirements

### Minimum Versions

- TypeScript: 4.7+
- React: 18.0+ or 19.0+
- Node.js: 16+ (for development)

### TypeScript Configuration

This package is compatible with all modern TypeScript `moduleResolution` strategies:

- ✅ `"bundler"` (recommended for Vite, esbuild, webpack 5+)
- ✅ `"node16"` / `"nodenext"` (for Node.js projects)
- ✅ `"node"` (legacy, but supported)

The package provides dual CommonJS and ES Module builds with proper conditional exports for optimal module resolution and tree-shaking.

## Installation

```bash
npm install @cratis/components primereact primeicons react-router-dom
# or
yarn add @cratis/components primereact primeicons react-router-dom
```

`primereact`, `primeicons`, and `react-router-dom` are peer dependencies —
installing them in your app ensures a single copy is shared with the wrappers
in this package. The `@cratis/arc*` packages and `react`/`react-dom` are also
peer dependencies; you typically already have them.

The following are **optional** peer dependencies, only required if you use the
component that depends on them:

| Component | Optional peer |
|---|---|
| `PivotViewer` | `pixi.js` |
| `CommandStepper`, animated panels | `framer-motion` |
| `DataPage` resizable layout | `allotment` |

Install them only when you reach for the corresponding component.

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
- `@cratis/components/Dropdown`
- `@cratis/components/ObjectContentEditor`
- `@cratis/components/ObjectNavigationalBar`
- `@cratis/components/PivotViewer`
- `@cratis/components/SchemaEditor`
- `@cratis/components/TimeMachine`
- `@cratis/components/Toolbar`
- `@cratis/components/types`

Stylesheets:

- `@cratis/components/styles` — Tailwind utilities + Cratis CSS variable tokens (single stylesheet, recommended)
- `@cratis/components/tokens` — only the `--cratis-*` CSS variable tokens (for consumers using their own utility CSS solution)

## Styling

This package ships primarily for its functionality and Arc integrations.
Styling is designed to stay out of the way: pick the path that matches how
much control you want, and the other layers stay invisible.

> **Tip — see each path live:** every Storybook story includes a **Styling**
> toolbar (paintbrush icon) that flips between the five modes corresponding to
> the three paths below: *Lara Dark Blue*, *Lara Light Blue*, *Cratis-themed
> (custom tokens)*, *Unstyled (bare structure)*, and *Unstyled + Tailwind pt*.
> Open any story (`yarn dev`) and switch modes to see the same component under
> each setup.

### TL;DR — pick a path

| Path | When | Effort | What you write |
|---|---|---|---|
| **A. PrimeReact-themed** | You want it to look good immediately and tweak from there. | Lowest | One CSS import + provider |
| **B. Cratis-themed (no PrimeReact theme)** | You want a custom look but don't want to fight a third-party theme. | Low | Override `--cratis-*` tokens |
| **C. Fully unstyled** | You're integrating into a tightly-controlled design system. | Highest | A `pt` preset (in CSS or Tailwind) |

All three paths use the same one-line setup and remain switchable later — you
won't repaint yourself into a corner.

### One-line setup (every path)

```tsx
import '@cratis/components/styles';
import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider>
        <YourApp />
    </CratisComponentsProvider>
);
```

- `@cratis/components/styles` ships the Tailwind utility classes used inside
  the package plus the `--cratis-*` CSS variable token layer that every
  internal component reads from. (Use `@cratis/components/tokens` instead if
  you're bringing your own Tailwind.)
- `CratisComponentsProvider` is a thin wrapper over PrimeReact's
  `PrimeReactProvider` so Cratis has one place to layer in defaults. Drop in
  raw `PrimeReactProvider` if you'd rather.

The three paths below differ only in **what else** you load on top of this
setup.

---

### Path A — PrimeReact-themed (fastest start)

Load any PrimeReact theme stylesheet alongside Cratis Components. The
`--cratis-*` tokens cascade to PrimeReact's matching theme variables, so every
component picks the theme up automatically.

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

**Choose Path A when:** you're prototyping, building internal tools, or are
happy with one of the prebuilt PrimeReact themes.

---

### Path B — Cratis-themed (no PrimeReact theme)

Skip the PrimeReact theme stylesheet and define the look in one place by
overriding `--cratis-*` tokens on `:root` (or any ancestor scope). The
components render with structural defaults from the bundled stylesheet and
pull every color, border, and surface from your tokens.

#### With plain CSS

```css
/* tokens.override.css — imported once, anywhere after @cratis/components/styles */
:root {
    /* Surfaces */
    --cratis-surface-0:        #0f172a;
    --cratis-surface-100:      #1e293b;
    --cratis-surface-ground:   #020617;
    --cratis-surface-section:  #0f172a;
    --cratis-surface-card:     #1e293b;
    --cratis-surface-overlay:  #1e293b;
    --cratis-surface-hover:    #334155;
    --cratis-surface-border:   #334155;

    /* Text */
    --cratis-text-color:           #f8fafc;
    --cratis-text-color-secondary: #94a3b8;

    /* Brand */
    --cratis-primary-color:      #38bdf8;
    --cratis-primary-color-text: #0b1220;
    --cratis-primary-500:        #38bdf8;
    --cratis-primary-600:        #0ea5e9;

    /* Selection / accents */
    --cratis-highlight-bg:         #1e40af;
    --cratis-highlight-text-color: #ffffff;
    --cratis-red-500:              #ef4444;
    --cratis-green-500:            #22c55e;
    --cratis-orange-500:           #f97316;

    /* Geometry */
    --cratis-border-radius: 10px;
}
```

```tsx
import '@cratis/components/styles';
import './tokens.override.css';   // <-- after, so it wins
```

#### Scoped (dark-on-light, light-on-dark, etc.)

Tokens cascade, so any ancestor scope works:

```css
.dark-zone {
    --cratis-surface-card:   #0b1220;
    --cratis-text-color:     #f8fafc;
    --cratis-primary-color:  #60a5fa;
}
```

```tsx
<div className="dark-zone">
    <Dialog title="Always dark">…</Dialog>
</div>
```

#### With Tailwind CSS

Tailwind's `@layer base` is the idiomatic spot — write tokens once and
Tailwind handles cascade and dark mode:

```css
/* app.css */
@import "tailwindcss";
@import "@cratis/components/styles";

@layer base {
    :root {
        --cratis-surface-card:   theme('colors.slate.800');
        --cratis-surface-border: theme('colors.slate.700');
        --cratis-text-color:     theme('colors.slate.50');
        --cratis-primary-color:  theme('colors.sky.400');
        --cratis-red-500:        theme('colors.red.500');
    }

    .dark {
        --cratis-surface-card:   theme('colors.slate.900');
        --cratis-text-color:     theme('colors.slate.100');
    }
}
```

#### Complete token reference

| Group | Tokens |
|---|---|
| Surfaces | `--cratis-surface-0`, `--cratis-surface-100`, `--cratis-surface-ground`, `--cratis-surface-section`, `--cratis-surface-card`, `--cratis-surface-overlay`, `--cratis-surface-hover`, `--cratis-surface-border` |
| Text | `--cratis-text-color`, `--cratis-text-color-secondary` |
| Brand | `--cratis-primary-color`, `--cratis-primary-color-text`, `--cratis-primary-300`, `--cratis-primary-400`, `--cratis-primary-500`, `--cratis-primary-600` |
| Selection | `--cratis-highlight-bg`, `--cratis-highlight-text-color` |
| Semantic | `--cratis-green-500`, `--cratis-orange-500`, `--cratis-red-500` |
| Geometry | `--cratis-border-radius` |
| Effects | `--cratis-focus-ring`, `--cratis-maskbg` |

Tokens default to PrimeReact's matching theme variables, so Path A and Path B
mix cleanly — load a PrimeReact theme to get a baseline, then override the
specific tokens you want to change.

**Choose Path B when:** you want a custom look, you're shipping multiple
themes (light/dark/brand variants), or you don't want a PrimeReact theme in
your bundle.

---

### Path C — Fully unstyled (you own every visual)

Turn off every PrimeReact base style at the provider and supply visuals
through PrimeReact's `pt` (pass-through) mechanism, your own CSS, or both.
Components render structurally only and become a blank canvas.

```tsx
import '@cratis/components/styles';   // tokens + Tailwind utilities still useful for spacing/layout
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
        root: { className: 'inline-flex items-center px-4 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-400 disabled:opacity-50' },
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

**Choose Path C when:** you have a design system to honor, you're matching a
brand kit, or you want zero PrimeReact CSS in the final bundle.

---

### Mixing paths

The paths compose, so you don't have to pick one for the whole app:

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
- **Dark mode** — use Path B tokens scoped to `.dark` and toggle the class on
  the root element. Every internal component (including those used in Path C)
  follows automatically because they all read from the same tokens.

### Per-component `pt` cheat sheet

Three patterns, depending on how much PrimeReact a wrapper composes:

1. **Single-widget wrappers** — `Dialog`, every `CommandForm` field, the
   underlying `DataTable`/`Paginator` exposed by `DataTableForQuery` /
   `DataTableForObservableQuery`, and `Dropdown` forward `pt`, `ptOptions`,
   `unstyled`, and `className` straight to their inner PrimeReact component.
2. **Multi-slot composites** — `StepperCommandDialog` (`pt` for Stepper,
   `dialogPt` for Dialog), `DataPage` (`tablePt` for DataTable, `menubarPt`
   for Menubar) — each slot has `*PtOptions`, `*Unstyled`, and `*ClassName`
   siblings.
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