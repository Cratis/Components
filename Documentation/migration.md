---
title: Migrate from Components 3 to 4
description: Move from the PrimeReact-backed release to the renderer-independent React Aria foundation.
---

Components 4 replaces the mandatory PrimeReact 11 foundation with Cratis-owned markup, styling contracts, and public types. React Aria supplies accessible interaction behavior internally. Applications no longer install, configure, license, theme, or type against PrimeReact to use Components.

This is intentionally a major release. Component behavior remains familiar, but rendered markup, styling parts, provider configuration, date entry, and some deprecated props change.

:::note
Components 3 remains the compatibility line for an application that cannot migrate yet. A separate PrimeReact compatibility package will not be published unless PrimeTek confirms the applicable OEM and redistribution terms in writing.
:::

## Update dependencies

Remove the Prime packages that were installed only for Components:

```bash
npm uninstall \
  primereact primeicons \
  @primereact/core @primereact/headless @primereact/hooks \
  @primereact/styles @primereact/types \
  @primeuix/themes
npm install @cratis/components
```

Keep a Prime package only when your application still imports it directly. Migrate those imports separately; Components no longer supplies or requires them.

The supported Arc peer range remains `>=20.3.1 <23`.

## Keep the stylesheet entry points

The three Cratis-owned stylesheet entries remain:

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles';
import '@cratis/components/theme'; // optional baseline appearance
```

- `tokens` defines the stable semantic `--cratis-*` variables.
- `styles` contains structural rules for every component.
- `theme` supplies the optional baseline light/dark values.

A custom product design can omit `theme`, define the `--cratis-*` variables itself, and style stable component parts through classes or `pt`.

## Simplify the provider

The provider now owns locale and Components-specific labels. It no longer accepts a PrimeUI key, renderer preset, global Prime pass-through map, ripple setting, or renderer defaults.

```tsx
import { CratisComponentsProvider } from '@cratis/components';

export const ApplicationRoot = ({ children }: { children: React.ReactNode }) => (
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
        toaster
    >
        {children}
    </CratisComponentsProvider>
);
```

`locales` remains temporarily accepted and maps the old paginator/date labels, but new code should use `messages`. Unknown renderer keys are ignored and should be removed.

## Replace renderer presets with tokens

Remove `styledMode()`, `CratisPreset`, and `primeReactStyles` before upgrading. The `@cratis/components/styled` renderer-specific entry point is removed in Components 4.

Before:

```tsx
<CratisComponentsProvider value={{ license, ...styledMode({ preset: ProductPreset }) }}>
    <App />
</CratisComponentsProvider>
```

After:

```tsx
<CratisComponentsProvider value={{ locale: 'en-US' }}>
    <App />
</CratisComponentsProvider>
```

Map product tokens directly in CSS:

```css
:root {
    --cratis-primary-color: var(--product-accent-700);
    --cratis-primary-color-text: var(--product-text-inverse);
    --cratis-surface-card: var(--product-surface);
    --cratis-surface-overlay: var(--product-surface);
    --cratis-surface-border: var(--product-border);
    --cratis-text-color: var(--product-text-primary);
    --cratis-text-color-secondary: var(--product-text-secondary);
    --cratis-focus-ring: var(--product-focus-ring);
}
```

This removes the old product-token → Prime preset → Prime variable → Cratis variable translation chain.

## Migrate pass-through configuration

The `pt` prop remains the per-part customization surface, but its values are now ordinary HTML attributes and its keys are stable Cratis names. `ptOptions` and `unstyled` remain accepted temporarily but have no effect: part attributes always merge, and Components always uses consumer-owned CSS.

```tsx
<Dialog
    title='Confirm deletion'
    pt={{
        backdrop: { className: 'product-dialog-backdrop' },
        root: { className: 'product-dialog' },
        header: { className: 'product-dialog-header' },
        title: { className: 'product-dialog-title' },
        close: { className: 'product-dialog-close' },
        content: { className: 'product-dialog-content' },
        footer: { className: 'product-dialog-footer' },
    }}
>
    This cannot be undone.
