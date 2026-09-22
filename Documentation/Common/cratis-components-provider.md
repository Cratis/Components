---
title: CratisComponentsProvider
description: Configure locale, Components-owned labels and icons, and the app-wide toast region.
---

`CratisComponentsProvider` is the application root for Components-owned locale/messages and optional renderer selection. Its `value` remains renderer-independent and it does not configure an application's direct third-party component usage; a selected adapter may mount its own provider boundary. Styling remains owned by CSS or by the explicitly selected adapter.

## Basic setup

```tsx
import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider value={{ locale: 'en-US' }} toaster>
        <Application />
    </CratisComponentsProvider>
);
```

The provider memoizes its resolved configuration by the `value` object identity. For an application root that re-renders frequently, keep a configured object stable rather than constructing a large message catalog inline on every render:

```tsx
const componentsConfig = {
    locale: 'en-US',
    messages: productMessages,
};

<CratisComponentsProvider value={componentsConfig} toaster>
    <Application />
</CratisComponentsProvider>;
```

A small inline object as in the basic example is inexpensive; the stable form matters when the value contains a larger product-owned message catalog.

## Configuration

| Member                   | Purpose                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `locale`                 | BCP 47 locale used by React Aria for dates, numbers, keyboard behavior, and announcements.                                      |
| `messages.paginator`     | Components-owned paginator labels.                                                                                              |
| `messages.datePicker`    | Components-owned date-picker action/navigation labels, plus the segmented input's fallback accessible name (`label`).           |
| `messages.dropdown`      | `Dropdown`'s show-options and clear-selection labels.                                                                           |
| `messages.dialog`        | Action/dismissal labels (`ok`, `cancel`, `yes`, `no`, `close`) shared by `Dialog`, `CommandDialog`, and `StepperCommandDialog`. |
| `messages.stepper`       | Navigation labels (`next`, `previous`, `submit`) shared by `CommandStepper` and `StepperCommandDialog`.                         |
| `messages.notifications` | `Toaster`'s dismiss-action and region-landmark labels.                                                                          |
| `messages.dataTable`     | `DataTableCore`'s loaded-page search and single-row-selection labels.                                                           |
| `messages.columnFilter`  | The built-in column filter popup's clear/apply/boolean/match-mode labels.                                                       |
| `icons`                  | Components-owned icon vocabulary replacing the built-in glyphs the library draws. See [Register an icon set](#register-an-icon-set). |
| `locales`                | Temporary Components 3 compatibility map; migrate to `messages`.                                                                |

Unknown Components 3 renderer options are intentionally a type error. Remove `license`, `theme`, `defaults`, global `pt`, `ptOptions`, `ripple`, `unstyled`, and renderer z-index settings rather than compiling a provider whose visual configuration does nothing. Configure any remaining direct Prime provider independently.

## Renderer selection

The certified MUI, PrimeReact 11, and PrimeReact 10 manifests implement the stable nine-slot
`stable-presentation/v1` profile. That stable profile adapts only Button, IconButton, TextInput,
TextArea, Checkbox, Radio, Switch, ProgressBar, and Surface. It never means full-catalog
replacement.

Pass one stable presentation manifest to `library`. The broader fourteen-slot renderer system,
ordered manifest composition, scopes/islands, atomic slots, lazy loading, and public adapter
discovery remain experimental even though some `unstable_` contracts are available to repository
and adapter authors.

The provider exposes:

| Prop                 | Purpose                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `library`            | One stable presentation manifest. Ordered arrays are experimental last-wins composition. Omit for built-in.     |
| `libraryMode`        | Experimental profile-promise behavior: `strict` rejects invalid promises; `degrade` reports after mount.        |
| `rendererFallback`   | `core` keeps the built-in slot fallback; `throw` rejects an undeclared slot instead of expanding adapter scope. |
| `overlayEnvironment` | Stable, post-commit portal-container lookup through `CratisOverlayEnvironment`.                                 |
| `rendererSetup`      | Stable adapter-declared boolean attestations. Never put credentials, keys, or caches here.                      |

Adapter packages declaration-merge their own keys into `CratisRendererSetupExtensions`, so
importing an adapter gives typed setup without adding vendor fields to Core. The provider copies and
freezes boolean entries, discards non-boolean runtime values, inherits the map through nested
providers unless a nested map replaces it wholesale, and forwards it to the selected library
provider.

A key-gated renderer still receives its key through the application's own outer vendor provider.
For example, the PrimeReact 11 adapter receives only a boolean assertion that the application
completed that setup; Components never receives the key itself. See the adapter package README for
the exact provider and build-environment wiring, and the [renderer licensing policy](../renderers/licensing.md)
for the cross-adapter ownership rule.

Every message group follows the same precedence: a named component prop (or a component's own `labels`/`filterLabels` override) wins, then the matching provider message, then the English default shown above. Per-instance overrides keep working exactly as before — the provider only fills gaps a call site left unset.

## Localize owned labels

English, spelled out explicitly (this is also what every group defaults to with no provider at all):

```tsx
<CratisComponentsProvider
    value={{
        locale: 'en-US',
        messages: {
            paginator: {
                navigation: 'Pagination',
                first: 'First page',
                previous: 'Previous page',
                next: 'Next page',
                last: 'Last page',
            },
            datePicker: {
                today: 'Today',
                clear: 'Clear',
                openCalendar: 'Open calendar',
                previousMonth: 'Previous month',
                nextMonth: 'Next month',
                label: 'Date',
            },
            dropdown: {
                showOptions: 'Show options',
                clearSelection: 'Clear selection',
            },
            dialog: {
                ok: 'Ok',
                cancel: 'Cancel',
                yes: 'Yes',
                no: 'No',
                close: 'Close',
            },
            stepper: {
                next: 'Next',
                previous: 'Previous',
                submit: 'Submit',
            },
            notifications: {
                dismiss: 'Dismiss',
                region: 'Notifications',
            },
            dataTable: {
                selectRow: 'Select row',
                search: 'Search…',
                searchAriaLabel: 'Search table',
            },
            columnFilter: {
                matchModeAriaLabel: 'Match mode',
                clear: 'Clear',
                apply: 'Apply',
                true: 'True',
                false: 'False',
                filterTriggerAriaLabel: (field) => `Filter by ${field}`,
                valueAriaLabel: (field) => `Filter value for ${field}`,
            },
            toolbar: {
                label: 'Tools',
            },
        },
    }}
>
    <Application />
</CratisComponentsProvider>
```

The same shape in Norwegian Bokmål:

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
                label: 'Dato',
            },
            dropdown: {
                showOptions: 'Vis alternativer',
                clearSelection: 'Fjern valg',
            },
            dialog: {
                ok: 'Ok',
                cancel: 'Avbryt',
                yes: 'Ja',
                no: 'Nei',
                close: 'Lukk',
            },
            stepper: {
                next: 'Neste',
                previous: 'Forrige',
                submit: 'Send inn',
            },
            notifications: {
                dismiss: 'Lukk',
                region: 'Varsler',
            },
            dataTable: {
                selectRow: 'Velg rad',
                search: 'Søk…',
                searchAriaLabel: 'Søk i tabellen',
            },
            columnFilter: {
                matchModeAriaLabel: 'Sammenligningsmodus',
                clear: 'Tøm',
                apply: 'Bruk',
                true: 'Sann',
                false: 'Usann',
                filterTriggerAriaLabel: (field) => `Filtrer på ${field}`,
                valueAriaLabel: (field) => `Filterverdi for ${field}`,
            },
            toolbar: {
                label: 'Verktøy',
            },
        },
    }}
