# @cratis/components

Renderer-independent React components for Cratis Arc commands, queries, dialogs, forms, and application surfaces.

Components owns its public markup, TypeScript contracts, styling parts, and design tokens. React Aria supplies low-level accessible interaction behavior internally; consumers do not import or style React Aria.

## Install

```bash
npm install @cratis/components
```

Supported peers:

- React and React DOM 19
- `@cratis/arc` and `@cratis/arc.react` `>=20.3.1 <23`
- `@cratis/fundamentals`
- `reflect-metadata`
- `tsyringe`

PrimeReact, PrimeIcons, PrimeUI themes, and a PrimeUI license are not required.

`pixi.js@^8.20.0` is an additional **optional** peer, required only by `Canvas` and `PivotViewer` (the Spatial capability profile — see [Import from explicit subpaths](#import-from-explicit-subpaths) below). Every other subpath needs nothing beyond the peers above:

```bash
npm install pixi.js@^8.20.0
```

Keep exactly one compatible Pixi resolution across the application and Components; two installed copies produce nominal TypeScript incompatibilities for `PIXI.Container` and pointer-event types even though both satisfy `^8.20.0`. See the published [UI foundation](https://cratis.io/components/ui-foundation/#optional-pixi-clean-no-pixi-core) explanation for why.

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
import { CratisComponentsProvider } from '@cratis/components/Common';

export const App = () => (
    <CratisComponentsProvider value={{ locale: 'en-US' }} toaster>
        <Application />
    </CratisComponentsProvider>
);
```

The provider owns locale, Components-specific labels, and the optional toast region. Styling is CSS-owned.

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

The queue, promise lifecycle, timers, dispatch substitution, accessible frame, and region are Cratis-owned.

## Custom styling

Every meaningful component element carries a stable `data-cratis-part`. Components with per-instance customization expose a typed `pt` object containing ordinary HTML attributes.

```tsx
<Dialog
    title='Edit account'
    pt={{
        backdrop: { className: 'product-dialog-backdrop' },
        root: { className: 'product-dialog' },
        content: { className: 'product-dialog-content' },
    }}
>
    Content
</Dialog>
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

The canonical rule: **the package root is setup-only; every component ships from its own subpath.** Import `CratisComponentsProvider` (and `cratisDefaults`, `mergeCratisComponentsConfig`) from the root; import every component from the subpath in its capability profile:

| Subpath | Capability profile |
| --- | --- |
| `@cratis/components/Canvas` | Spatial (optional `pixi.js` peer) |
| `@cratis/components/CommandDialog` | Foundation |
| `@cratis/components/CommandStepper` | Foundation |
| `@cratis/components/CommandForm` | Foundation |
| `@cratis/components/CommandForm/fields` | Foundation |
| `@cratis/components/Common` | Foundation |
| `@cratis/components/DataPage` | Foundation |
| `@cratis/components/DataTables` | Foundation |
| `@cratis/components/Dialogs` | Foundation |
| `@cratis/components/Display` | Foundation |
| `@cratis/components/Dropdown` | Foundation |
| `@cratis/components/Filter` | Foundation |
| `@cratis/components/Notifications` | Foundation |
| `@cratis/components/ObjectContentEditor` | Advanced React |
| `@cratis/components/ObjectNavigationalBar` | Advanced React |
| `@cratis/components/PivotViewer` | Spatial (optional `pixi.js` peer) |
| `@cratis/components/SchemaEditor` | Advanced React |
| `@cratis/components/TimeMachine` | Advanced React |
| `@cratis/components/Toolbar` | Advanced React |
| `@cratis/components/types` | Foundation |

Foundation, Advanced React, and Spatial are equal-support capability profiles, not stability tiers: all three ship from the same package at the same version, behind the same release gates, on the same semver line. "Spatial" describes what a component is for and what it costs to adopt (the optional Pixi peer), never how carefully it is built, tested, or versioned. See the published [Capability profiles](https://cratis.io/components/ui-foundation/#capability-profiles) explanation and its [capability matrix](https://cratis.io/components/ui-foundation/#capability-matrix) for state, persistence, Arc/Chronicle, SSR, and performance ownership per profile.

The root also retains every subpath as a namespace export (`import { Canvas } from '@cratis/components'`, then `Canvas.CanvasItem`) for source compatibility with established consumers; this is not the pattern for new code, and this release does not remove it. Components 4 intentionally retains the existing namespace symbols; declaration-level TSDoc and API-reference coverage for them is tracked as ongoing documentation work, not as a silent 4.x export removal. [MIGRATION.md](./MIGRATION.md) has the complete namespace-to-subpath mapping and the codemod invocation for moving existing code off the root namespace.

## Components 3 migration

Components 4 removes the mandatory PrimeReact 11 foundation. Follow the published [Components 3 to 4 migration guide](https://cratis.io/components/migration/) for dependency removal, provider changes, product token mapping, stable part names, DatePicker changes, table behavior, notifications, and direct Prime import replacements.

The old `@cratis/components/styled`, `styledMode`, `CratisPreset`, and `primeReactStyles` renderer exports are removed. Move styling to tokens and stable parts before upgrading.

## License

Cratis Components is MIT licensed. Its default runtime dependencies use permissive open-source licenses, including Apache-2.0, MIT, and ISC. The package includes its `LICENSE`, an Allotment notice in `THIRD_PARTY_NOTICES.md`, and the Patrick Hand SIL Open Font License as `dist/esm/PatrickHand-OFL.txt`. Components 4 does not require PrimeUI licensing.
