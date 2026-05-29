# Combining styling setups

The three styling options compose. You don't have to choose one for the whole app — every Cratis wrapper still exposes the same building blocks, so you can combine them per-component or per-region.

## Themed app with one unstyled island

Keep the PrimeReact theme as your global baseline and opt one specific component out with the per-instance `unstyled` prop:

```tsx
import 'primereact/resources/themes/lara-dark-blue/theme.css';
import '@cratis/components/styles';
import { CratisComponentsProvider, Dialog } from '@cratis/components';

const brandDialogPt = {
    root:    { className: 'rounded-3xl bg-violet-900 text-violet-50' },
    header:  { className: 'px-6 py-4 border-b border-violet-700 font-semibold' },
    content: { className: 'p-6' },
};

export const App = () => (
    <CratisComponentsProvider>
        <YourApp />

        {/* This one Dialog opts out of the theme and uses its own brand visuals. */}
        <Dialog title="Brand callout" unstyled pt={brandDialogPt}>
            …
        </Dialog>
    </CratisComponentsProvider>
);
```

## Unstyled app with one themed island

Run the app fully unstyled and restore PrimeReact's defaults inside a single subtree by nesting a second `CratisComponentsProvider`:

```tsx
import 'primereact/resources/themes/lara-dark-blue/theme.css';
import '@cratis/components/styles';
import { CratisComponentsProvider } from '@cratis/components';
import { globalPt } from './pt-preset';

export const App = () => (
    <CratisComponentsProvider value={{ unstyled: true, pt: globalPt }}>
        <YourApp />

        {/* Inside this subtree, components use PrimeReact's theme defaults. */}
        <CratisComponentsProvider value={{ unstyled: false }}>
            <PrimeReactThemedSubtree />
        </CratisComponentsProvider>
    </CratisComponentsProvider>
);
```

## App-wide dark mode

Put each palette behind a class on the root element and toggle the class with your theme switcher. PrimeReact widgets and Cratis surfaces both follow because the `--cratis-*` tokens cascade from PrimeReact variables by default:

```css
:root.theme-light {
    --surface-card: #ffffff;
    --surface-border: #e2e8f0;
    --text-color:   #0f172a;
    --primary-color: #2563eb;
}

:root.theme-dark {
    --surface-card: #1e293b;
    --surface-border: #334155;
    --text-color:   #f8fafc;
    --primary-color: #38bdf8;
}
```

```tsx
const ThemeToggle = () => {
    const toggle = () => {
        const root = document.documentElement;
        root.classList.toggle('theme-dark');
        root.classList.toggle('theme-light');
    };
    return <button onClick={toggle}>Toggle theme</button>;
};
```

Combine with `prefers-color-scheme` for the initial mode:

```css
@media (prefers-color-scheme: dark) {
    :root:not(.theme-light):not(.theme-dark) {
        --surface-card: #1e293b;
        --text-color: #f8fafc;
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

If you want PrimeReact widgets in the region to follow too, override the PrimeReact variables in the same scope:

```css
.brand-zone {
    --surface-card:  #1f1147;
    --text-color:    #ede9fe;
    --primary-color: #a78bfa;
    /* …and the --cratis-* siblings above */
}
```

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
- **Cratis tokens are scoped**: overriding a `--cratis-*` token only changes Cratis surfaces. To repaint PrimeReact widgets too, override the PrimeReact variable. See [Cratis token reference](cratis-tokens.md).

## See also

- [Use a PrimeReact theme](themed.md)
- [Use a custom palette on top of a PrimeReact theme](custom-palette.md)
- [Use fully unstyled mode](unstyled.md)
- [Pass-through cheat sheet](pass-through.md)
- [CratisComponentsProvider](../Common/cratis-components-provider.md)
