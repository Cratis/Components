# Combining styling setups

The three styling options compose. You don't have to choose one for the whole app — every Cratis wrapper still exposes the same building blocks, so you can combine them per-component or per-region.

## Themed app with one unstyled island

Keep a styled `@primeuix/themes` preset as your global baseline and opt one specific component out with the per-instance `unstyled` prop:

```tsx
import '@cratis/components/tokens';
import '@cratis/components/styles';
import Aura from '@primeuix/themes/aura';
import { CratisComponentsProvider } from '@cratis/components';
import { Dialog } from '@cratis/components/Dialogs';

const brandDialogPt = {
    root:    { className: 'rounded-3xl bg-violet-900 text-violet-50' },
    header:  { className: 'px-6 py-4 border-b border-violet-700 font-semibold' },
    content: { className: 'p-6' },
};

export const App = () => (
    <CratisComponentsProvider value={{ theme: { preset: Aura }, license: 'YOUR-PRIMEUI-KEY' }}>
        <YourApp />

        {/* This one Dialog opts out of the preset and uses its own brand visuals. */}
        <Dialog title="Brand callout" unstyled pt={brandDialogPt}>
            …
        </Dialog>
    </CratisComponentsProvider>
);
```

## Unstyled app with one themed island

Run the app fully unstyled and give a single subtree the Cratis baseline look. The baseline theme's rules are scoped under `.cratis-theme`, so wrapping one element in the class themes just that subtree:

```tsx
import '@cratis/components/tokens';
import '@cratis/components/styles';
import '@cratis/components/theme';
import { CratisComponentsProvider } from '@cratis/components';
import { globalPt } from './pt-preset';

export const App = () => (
    <CratisComponentsProvider value={{ unstyled: true, pt: globalPt }}>
        <YourApp />

        {/* Inside this subtree, components pick up the Cratis baseline theme. */}
        <div className="cratis-theme">
            <BaselineThemedSubtree />
        </div>
    </CratisComponentsProvider>
);
```

## App-wide dark mode

With the Cratis baseline theme, dark mode is a single class: add `cratis-dark` alongside `cratis-theme` for the dark palette, remove it for light. The widgets and Cratis-scoped surfaces both follow because the baseline theme drives everything from the `--cratis-*` tokens:

```tsx
const ThemeToggle = () => {
    const toggle = () => document.body.classList.toggle('cratis-dark');
    return <button onClick={toggle}>Toggle theme</button>;
};
```

Need more than two palettes, or your own colors? Override the `--cratis-*` tokens under scoped classes instead:

```css
.cratis-theme.theme-light {
    --cratis-surface-card:   #ffffff;
    --cratis-surface-border: #e2e8f0;
    --cratis-text-color:     #0f172a;
    --cratis-primary-color:  #2563eb;
}

.cratis-theme.theme-dark {
    --cratis-surface-card:   #1e293b;
    --cratis-surface-border: #334155;
    --cratis-text-color:     #f8fafc;
    --cratis-primary-color:  #38bdf8;
}
```

Combine with `prefers-color-scheme` for the initial mode:

```css
@media (prefers-color-scheme: dark) {
    .cratis-theme:not(.theme-light):not(.theme-dark) {
        --cratis-surface-card: #1e293b;
        --cratis-text-color:   #f8fafc;
    }
}
```

## Per-region brand zones

Token overrides cascade, so any ancestor scope works for tinting Cratis-scoped surfaces in a region:

```css
.brand-zone {
    --cratis-surface-border: #c4b5fd;
    --cratis-text-color-secondary: #a78bfa;
    --cratis-primary-color: #7c3aed;
}
```

```tsx
<div className="brand-zone">
    <ObjectNavigationalBar navigationPath={path} onNavigate={…} />
    <ObjectContentEditor object={data} schema={schema} />
</div>
```

With the baseline theme these `--cratis-*` overrides already reach the widgets in the region — the theme reads the same tokens. (On a `@primeuix/themes` preset, region-scoped widget colors come from `definePreset` instead; the `--cratis-*` overrides still retint the Cratis-scoped surfaces.)

## Per-component visual override inside unstyled mode

When you're using fully unstyled mode globally, single components can still pull in classes from a separate stylesheet via the `className` prop or per-instance `pt`:

```tsx
import './custom-table.css';

<CratisComponentsProvider value={{ unstyled: true, pt: globalPt }}>
    {/* All other DataTables use globalPt; this one uses a bespoke look. */}
    <DataTableForQuery
        query={AllAuthors}
        emptyMessage="No authors"
        className="custom-table"
        pt={{ table: { className: 'custom-table__inner' } }}
    >
        …
    </DataTableForQuery>
</CratisComponentsProvider>
```

## What to keep in mind

- **Provider value updates re-render**: changing `value` on `CratisComponentsProvider` rebuilds the merged config. Use a stable reference (e.g. `useMemo` or a module-level constant) to avoid spurious re-renders.
- **`pt` merging is deep**: PrimeReact merges global `pt` with per-instance `pt` by default. Set `ptOptions={{ mergeSections: false }}` on the wrapper if you need a hard replace.
- **Where `--cratis-*` reaches depends on the theme**: with the Cratis baseline theme the widgets read those tokens, so an override repaints both. On a `@primeuix/themes` preset the widgets read `--p-*` design tokens, so `--cratis-*` overrides only retint the Cratis-scoped surfaces — repaint the widgets with `definePreset`. See [Cratis token reference](cratis-tokens.md).

## See also

- [Use a PrimeReact theme](themed.md)
- [Use a custom palette on top of a PrimeReact theme](custom-palette.md)
- [Use fully unstyled mode](unstyled.md)
- [Pass-through cheat sheet](pass-through.md)
- [CratisComponentsProvider](../Common/cratis-components-provider.md)