>
    <Application />
</CratisComponentsProvider>
```

React Aria supplies locale data for its interaction patterns — calendar month/weekday names, number formatting, and similar platform locale data. Components asks you only for the product labels it owns; do not copy React Aria's own locale strings into `messages`.

## Register an icon set

Components draws its own glyphs — a `×` to dismiss, a `⌄` to expand, `▲`/`▼` for sort direction.
A product with its own iconography registers `icons` once at the root and every component that draws
that concept follows, without passing a prop at each call site:

```tsx
import { CratisComponentsProvider } from '@cratis/components';
import { CloseIcon, ChevronDownIcon, SpinnerIcon } from './icons';

const componentsConfig = {
    locale: 'en-US',
    icons: {
        close: <CloseIcon />,
        remove: <CloseIcon />,
        expand: <ChevronDownIcon />,
    },
};

<CratisComponentsProvider value={componentsConfig}>
    <Application />
</CratisComponentsProvider>;
```

The map is partial by design: an unregistered name keeps its built-in glyph, so the example above
re-icons dismissal, removal and expansion and leaves sorting and pagination alone.
Registering nothing at all renders exactly what Components has always rendered — the built-in glyph
lives at its call site and is deliberately *not* part of `cratisDefaults`.

### The vocabulary

| Name            | Draws                          | Default | Used by                                                                                                          |
| --------------- | ------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------- |
| `close`         | Dismiss this surface           | `×`     | `Dialog` header close, `Toaster` toast dismiss, `ChatSidebar`, the `Chat` panel, PivotViewer's detail panel        |
| `remove`        | Remove this value              | `×`     | `TagGroup` tag remove, `Chip` remove control, `CommandForm`'s chips field                                          |
| `expand`        | Open a closed surface          | `⌄` (`▾` in `ComboBox`) | `Dropdown` trigger (all three render branches), `ComboBox` trigger                            |
| `sortAscending` | Ascending sort indicator       | `▲`     | `DataTableCore` sortable column header                                                                            |
| `sortDescending`| Descending sort indicator      | `▼`     | `DataTableCore` sortable column header                                                                            |
| `previous`      | Step backwards                 | `‹`     | `TablePaginator` previous page, `DatePickerInput` previous month                                                   |
| `next`          | Step forwards                  | `›`     | `TablePaginator` next page, `DatePickerInput` next month                                                           |
| `clear`         | Clear the current value        | `×`     | `Dropdown` clear-selection (all four render branches), PivotViewer's filter panel clear                            |

Every name is a concept more than one component draws. Names are public contract and hard to
withdraw, so the vocabulary starts here and grows as products ask for a concept by name rather than
covering every glyph in the library at once. Icons a call site supplies — `Button`'s `icon`,
`Toolbar` items, `Message`'s and a toast's own `icon` — are yours already and are not part of it.

### Precedence

Icons resolve per site as **per-component prop → provider icon → built-in glyph**, the same order
`messages` uses for strings. A prop such as `Dialog.closeIcon` or `TagGroup.removeIcon` names one
call site — "this one dialog", "this one tag group" — so it keeps winning; the provider speaks for
the product and replaces the built-in default everywhere else. Both props keep working unchanged.

```tsx
<CratisComponentsProvider value={{ icons: { close: <CloseIcon /> } }}>
    <Dialog title='Product-wide' />                  {/* draws <CloseIcon /> */}
    <Dialog title='This one' closeIcon={<Back />} /> {/* draws <Back /> */}
