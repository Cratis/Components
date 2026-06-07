# Migration guide — upgrading from earlier `@cratis/components`

This release is the first to document the supported styling setups described in the [Styling section](Styling/index.md): use a PrimeReact theme, keep the theme structure but apply your own palette, or run fully unstyled with a `pt` preset. It is also the first release to ship `CratisComponentsProvider`, the `--cratis-*` token layer, and full `pt` / `unstyled` forwarding on every wrapper. The dominant breaking signal is that PrimeReact and friends move from runtime `dependencies` to `peerDependencies`.

This page tells you what to change in your app, what to be aware of visually, and what new capabilities you can opt in to once the upgrade lands.

## Quick checklist

If you do these three things, your app will install and render correctly after the upgrade:

1. **Add `primereact` and `primeicons` to your own `package.json`**:

   ```bash
   npm install primereact primeicons
   # or
   yarn add primereact primeicons
   ```

2. **If you use the optional components, add their peer too**:

   | Component | Optional peer |
   |---|---|
   | `PivotViewer` | `pixi.js` (canvas) and `framer-motion` (animated panels) |
   | `DataPage` resizable layout | `allotment` |

3. **Skim the [Visual changes](#visual-changes) section below** to spot anywhere the new rendering would surprise you.

Everything else in this release is additive — your existing component calls continue to work without code changes.

## Breaking changes

### 1. `primereact` and `primeicons` are now peer dependencies

In earlier releases these were direct `dependencies` of `@cratis/components`, so `npm install @cratis/components` was enough to pull them in transitively.

In this release they are `peerDependencies`. You must declare them in your own `package.json`. If you don't, the install will emit a peer-dependency warning and the bundler will fail to resolve `primereact/dialog`, `primereact/button`, etc. at build time.

This change avoids the duplicate-installation pitfall: consumers who already had `primereact` in their app were previously ending up with two copies — their own plus the one inside `@cratis/components` — and PrimeReact's React context fragmented across them, so `unstyled` / `pt` on one provider didn't reach widgets rendered through the other.

```jsonc
// your-app/package.json
{
  "dependencies": {
    "@cratis/components": "^X.Y.Z",
    "primereact":         "^10.9.0",
    "primeicons":         "^7.0.0"
    // …
  }
}
```

The `@cratis/arc*` packages, `@cratis/fundamentals`, `react`, and `react-dom` are also peer dependencies, but you almost certainly already have them (`@cratis/fundamentals` comes in transitively with `@cratis/arc`).

### 2. The optional dependencies are now optional peer dependencies

`pixi.js`, `framer-motion`, and `allotment` moved to peer dependencies with `peerDependenciesMeta.optional = true`. They were previously bundled as direct dependencies of `@cratis/components`, which meant **every** consumer downloaded ~5 MB of WebGL canvas code (`pixi.js`) even if they never used `PivotViewer`.

| You use… | …so add to your install |
|---|---|
| `PivotViewer` | `pixi.js` and `framer-motion` |
| `DataPage` with resizable layout | `allotment` |

If you don't use these components, you don't need to do anything — provided your bundler tree-shakes. `PivotViewer` and `DataPage` are re-exported from the package root (`@cratis/components`) and statically import their optional peers, so a modern bundler (Vite, Rollup, esbuild, webpack 5) drops them when unused — the package marks its JS side-effect-free apart from CSS. If you import from the root with a bundler that does **not** tree-shake, install the optional peers too, or import the components you use from their subpaths (`@cratis/components/Dialogs`, `@cratis/components/CommandForm`, …) so the heavy components are never pulled into the graph.

### 3. `react-router-dom` and `usehooks-ts` are no longer dependencies

Both were listed as runtime dependencies but never imported by anything inside `@cratis/components`, so they have been dropped. If your app uses `react-router-dom` directly (very likely), you should already have it in your own `package.json` — nothing changes for you.

If you were somehow relying on the transitive copy of either, add it to your own deps:

```bash
yarn add react-router-dom
```

### 4. `@cratis/arc.vite` is no longer a peer dependency

It was only ever used by the package's own dev `vite.config.ts`, so it moved to `devDependencies`. If you previously installed it solely to satisfy the peer requirement, you can drop it — nothing in the shipped library imports it.

## Visual changes

The styling work removes a few couplings to PrimeReact theme internals. These changes are intentional and almost always invisible, but there are a handful of places where rendering may shift.

### `FormElement` addon is now Cratis-bespoke

Earlier releases rendered the icon addon using PrimeReact's `p-inputgroup` / `p-inputgroup-addon` classes, so the addon picked up PrimeReact's theme-driven background and border.

This release renders the addon with structural CSS using the [`--cratis-*` tokens](Styling/cratis-tokens.md):

```text
.cratis-form-element            // row
.cratis-form-element__addon     // leading icon slot
```

The shape and intent are identical. The exact background, border, and radius now come from `--cratis-surface-100`, `--cratis-surface-border`, and `--cratis-border-radius` rather than from the loaded PrimeReact theme. When you [use a PrimeReact theme](Styling/themed.md) or [apply a custom palette on top of one](Styling/custom-palette.md), the values still cascade from the PrimeReact theme by default, so the visual is essentially the same. In [fully unstyled mode](Styling/unstyled.md) the addon **still renders** instead of disappearing — a strict improvement.

If you were relying on the exact PrimeReact `p-inputgroup-addon` look, the [FormElement reference](Common/form-element.md#styling) shows how to override the tokens or attach your own class via `pt` to restore it.

### `ObjectNavigationalBar` and `SchemaEditor` bottom border now actually renders

Earlier releases used `border-bottom-1 surface-border` — utility class names from **PrimeFlex**, a separate PrimeReact package that this library never depended on. If your app didn't already have PrimeFlex loaded, the classes were silent no-ops and the breadcrumb bar / schema editor toolbar had no visible bottom border.

This release uses structural CSS that reads from `--cratis-surface-border`, so the border actually appears regardless of whether PrimeFlex is installed.

If your app *did* have PrimeFlex installed, the border was already visible and looks essentially the same after upgrade. If your app *didn't* have PrimeFlex installed, you'll see a new horizontal line under the breadcrumbs and the schema editor menubar where there wasn't one before.

This is arguably a bug fix — the original code was always meant to draw the border — but if you preferred the borderless look, override the token to `transparent`:

```css
:root {
    /* Just for the navigational surfaces — PrimeReact's --surface-border stays untouched. */
    --cratis-surface-border: transparent;
}
```

### `RadioGroupField` vertical layout now stacks correctly

`RadioGroupField` defaults to `layout="vertical"`, which is meant to stack the options in a column. Earlier releases expressed that with `flex-column` / `align-items-center` — again **PrimeFlex** class names the library never shipped — so the classes no-op'd and the options laid out in a **row** instead. The horizontal layout used valid Tailwind classes and worked correctly.

This release uses the library's own Tailwind utilities (`flex-col` / `items-center`), so a default (vertical) `RadioGroupField` now renders as a true vertical stack, and the control/label of every `CheckboxField`, `RadioButtonField`, and `RadioGroupField` option is vertically centered.

This is a bug fix — vertical was always the intended default — but if you had compensated for the broken row layout (for example by setting `layout="vertical"` and relying on the row rendering, or by adding your own wrapping styles), revisit those call sites after upgrading. To keep the old row layout, set `layout="horizontal"` explicitly.

### Other PrimeReact class hooks removed

The library no longer uses these hard-coded PrimeReact class names internally:

| Old class hook | Replacement |
|---|---|
| `p-button-text p-button-sm` | PrimeReact `Button` props: `text` and `size="small"`. |
| `p-button-text p-button-danger p-button-sm` | PrimeReact `Button` props: `text`, `severity="danger"`, `size="small"`. |
| `<small className="p-error">` | Inline `<small>` styled with `--cratis-red-500`. |
| `border-bottom-1 surface-border` | See [section above](#objectnavigationalbar-and-schemaeditor-bottom-border-now-actually-renders). |
| `p-inputgroup` / `p-inputgroup-addon` | See [section above](#formelement-addon-is-now-cratis-bespoke). |

When a PrimeReact theme is loaded, the Button `text` / `size` / `severity` props produce the same styling as the old class hooks — there's no visible change.

## Subpath import changes

### `@cratis/components/CommandStepper` now resolves

Earlier releases declared a `./CommandStepper` subpath in the exports map, but it pointed at `dist/{esm,cjs}/CommandStepper/index.js`, which did not exist. The file lives at `dist/{esm,cjs}/CommandDialog/CommandStepper.js` because the source resides in `CommandDialog/`.

Any consumer who tried `import { CommandStepper } from '@cratis/components/CommandStepper'` would have hit a module-resolution error. After this release, that import works.

### `@cratis/components/EventModeling` was never real — it's now removed from the docs

Earlier README listed `@cratis/components/EventModeling` in the available subpath exports. The path did not exist in the package's `exports` map and never did. If you tried to import from it, the import always failed. The README has been corrected.

### `@cratis/components/CommandForm/fields` now resolves under CommonJS

This subpath's CJS target was never emitted by the build, so `require('@cratis/components/CommandForm/fields')` failed (ESM `import` worked). Because the subpath is equivalent to `@cratis/components/CommandForm` — which already re-exports every field — its `exports` entry now points at that same barrel, so both `import` and `require` resolve. Existing imports from either path keep working unchanged.

### New subpath exports

Three component-folder subpaths that already had built indexes but were missing from the `exports` map have been added:

```ts
import { ObjectContentEditor } from '@cratis/components/ObjectContentEditor';
import { ObjectNavigationalBar } from '@cratis/components/ObjectNavigationalBar';
import { SchemaEditor } from '@cratis/components/SchemaEditor';
```

A new stylesheet subpath is also available — useful if you bring your own Tailwind setup and only want the `--cratis-*` token layer:

```ts
import '@cratis/components/tokens';
```

The recommended `@cratis/components/styles` (Tailwind utilities + tokens) continues to work and is unchanged.

## Recommended migrations

These are optional. Nothing in your app breaks if you skip them — but adopting them will make your code more idiomatic and unlock the new customization surface.

### 1. Wrap your app in `CratisComponentsProvider`

If you previously mounted `PrimeReactProvider` from `primereact/api` directly, you can keep doing that — every Cratis wrapper still reads the same context. The Cratis provider adds nothing today but reserves a single place for Cratis-wide defaults later.

```tsx
// Before — still works
import { PrimeReactProvider } from 'primereact/api';

export const App = () => (
    <PrimeReactProvider value={{ /* … */ }}>
        <YourApp />
    </PrimeReactProvider>
);
```

```tsx
// After — recommended
import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider value={{ /* same APIOptions */ }}>
        <YourApp />
    </CratisComponentsProvider>
);
```

See [CratisComponentsProvider](Common/cratis-components-provider.md) for the full prop reference.

### 2. Switch styling overrides to `--cratis-*` tokens where possible

If you previously sprinkled CSS overrides across components (`.p-button { … }`, ad-hoc class names, etc.) to customize Cratis-specific surfaces — validation error color, the FormElement addon, breadcrumb borders — you can now consolidate those into a single `--cratis-*` override block:

```css
/* Before — multiple ad-hoc rules */
.p-error { color: #f97316; }
.my-form-addon { background: #1e293b; border-color: #334155; }
.my-breadcrumb-bar { border-bottom: 1px solid #334155; }
```

```css
/* After — three token overrides */
:root {
    --cratis-red-500:        #f97316;  /* drives p-error replacement automatically */
    --cratis-surface-100:    #1e293b;  /* FormElement addon background */
    --cratis-surface-border: #334155;  /* FormElement addon border, NavigationalBar border */
}
```

See [Cratis token reference](Styling/cratis-tokens.md) for the per-token surface mapping.

### 3. Replace per-component className overrides with `pt`

Many wrappers now forward PrimeReact's `pt` (pass-through) prop, which lets you attach class names to individual slots inside a widget. For one-off styling, `pt` is more targeted and less likely to collide with future PrimeReact theme updates than overriding `.p-button` globally:

```tsx
// Before — class collision risk; affects all Buttons in the subtree
<style>{`.confirm-section .p-button { background: #f97316; }`}</style>
<div className="confirm-section">
    <Dialog title="Confirm">…</Dialog>
</div>
```

```tsx
// After — scoped to this one Dialog, targets a single slot
<Dialog
    title="Confirm"
    pt={{
        header: { className: 'bg-orange-500' },
        content: { className: 'p-6' },
    }}
>
    …
</Dialog>
```

See [Pass-through cheat sheet](Styling/pass-through.md) for every wrapper's available slots and the per-component patterns (single-widget vs. multi-slot composite vs. large composite).

### 4. Adopt subpath imports for tree-shaking

If you only use a few components, prefer subpath imports so unused parts of the package tree-shake out:

```ts
// Before — the package root re-exports every component as a namespace,
// so importing from it pulls the whole package into your bundle
import { Dialogs, DataPage, CommandForm } from '@cratis/components';

// used as Dialogs.Dialog, DataPage.DataPage, CommandForm.InputTextField
```

```ts
// After — per-component subpaths let the bundler drop everything you don't use
import { Dialog } from '@cratis/components/Dialogs';
import { DataPage } from '@cratis/components/DataPage';
import { InputTextField } from '@cratis/components/CommandForm';
```

The root import is convenient when you use most of the package, but it defeats tree-shaking — reach for the subpaths in code that pulls in only a handful of components.

## New optional capabilities

These are additions, not migrations — nothing in your code needs to change to use them. They become available once you upgrade.

### Per-component `pt` / `ptOptions` / `unstyled` / `className`

Every Cratis wrapper now forwards PrimeReact's pass-through and unstyled props to the underlying widget. Pass them per-instance to restyle one component, or set a global preset on `CratisComponentsProvider` to apply across the whole app:

```tsx
<CratisComponentsProvider value={{ unstyled: true, pt: globalPt }}>
    <YourApp />
</CratisComponentsProvider>
```

The [Pass-through cheat sheet](Styling/pass-through.md) lists each wrapper's slot surface.

### Per-slot props on composites

Wrappers that compose more than one PrimeReact widget expose explicit per-slot props so you can target each slot independently:

| Composite | Per-slot props |
|---|---|
| `StepperCommandDialog` | `pt` / `unstyled` (Stepper) + `dialogPt` / `dialogPtOptions` / `dialogUnstyled` / `dialogClassName` (Dialog). |
| `DataPage` | `tablePt` / `tablePtOptions` / `tableUnstyled` / `tableClassName` + `menubarPt` / `menubarPtOptions` / `menubarUnstyled` / `menubarClassName`. |
| `DataTableForQuery` / `DataTableForObservableQuery` | `pt` / `unstyled` / `className` (DataTable) + `paginatorPt` / `paginatorPtOptions` / `paginatorUnstyled` (Paginator). |

### `className` on composite editors

`ObjectContentEditor`, `ObjectNavigationalBar`, and `SchemaEditor` now accept a `className` prop on the root for layout / positioning. Internal widget restyling continues to go through the global `pt` preset on `CratisComponentsProvider`.

### `--cratis-*` token layer

A scoped Cratis token layer is now part of every install. Each token resolves the PrimeReact v11 design token (`@primeuix/themes`) first and falls back to the matching v10 theme variable, so theme-based setups continue to look the way they always did on either PrimeReact major. Override `--cratis-*` only when you want a Cratis-scoped surface tinted independently of the surrounding PrimeReact widgets — see [Cratis token reference](Styling/cratis-tokens.md).

### PrimeReact 10 and 11 — one build, both majors

The `--cratis-*` token layer is version-spanning by design. Every token is declared as `var(--p-<v11-token>, var(--<v10-variable>))`, so:

- On **PrimeReact 10**, the `--p-*` design tokens are undefined and the legacy `--surface-*` / `--primary-*` / `--text-color` values win.
- On **PrimeReact 11**, the `@primeuix/themes` `--p-*` tokens resolve and win.

The same build of `@cratis/components` is therefore themed correctly on both majors, and a PrimeReact 10 → 11 upgrade in your app needs **no change** to how Cratis components pick up your theme. PrimeReact 11 is not a rename of 10 — it uses a different token vocabulary — so where v11 has no direct equivalent for a v10 concept (`surface-ground` / `surface-section` / `surface-overlay`, the composite `focus-ring`), the closest durable v11 semantic token is used; the inline notes in `tokens.css` record each mapping.

> **Scope:** this makes the **theming** surface forward-compatible — the most pervasive part of a PrimeReact upgrade. It does **not** make the library fully PrimeReact 11-compatible: v11 also changes component prop APIs and `pt` slot names, so per-slot `pt` presets will need revisiting when the `primereact` peer range is widened to allow v11. That work is tracked separately; the `primereact` peer is still `^10.9.0` today.

### Storybook styling toolbar

`yarn dev` from `Source/` opens Storybook with a five-mode **Styling** toolbar (paintbrush icon) that demonstrates the supported styling setups — useful for previewing how each one looks before committing to it in your app.

## Migration recipes — before / after

A handful of common patterns shown as before/after diffs.

### Set up styling once at the root

```tsx
// Before
import 'primereact/resources/themes/lara-dark-blue/theme.css';
import 'primeicons/primeicons.css';
import '@cratis/components/styles';
import { PrimeReactProvider } from 'primereact/api';

export const App = () => (
    <PrimeReactProvider value={{ ripple: true }}>
        <YourApp />
    </PrimeReactProvider>
);
```

```tsx
// After
import 'primereact/resources/themes/lara-dark-blue/theme.css';
import 'primeicons/primeicons.css';
import '@cratis/components/styles';
import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider value={{ ripple: true }}>
        <YourApp />
    </CratisComponentsProvider>
);
```

### Restyle one Dialog instance

```tsx
// Before — global CSS rule
// styles.css
// .confirm-dialog .p-dialog-header { background: #1e40af; color: white; }

<Dialog title="Confirm" className="confirm-dialog">…</Dialog>
```

```tsx
// After — per-instance pt
<Dialog
    title="Confirm"
    pt={{ header: { className: 'bg-blue-700 text-white' } }}
>
    …
</Dialog>
```

### Restyle the inner DataTable in DataPage

```tsx
// Before — only the outer wrapper had a className escape hatch
<DataPage title="Authors" query={AllAuthors}>
    <DataPage.MenuItems>…</DataPage.MenuItems>
    <DataPage.Columns>…</DataPage.Columns>
</DataPage>
// Couldn't reach the inner DataTable without forking.
```

```tsx
// After — per-slot pt
<DataPage
    title="Authors"
    query={AllAuthors}
    tablePt={{ table: { className: 'min-w-full divide-y divide-slate-700' } }}
    menubarPt={{ root: { className: 'bg-slate-900' } }}
>
    <DataPage.MenuItems>…</DataPage.MenuItems>
    <DataPage.Columns>…</DataPage.Columns>
</DataPage>
```

### Switch to a fully-unstyled design system

```tsx
// Before — there was no supported setup for this. You either lived with PrimeReact theming
// or wrote a custom PrimeReact theme.

// After — flip the provider into unstyled mode and supply a pt preset.
<CratisComponentsProvider value={{ unstyled: true, pt: globalPt }}>
    <YourApp />
</CratisComponentsProvider>
```

See [Use fully unstyled mode](Styling/unstyled.md) for complete worked examples in both plain CSS and TailwindCSS.

## Troubleshooting

### "Cannot find module 'primereact/dialog'" after upgrade

You haven't added `primereact` to your own `package.json`. Run:

```bash
yarn add primereact primeicons
```

### Peer-dependency warnings on install

Same root cause — the install is telling you which peer is missing. The required peers are `primereact` and `primeicons`; the optional ones (`pixi.js`, `framer-motion`, `allotment`) only matter if you use the corresponding component.

### Sparse / missing visuals after upgrade

You've already loaded a PrimeReact theme (you're not using fully unstyled mode). Most likely one of:

- You're using `FormElement` and the addon now looks slightly different — see [FormElement addon is now Cratis-bespoke](#formelement-addon-is-now-cratis-bespoke).
- You're seeing the bottom border under `ObjectNavigationalBar` or `SchemaEditor`'s menubar where you didn't see it before — see [the section on that](#objectnavigationalbar-and-schemaeditor-bottom-border-now-actually-renders).

If components look fully unstyled (no padding, no borders, no dialog frame), you forgot to load a PrimeReact theme. See [Use a PrimeReact theme](Styling/themed.md).

### "Module not found: '@cratis/components/EventModeling'"

This subpath never existed — the README claimed it did. There's no replacement to migrate to. If you were relying on this import, please open an issue describing what you were importing from it.

### Storybook static build (`yarn build-storybook`) fails

Pre-existing issue in the Storybook + lightningcss + Vite pipeline, not introduced by this release. The dev server (`yarn dev`) is unaffected and is the recommended consumer path.

## See also

- [Styling Overview](Styling/index.md) — the theme, custom-palette, and fully unstyled setup options
- [CratisComponentsProvider](Common/cratis-components-provider.md) — provider configuration
- [Cratis token reference](Styling/cratis-tokens.md) — `--cratis-*` token catalogue
- [Pass-through cheat sheet](Styling/pass-through.md) — per-component `pt` surface
