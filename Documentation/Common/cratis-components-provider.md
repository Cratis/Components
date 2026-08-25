---
title: CratisComponentsProvider
description: Configure locale, Components-owned labels, and the app-wide toast region.
---

`CratisComponentsProvider` is the application root for renderer-independent Components configuration. It does not provide a theme runtime or third-party renderer context; styling is owned by CSS.

## Basic setup

```tsx
import { CratisComponentsProvider } from '@cratis/components/Common';

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

Every group follows the same precedence: a named component prop (or a component's own `labels`/`filterLabels` override) wins, then the matching provider message, then the English default shown above. Per-instance overrides keep working exactly as before — the provider only fills gaps a call site left unset.

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
