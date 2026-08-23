---
title: CratisComponentsProvider
description: Configure locale, Components-owned labels, and the app-wide toast region.
---

`CratisComponentsProvider` is the application root for renderer-independent Components configuration. It does not provide a theme runtime or third-party renderer context; styling is owned by CSS.

## Basic setup

```tsx
import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider value={{ locale: 'en-US' }} toaster>
        <Application />
    </CratisComponentsProvider>
);
```

## Configuration

| Member                | Purpose                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `locale`              | BCP 47 locale used by React Aria for dates, numbers, keyboard behavior, and announcements. |
| `messages.paginator`  | Components-owned paginator labels.                                                         |
| `messages.datePicker` | Components-owned date-picker action/navigation labels.                                     |
| `locales`             | Temporary Components 3 compatibility map; migrate to `messages`.                           |

Unknown Components 3 renderer options remain accepted during the major migration so applications can update incrementally, but they have no effect. Remove `license`, `theme`, `defaults`, `pt`, `ptOptions`, `ripple`, `unstyled`, and renderer z-index settings from the provider.

## Localize owned labels

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

React Aria supplies locale data for its interaction patterns. Components asks you only for product labels it owns.

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
