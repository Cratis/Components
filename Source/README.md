# @cratis/components

React components for CQRS and event-sourced applications built with
[Cratis Arc](https://github.com/Cratis/Arc) — command dialogs, typed forms,
query-backed data tables, and higher-order application surfaces.

The package provides React components for Arc commands, queries, dialogs,
forms, and application surfaces. Components owns its public markup, TypeScript
contracts, stable parts, and design tokens. React Aria supplies selected
interaction primitives internally; consumers do not import or style React Aria.

- [Canonical Components documentation](https://cratis.io/components/)
- [Renderer adapters and coexistence](https://github.com/Cratis/Components/tree/main/Documentation/renderers)
- [Migration guide](./MIGRATION.md)
- [Private security reporting](mailto:oss@cratis.io?subject=Security%3A)

## Install

```bash
npm install @cratis/components
```

The current package manifest declares these peer dependencies:

- `@cratis/arc` and `@cratis/arc.react` `>=20.3.1 <23`
- `@cratis/fundamentals` `^7.10.3`
- optional `pixi.js` `^8.20.0`
- `react` and `react-dom` `^19.0.0`
- `reflect-metadata` `0.2.2`
- `tsyringe` `4.10.0`

Strict installers can declare them explicitly; keep both Arc packages on the same application version:

```bash
ARC_VERSION=22.4.0
npm install @cratis/components \
  "@cratis/arc@$ARC_VERSION" "@cratis/arc.react@$ARC_VERSION" \
  @cratis/fundamentals@^7.10.3 react@^19 react-dom@^19 \
  reflect-metadata@0.2.2 tsyringe@4.10.0
```

The current manifest does not declare PrimeReact, PrimeIcons, or PrimeUI packages as dependencies or peers. Applications retaining direct dependencies keep their own package, provider, styling, and license boundaries.

**Yarn PnP note:** the current `@cratis/arc.react@22.3.0` package imports `rxjs` without declaring it. Strict PnP consumers install `rxjs@7.8.2` and add a temporary `packageExtensions` entry for `@cratis/arc.react@22.3.0`; remove it when Arc publishes corrected metadata. The canonical [getting-started guide](https://cratis.io/components/getting-started/) contains the exact YAML.

`pixi.js@^8.20.0` is an additional **optional** peer, required only by `Canvas` and `PivotViewer` (the Spatial capability profile — see [Import from explicit subpaths](#import-from-explicit-subpaths) below). Every other subpath needs nothing beyond the peers above:

```bash
npm install pixi.js@^8.20.0
```

Keep exactly one compatible Pixi resolution across the application and Components; two installed copies produce nominal TypeScript incompatibilities for `PIXI.Container` and pointer-event types even when both satisfy `^8.20.0`. The capability-subpath table below identifies the current Pixi-dependent surfaces.

## Styles

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles';
import '@cratis/components/theme'; // optional baseline appearance
```

`tokens` supplies conservative light defaults. `styles` contains structural rules and internal utilities in low-priority Cratis cascade layers, with no Tailwind Preflight/reset or token duplication. `theme` adds automatic/explicit dark mode, forced colors, and themed subtrees.

A custom product design omits `theme`, imports product CSS after `tokens` and `styles`, and maps its canonical values directly to `--cratis-*`.

## Provider

```tsx
import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider value={{ locale: 'en-US' }} toaster>
        <Application />
    </CratisComponentsProvider>
);
```

The provider owns locale, Components-specific labels, optional renderer selection, and the toast
region. The default renderer needs no additional package. Certified renderer packages implement the
stable, nine-slot `stable-presentation/v1` primitive profile; they never replace the full Components
catalog. They are independently versioned and selected with the provider's `library` prop:

- `@cratis/components.mui` — MUI 9.x / Emotion 11.x stable presentation slots;
- `@cratis/components.primereact` — PrimeReact 11.x stable presentation slots, with an
  application-owned outer provider and license key;
- `@cratis/components.primereact10` — PrimeReact 10.9.9+ stable presentation slots, with its
  separate MIT-era provider, global theme, and upstream-major boundary.

Adapter-specific themes, providers, SSR setup, peers, and license boundaries remain documented by
the adapter package. Styling for the built-in renderer is CSS-owned. The canonical renderer guide
bounds primitive adaptation, direct vendor coexistence, custom composition, unsupported claims, and
license/key ownership.

```tsx
<CratisComponentsProvider
    value={{
        locale: 'nb-NO',
        messages: {
            paginator: {
                navigation: 'Sidenavigasjon',
                first: 'Første side',
                previous: 'Forrige side',
                next: 'Neste side',
                last: 'Siste side',
            },
            datePicker: {
                today: 'I dag',
                clear: 'Tøm',
                openCalendar: 'Åpne kalender',
                previousMonth: 'Forrige måned',
                nextMonth: 'Neste måned',
            },
        },
    }}
>
    <Application />
</CratisComponentsProvider>
```

## Command forms

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { InputTextField } from '@cratis/components/CommandForm';
import { RegisterAuthor } from './RegisterAuthor';

export const RegisterAuthorDialog = () => (
    <CommandDialog<RegisterAuthor>
        command={RegisterAuthor}
        title='Register author'
        okLabel='Register'
    >
        <InputTextField<RegisterAuthor> value={(command) => command.name} title='Name' />
    </CommandDialog>
);
```

Fields bind directly to generated command properties and surface server validation through the Arc command-form context.

## Query-backed tables

```tsx
import { Column, DataTableForObservableQuery } from '@cratis/components/DataTables';
import { ObserveAuthors } from './ObserveAuthors';

<DataTableForObservableQuery
    query={ObserveAuthors}
    dataKey='id'
    emptyMessage='No authors'
>
    <Column field='name' header='Name' sortable filter />
    <Column field='email' header='Email' filter />
</DataTableForObservableQuery>;
```

Arc owns server paging. Client filters apply only to the loaded page; complete-result filtering belongs in query arguments and runs on the server before paging.

## Notifications

```tsx
import { Toaster, toast } from '@cratis/components/Notifications';

<Toaster position='top-right' />;

toast.success({
    title: 'Saved',
    description: 'Your changes were saved.',
});
```

The queue, promise lifecycle, timers, dispatch substitution, toast frame, and region are Components-owned implementation surfaces.

## Custom styling

Documented customizable component parts use stable `data-cratis-part` names. Components with per-instance customization expose a typed `pt` object containing ordinary HTML attributes for their documented parts.

```tsx
import { Dialog } from '@cratis/components/Dialogs';

<Dialog
    title='Edit account'
    pt={{
        backdrop: { className: 'product-dialog-backdrop' },
        root: { className: 'product-dialog' },
        content: { className: 'product-dialog-content' },
    }}
>
    Content
</Dialog>;
```

```css
:root {
    --cratis-primary-color: var(--product-accent);
    --cratis-action-background: var(--product-action);
    --cratis-action-background-hover: var(--product-action-hover);
    --cratis-action-background-active: var(--product-action-active);
    --cratis-action-text: var(--product-on-action);
    --cratis-surface-card: var(--product-surface);
    --cratis-surface-overlay: var(--product-surface-raised);
    --cratis-surface-border: var(--product-border);
    --cratis-control-background: var(--product-control);
    --cratis-control-border: var(--product-control-border);
    --cratis-text-color: var(--product-text);
    --cratis-focus-ring: var(--product-focus-ring);
}

.product-dialog[data-cratis-part='root'] {
    border-radius: 1rem;
}
```

Do not target React Aria classes or internal DOM structure.

## Import from explicit subpaths

The canonical rule: **the package root is setup-only; every component ships from its own subpath.** Import `CratisComponentsProvider`, `useCratisComponentsConfig`, `cratisDefaults`, and `mergeCratisComponentsConfig` from the root; import every component from the subpath in its capability profile:

| Subpath                                    | Capability profile                |
| ------------------------------------------ | --------------------------------- |
| `@cratis/components/Canvas`                | Spatial (optional `pixi.js` peer) |
| `@cratis/components/Chat`                  | Foundation                        |
| `@cratis/components/CommandDialog`         | Foundation                        |
| `@cratis/components/CommandStepper`        | Foundation                        |
| `@cratis/components/CommandForm`           | Foundation                        |
| `@cratis/components/CommandForm/fields`    | Foundation                        |
| `@cratis/components/Common`                | Foundation                        |
| `@cratis/components/DataPage`              | Foundation                        |
| `@cratis/components/DataTables`            | Foundation                        |
| `@cratis/components/Dialogs`               | Foundation                        |
| `@cratis/components/Display`               | Foundation                        |
| `@cratis/components/Dropdown`              | Foundation                        |
| `@cratis/components/Filter`                | Foundation                        |
| `@cratis/components/Notifications`         | Foundation                        |
| `@cratis/components/ObjectContentEditor`   | Advanced React                    |
| `@cratis/components/ObjectNavigationalBar` | Advanced React                    |
| `@cratis/components/PivotViewer`           | Spatial (optional `pixi.js` peer) |
| `@cratis/components/SchemaEditor`          | Advanced React                    |
| `@cratis/components/TimeMachine`           | Advanced React                    |
| `@cratis/components/Toolbar`               | Advanced React                    |
| `@cratis/components/types`                 | Foundation                        |

Foundation, Advanced React, and Spatial describe dependency and usage
boundaries, not stability, maturity, accessibility, support, or quality tiers.
`Spatial` identifies the subpaths that require the optional Pixi peer.

Components 4 removes component-family namespaces from the root. The root is
setup-only so importing the provider does not traverse optional or unrelated
component graphs. [MIGRATION.md](./MIGRATION.md) contains the current
namespace-to-subpath mapping and migration command for existing root imports.

## Components 3 migration

The current package manifest does not declare PrimeReact as a required runtime
or peer. Follow the [Components 3 to 4 migration guide](./MIGRATION.md)
for dependency removal, provider changes, product token mapping, stable part
names, DatePicker changes, table behavior, notifications, direct Prime import
replacements, the exact-version `@cratis/components-codemods` command, and the
`@cratis/eslint-plugin-components` guard.

The old `@cratis/components/styled`, `styledMode`, `CratisPreset`, and `primeReactStyles` renderer exports are removed. Move styling to tokens and stable parts before upgrading.

## License

The package metadata declares MIT for `@cratis/components`. Dependencies and
bundled assets retain their own terms. Review the packaged `LICENSE`,
`THIRD_PARTY_NOTICES.md`, and included font-license files for the exact package
version you use.
