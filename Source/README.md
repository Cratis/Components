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

## Entry points

- `@cratis/components`
- `@cratis/components/Canvas`
- `@cratis/components/CommandDialog`
- `@cratis/components/CommandStepper`
- `@cratis/components/CommandForm`
- `@cratis/components/CommandForm/fields`
- `@cratis/components/Common`
- `@cratis/components/DataPage`
- `@cratis/components/DataTables`
- `@cratis/components/Dialogs`
- `@cratis/components/Display`
- `@cratis/components/Dropdown`
- `@cratis/components/Filter`
- `@cratis/components/Notifications`
- `@cratis/components/ObjectContentEditor`
- `@cratis/components/ObjectNavigationalBar`
- `@cratis/components/PivotViewer`
- `@cratis/components/SchemaEditor`
- `@cratis/components/TimeMachine`
- `@cratis/components/Toolbar`
- `@cratis/components/types`

The root entry retains the existing namespace exports for source compatibility with established consumers. New code should import the narrow subpath it uses—especially `Common` for provider setup—so bundlers and readers do not traverse unrelated component families. Components 4 intentionally retains the existing namespace symbols; [#173](https://github.com/Cratis/Components/issues/173) tracks declaration-level TSDoc and API-reference coverage, not silent 4.x export removal.

## Components 3 migration

Components 4 removes the mandatory PrimeReact 11 foundation. Follow the published [Components 3 to 4 migration guide](https://cratis.io/components/migration/) for dependency removal, provider changes, product token mapping, stable part names, DatePicker changes, table behavior, notifications, and direct Prime import replacements.

The old `@cratis/components/styled`, `styledMode`, `CratisPreset`, and `primeReactStyles` renderer exports are removed. Move styling to tokens and stable parts before upgrading.

## License

Cratis Components is MIT licensed. Its default runtime dependencies use permissive open-source licenses, including Apache-2.0, MIT, and ISC. The package includes its `LICENSE`, an Allotment notice in `THIRD_PARTY_NOTICES.md`, and the Patrick Hand SIL Open Font License as `dist/esm/PatrickHand-OFL.txt`. Components 4 does not require PrimeUI licensing.
