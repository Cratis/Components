---
title: CratisComponentsProvider
description: Configure locale, Components-owned labels, and the app-wide toast region.
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

| Prop                 | Purpose                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| `library`            | One stable presentation manifest. Ordered arrays are experimental last-wins composition. Omit for built-in.   |
| `libraryMode`        | Experimental profile-promise behavior: `strict` rejects invalid promises; `degrade` reports after mount.      |
| `rendererFallback`   | `core` keeps the built-in slot fallback; `throw` rejects an undeclared slot instead of expanding adapter scope. |
| `overlayEnvironment` | Stable, post-commit portal-container lookup through `CratisOverlayEnvironment`.                                |
| `rendererSetup`      | Stable adapter-declared boolean attestations. Never put credentials, keys, or caches here.                     |

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
        },
    }}
>
    <Application />
</CratisComponentsProvider>
```

React Aria supplies locale data for its interaction patterns — calendar month/weekday names, number formatting, and similar platform locale data. Components asks you only for the product labels it owns; do not copy React Aria's own locale strings into `messages`.

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
| `cratisDefaults`                | Default locale and English labels.                   |
| `mergeCratisComponentsConfig()` | Pure configuration merge helper.                     |
| `useCratisComponentsConfig()`   | Reads the resolved configuration inside a component. |