</Dialog>
```

Every meaningful element also carries `data-cratis-part`. Interactive states use attributes such as `data-selected`, `data-invalid`, `data-disabled`, `data-active`, and `data-position`. Do not target React Aria class names or internal DOM structure.

### Common part mappings

| Components 3 renderer slot     | Components 4 Cratis part                       |
| ------------------------------ | ---------------------------------------------- |
| Dialog `mask` / `backdrop`     | `backdrop`                                     |
| Dialog `positioner`            | `positioner`                                   |
| Dialog `root`                  | `root`                                         |
| Dialog `headerTitle` / `title` | `title`                                        |
| Dialog `closeButton` / `close` | `close`                                        |
| DataTable `tableContainer`     | `tableContainer`                               |
| DataTable `thead`              | `head`                                         |
| DataTable `tbody`              | `body`                                         |
| DataTable `bodyRow` / `row`    | `row`                                          |
| Dropdown `trigger`             | `trigger`                                      |
| Dropdown `option`              | `option`                                       |
| DatePicker `input`             | segmented `input`; identity belongs on `group` |

See [Stable component parts](Styling/pass-through.md) for the complete contract.

## Update DatePicker integration

`DatePickerInput` still accepts and emits `Date | null`, but its internal value uses `@internationalized/date`. Formatting now follows the active locale and calendar rather than a PrimeReact mask.

- Replace `dateFormat` with locale configuration where possible. The prop remains accepted but is ignored.
- Use `aria-label` or `aria-labelledby` for the segmented date group.
- `id` identifies the focus group rather than a native text input.
- `todayLabel` and `clearLabel` override the provider messages for one picker.
- `showTime` and `hourFormat` remain supported.

## Update Dropdown styling and semantics

`Dropdown` preserves the `value`, `options`, `optionLabel`, `optionValue`, filtering, clear, and change-event model. Single selects now follow the WAI-ARIA button/listbox pattern; filtered selects use a combobox.

Do not assume every Dropdown trigger has `role="combobox"`. Query it by its accessible name or `data-cratis-part="trigger"` in tests.

Multiple selection remains available through the native multiple-select path. Prefer a dedicated collection picker for a large or highly customized multi-select experience.

## Update tables

`DataTableCore` now renders semantic HTML. Query-backed paging remains owned by Arc.

- Sorting and filtering apply to the currently loaded page.
- Complete-result filtering belongs in query arguments and runs on the server before paging.
- `clientFiltering` is removed; it was a deprecated no-op in Components 3.
- `Column` remains the declarative column marker.
- Table styling uses `DataTableParts` and `data-cratis-part`.
- Server totals remain authoritative for the paginator.

Custom matchers registered with `registerDataTableFilterMatcher()` continue to work.

## Update dialogs and steppers

Dialog callback, busy, validity, dismissal, and initial-focus contracts remain. The modal/focus implementation is now React Aria-based.

Stepper parts are Cratis-owned: `root`, `list`, `step`, `header`, `number`, `title`, `separator`, `panels`, and `panel`. Custom CSS that targeted Prime stepper classes or roles must move to those parts.

## Update notifications

The imperative API remains:

```ts
import { toast } from '@cratis/components/Notifications';

toast.success({
    title: 'Saved',
    description: 'Your changes were saved.',
});
```

The queue, promise lifecycle, dispatch substitution, timeout pause, focus behavior, frames, and region are Cratis-owned. Toast part keys are `region`, `toast`, `icon`, `content`, `title`, `description`, `action`, and `close`.

## Replace direct Prime imports

Components cannot remove PrimeUI licensing from an application that still imports Prime directly. Replace those imports with Components, native HTML, or application-owned primitives.

Typical replacements:

| Prime import                         | Preferred replacement                      |
| ------------------------------------ | ------------------------------------------ |
| `primereact/button`                  | `Button` from `@cratis/components/Common`  |
| `primereact/inputtext`               | CommandForm field or native styled input   |
| `primereact/dialog`                  | `Dialog` from `@cratis/components/Dialogs` |
| `primereact/dropdown` / `select`     | `Dropdown`                                 |
| `primereact/datatable` / `column`    | `DataTableCore` / `Column`                 |
| `primereact/tag`, `badge`, `message` | `@cratis/components/Display`               |
| `primereact/toast` / `toaster`       | `@cratis/components/Notifications`         |

PrimeIcons class strings are still accepted where a component takes an icon node/string, but Components no longer installs PrimeIcons. Prefer a React icon component or product-owned SVG.

## Verify the migration

1. Remove unused Prime dependencies and the PrimeUI license/provider configuration.
2. Import `tokens` and `styles`; choose the baseline `theme` or map product tokens.
3. Replace global Prime presets with Cratis tokens.
4. Update `pt` keys and CSS selectors to Cratis parts.
5. Replace direct Prime imports.
6. Exercise dialogs, filtered tables, dates, dropdowns, toasts, and steppers with keyboard-only navigation.
7. Verify light, dark, forced-colors, reduced-motion, and responsive layouts.
8. Run TypeScript, specs, Storybook, and the production build.

For the decision, trade-offs, and validation gates, read [UI foundation](ui-foundation.md). For the older 2.x → 3.x PrimeReact migration, see [Migrate from Components 2 to 3](migration-from-2.md).