</CratisComponentsProvider>
```

A name registered as `null` draws no glyph while the button, its stable part and its accessible name
stay — the same meaning `closeIcon={null}` already has. Icons never touch an element's part,
className, `aria-label` or keyboard behaviour; only the mark inside changes.

`icons` merges by name. Like `messages`, a partial map leaves everything it omits alone; unlike
`messages`, an icon value is an opaque node and is carried over by identity rather than deep-merged
into, so registering a React element hands that exact element to the component.

### Reading an icon in your own component

`useCratisIcon()` returns the same resolver Components uses internally, for a product component that
wants to follow the registered vocabulary:

```tsx
import { useCratisIcon } from '@cratis/components';

export const RemoveButton = ({ icon, onRemove }: RemoveButtonProps) => {
    const resolveIcon = useCratisIcon();
    return (
        <button type='button' aria-label='Remove' onClick={onRemove}>
            <span aria-hidden='true'>{resolveIcon('remove', '×', icon)}</span>
        </button>
    );
};
```


The vocabulary replaces a **glyph**, never an element that publishes a part. `ProgressSpinner` is the
example that draws the line: its ring looks like an icon, but it is an `svg` carrying the `svg`,
`track` and `range` parts, and a registered icon that replaced it would silently delete three parts a
product may already be styling. Sites like that keep their own markup, and a product restyles them
through the parts they publish.

`expand` has two built-in glyphs today — `⌄` on a `Dropdown` trigger and `▾` on a `ComboBox`
trigger. Registering `expand` makes both consistent; registering nothing leaves each as it is, so no
existing rendering changes.

## Mount the toaster

Pass `toaster` to mount the app-wide notification region:

```tsx
<CratisComponentsProvider
    value={{ locale: 'en-US' }}
    toaster={{ position: 'top-right', dismissAriaLabel: 'Dismiss notification' }}
>
    <Application />
</CratisComponentsProvider>
```

You may instead mount `<Toaster />` yourself when its placement belongs elsewhere in the application tree.

## Choose an overlay container

The stable `overlayEnvironment` contract lets an application choose where Components-owned portals
mount without consulting browser globals during import or server rendering:

```tsx
import {
    CratisComponentsProvider,
    type CratisComponentsProviderProps,
} from '@cratis/components';

const overlayEnvironment: NonNullable<
    CratisComponentsProviderProps['overlayEnvironment']
> = {
    getContainer: () =>
        typeof document === 'undefined'
            ? null
            : document.getElementById('application-overlays'),
};

export const App = () => (
    <CratisComponentsProvider
        value={{ locale: 'en-US' }}
        overlayEnvironment={overlayEnvironment}
    >
        <Application />
        <div id='application-overlays' />
    </CratisComponentsProvider>
);
```

Returning `null` defers the overlay; Components does not silently retarget it to `document.body`.
Direct vendor overlays keep their own portal and z-index configuration. Verify layer order and focus
behavior in the real application shell when both systems can open together.

## Styling

Import `tokens` and `styles`, then choose the baseline `theme` or your own token values. The provider has no styling responsibility.

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles';
import '@cratis/components/theme';
```

For custom products, see [Cratis tokens](../Styling/cratis-tokens.md) and [Stable component parts](../Styling/pass-through.md).

## Related exports

| Export                          | Purpose                                              |
| ------------------------------- | ---------------------------------------------------- |
| `CratisComponentsConfig`        | Renderer-independent provider configuration.         |
| `CratisComponentsMessages`      | Components-owned message groups.                     |
| `CratisComponentsIcons`         | Components-owned icon vocabulary.                    |
| `useCratisIcon()`               | Resolver for one icon site: prop, then provider, then built-in glyph. |
| `CratisIconResolver`            | Type of the resolver `useCratisIcon()` returns.      |
| `cratisDefaults`                | Default locale and English labels.                   |
| `mergeCratisComponentsConfig()` | Pure configuration merge helper.                     |
| `useCratisComponentsConfig()`   | Reads the resolved configuration inside a component. |
