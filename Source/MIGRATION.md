# Migrate from Components 3 to 4

Components 4 replaces the mandatory PrimeReact 11 foundation with Cratis-owned markup, styling contracts, and public types. React Aria supplies accessible interaction behavior internally. Applications no longer install, configure, license, theme, or type against PrimeReact to use Components.

This is intentionally a major release. Component behavior remains familiar, but rendered markup, styling parts, provider configuration, date entry, and some deprecated props change.

:::note
Components 3 remains the compatibility line for an application that cannot migrate yet. A separate PrimeReact compatibility package will not be published unless PrimeTek confirms the applicable OEM and redistribution terms in writing.

**What staying on Components 3 means.** Components 3 keeps PrimeReact 11 as a peer dependency, and PrimeReact 11 verifies a PrimeUI license key when its provider mounts — on every styling path, including unstyled and the MIT Cratis baseline theme, in development and production. Without a valid key the application shows a fixed _"Invalid PrimeUI License"_ banner. The free Community key is eligibility-limited and must be renewed annually; an expired Community key has a 30-day grace period before the banner returns. See [the Components 2 to 3 guide's licensing section](https://github.com/Cratis/Components/blob/main/Documentation/migration-from-2.md#licensing) for the full terms.

Components 3 receives security and critical defect fixes as the migration compatibility line; it receives no new features or foundation work. Plan the move to Components 4 rather than treating Components 3 as a steady state.
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

The provider now owns locale and Components-specific labels. Unknown renderer keys are a type error so a migrated app cannot silently lose its theme, license, global pass-through, ripple, or z-index behavior. Remove those keys from `CratisComponentsProvider` and configure any remaining direct Prime provider independently.

```tsx
import { CratisComponentsProvider } from '@cratis/components/Common';

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

`locales` remains temporarily accepted and maps the old paginator/date labels, but new code should use `messages`. Renderer keys such as `license`, `theme`, `defaults`, `pt`, `ripple`, `unstyled`, and z-index settings are not part of this provider.

## Replace renderer presets with tokens

Remove `styledMode()`, `CratisPreset`, and `primeReactStyles` before upgrading. Components 4 removes three renderer-specific subpaths:

| Removed subpath                             | Migration                                                                                                                                       |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `@cratis/components/styled`                 | Import Cratis tokens/styles and map product tokens directly as shown below.                                                                     |
| `@cratis/components/compatibility`          | Replace Prime slot types/sentinel presets with each component's Cratis-owned `*Parts` type. The root `Compatibility` namespace is also removed. |
| `@cratis/components/primereact-v10-palette` | Remove legacy Prime variable dependencies; define product tokens and map them to `--cratis-*`, or use the baseline theme.                       |

There is no compatibility-package replacement in Components 4. Stay on Components 3 while renderer-specific types or selectors remain.

### Removed symbol mapping

| Removed Components 3 export                                                         | Components 4 action                                                                                   |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `styledMode`, `StyledModeOptions`, `CratisPreset`, `primeReactStyles`               | Remove renderer configuration; use provider locale/messages and direct `--cratis-*` token mappings.   |
| `primeReactCssLayer`, `primeReactCssLayerOrder`                                     | Delete unless the product still owns direct Prime CSS; product layer ordering belongs in product CSS. |
| `cratisDarkModeSelector`                                                            | Use the product's own theme selector and assign `--cratis-*` values under it.                         |
| `assertPrimeReact11PassThroughCompatibility`                                        | Delete after moving renderer slots to typed Cratis `*Parts` surfaces.                                 |
| `components3PrimeReact11PassThroughContract`, `PrimeReact11PassThroughComponent`    | Replace with component-specific public part types.                                                    |
| `primeReact11PassThroughSentinelAttribute`, `primeReact11PassThroughSentinelPreset` | Replace with documented `data-cratis-part` and state attributes.                                      |
| `@cratis/components/primereact-v10-palette` variables                               | Map canonical product tokens directly to `--cratis-*`.                                                |

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

## Removed accidental package exports

An audit of the published `exports` map ([#173](https://github.com/Cratis/Components/issues/173)) found implementation-only symbols that were unintentionally reachable from a public subpath — each was exported only because the owning module's barrel used a blanket `export *`, not because it was a supported contract. Components 4 stops re-exporting them from their public barrel; the underlying files keep the symbol for their own internal cross-file use, so this is a package-export change only, not a behavior change.

| Removed export                                                | Subpath(s)                                                       | Migration                                                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `CommandStepperContent`                                        | `@cratis/components/CommandStepper`, `@cratis/components/CommandDialog` | Private rendering primitive behind `CommandStepper` and `StepperCommandDialog`. Use one of those components; there is no direct public replacement. |
| `PivotViewerOptimized`                                         | `@cratis/components/PivotViewer`                                   | Was an accidental alias of `PivotViewer`. Import `PivotViewer` instead.                                |
| `getInitials`                                                  | `@cratis/components/Canvas`                                        | Private `PersonAvatarCircle` helper. Not part of the public API.                                       |
| `findOwnReaction`, `reactionsExcludingUser`                    | `@cratis/components/Canvas`                                        | Private `ChatMessageBubble` helpers. Not part of the public API.                                       |
| `matchCandidates`, `activeMentionQuery`, `applyMention`, `MentionApplied` | `@cratis/components/Canvas`                               | Private `ChatComposer` mention helpers. Not part of the public API.                                    |
| `EMOJI_CATALOG`, `EmojiCategoryKey`                             | `@cratis/components/Canvas`                                        | Private `EmojiPicker` implementation details. Not part of the public API.                              |
| `DEFAULT_EMOJIS`, `QUICK_ROW_SIZE`                              | `@cratis/components/Canvas`                                        | Private `recentEmojis`/`rememberEmoji` constants. Not part of the public API.                          |
| `buildFilterValues`, `buildRangeValues`, `RenderedHistogramBucket` | `@cratis/components/Filter`                                      | Private `useFilterState`/`RangeHistogramFilter` helpers. Not part of the public API.                   |

None of these had a documented contract, and none is required by any other public API in this package. An application that imported one of these directly has no supported replacement to migrate to — inline the equivalent logic, or open an issue describing the use case if the behavior should become a supported public contract.

The surfaces this audit confirmed as intentional and kept public — `ToastRecord`, `getToastSnapshot`, `subscribeToToasts`, `ToastDispatch`, `EmojiMemory`, `ChatAuthorKind`, `DEFAULT_TYPE_FORMATS`, `NavigationItem`, `Json`, and `TimeMachine`'s `Properties` — are unchanged and now carry TSDoc explaining their contract and, where relevant, their extension-point role.

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

See the published [Stable component parts](https://cratis.io/components/styling/pass-through/) reference for the documented foundation surfaces.

### Migrate a deeply customized product

Keep the product's own tokens, Tailwind utilities, dark/high-contrast selectors, and accessibility preferences. Remove the renderer preset that translated those values into a third-party token system, then map the product values directly onto `--cratis-*`.

For a custom dialog layer, change renderer part types to Cratis types and rename slots:

```ts
import type { DialogParts } from '@cratis/components/Dialogs';
import type { StepperParts } from '@cratis/components/CommandDialog';

export const productDialogParts: DialogParts = {
    backdrop: { className: 'product-dialog-backdrop' },
    root: { className: 'product-dialog' },
    title: { className: 'product-dialog-title' },
    close: { className: 'product-dialog-close' },
    content: { className: 'product-dialog-content' },
    footer: { className: 'product-dialog-footer' },
};

export const productStepperParts: StepperParts = {
    root: { className: 'product-stepper' },
    list: { className: 'product-stepper-list' },
    step: { className: 'product-stepper-step' },
    header: { className: 'product-stepper-header' },
    number: { className: 'product-stepper-number' },
    title: { className: 'product-stepper-title' },
    panels: { className: 'product-stepper-panels' },
    panel: { className: 'product-stepper-panel' },
};
```

For an existing nested Prime stepper preset, map the slots by rendered responsibility:

| Components 3 Prime slot | Components 4 part     |
| ----------------------- | --------------------- |
| `nav`                   | `list`                |
| `panelContainer`        | `panels`              |
| `stepperpanel.root`     | `step` (`<li>`)       |
| `stepperpanel.action`   | `header` (`<button>`) |
| `stepperpanel.number`   | `number`              |
| `stepperpanel.title`    | `title`               |
| `stepperpanel.content`  | `panel` (`<section>`) |

The old `stepperpanel.header` wrapper has no one-to-one element. Put list-item layout on `step`, and interactive-header styling on `header`. Replace `data-p-active` selectors with `[data-cratis-part='step'][data-active='true']`.

### Representative migration archetypes

For a product-owned design system, remove `styledMode`, `ProductPreset`, Prime locale types, and the PrimeUI license from the Components provider. Keep `--product-*` as the canonical tokens and map them directly to `--cratis-*`. If the product still imports Prime directly, retain a separate Prime provider, preset, dependencies, and license until those imports are removed. Migrate custom filters from `registerMatcher` to `registerDataTableFilterMatcher` and use the returned `matchMode` in each constraint.

A Components 2 / PrimeReact 10 product can migrate directly to Components 4 without an intermediate Prime 11 conversion. Keep its Prime 10 provider/theme for direct Prime surfaces, mount Components independently, move `DataPage` children to the Cratis `Column`, and migrate direct controls in batches.

A Components 3 / PrimeReact 11 product can start with the Components baseline theme while keeping a separate licensed Prime provider. Retain application-owned grouped/lazy tables and ordinary action rows when Components does not claim those behaviors.

For a product-owned compositor, replace renderer part types with `DialogParts`, `StepperParts`, and the complete Toolbar part family: `ToolbarParts`, `ToolbarButtonParts`, `ToolbarGroupParts`, `ToolbarSeparatorParts`, `ToolbarLayoutParts`, `ToolbarSectionParts`, `ToolbarFolderParts`, and `ToolbarFanOutParts`. Keep shaders and measurement wrappers product-owned. Measure stable `data-cratis-part` and state boundaries; pass the integrated Canvas surface through `controlsGlassSurface`; pass `data-product-compositor-*` marker names through `captureAttributes`; and localize actions through `controlsLabels`.

The published migration guide contains the complete mappings and stop conditions for each archetype.

Paginator callbacks that formerly returned classes from renderer context must become static Cratis parts plus CSS state selectors:

```ts
import type { TablePaginatorParts } from '@cratis/components/DataTables';

export const productPaginatorParts: TablePaginatorParts = {
    root: { className: 'product-paginator' },
    first: { root: { className: 'product-paginator-button' } },
    previous: { root: { className: 'product-paginator-button' } },
    next: { root: { className: 'product-paginator-button' } },
    last: { root: { className: 'product-paginator-button' } },
    info: { className: 'product-paginator-info' },
};
```

Pass the parts to either query-backed table:

```tsx
<DataTableForQuery
    query={AllProducts}
    paginatorPt={productPaginatorParts}
    emptyMessage='No products'
>
    <Column field='name' header='Name' />
</DataTableForQuery>
```

`DataTableForObservableQuery` uses the same `paginatorPt` prop. Use `:disabled`, `:focus-visible`, and the documented `data-cratis-*` states in CSS instead of renderer callback context. The numbered-page renderer is gone; the paginator reports the current page and provides first/previous/next/last actions.

`Dropdown.inputId` and `Dropdown.panelClassName` remain migration aliases for `id` and `pt.popover.className`, but new code should use the current names.

## Update DatePicker integration

`DatePickerInput` still accepts and emits `Date | null`, but its internal value uses `@internationalized/date`. Formatting now follows the active locale and calendar rather than a PrimeReact mask.

- Replace `dateFormat` with locale configuration where possible. The prop remains accepted but is ignored.
- Use `aria-label` or `aria-labelledby` for the segmented date group.
- `id` identifies the focus group rather than a native text input.
- The accessible calendar trigger is shown by default; set `showIcon={false}` only for segment-entry-only experiences.
- `todayLabel` and `clearLabel` override the provider messages for one picker.
- `showTime` and `hourFormat` remain supported.

## Update Dropdown styling and semantics

`Dropdown` preserves the `value`, `options`, `optionLabel`, `optionValue`, filtering, clear, and change-event model. Single selects now follow the WAI-ARIA button/listbox pattern; filtered selects use a combobox.

Do not assume every Dropdown trigger has `role="combobox"`. Query it by its accessible name or `data-cratis-part="trigger"` in tests.

Multiple selection uses a native multiple-select when filtering is off and an accessible multi-value combobox when `filter` is enabled. Prefer a dedicated collection picker for a large or highly customized multi-select experience.

## Update Tooltip triggers

`Tooltip` now enhances one actual React-element trigger so focus, hover, and `aria-describedby` stay together. Wrap text, fragments, multiple siblings, or conditional content in one appropriate native control. `className` is merged onto that trigger instead of an extra wrapper.

## Update tables

`DataTableCore` now renders semantic HTML. Query-backed paging remains owned by Arc.

- Sorting and filtering apply to the currently loaded page.
- Complete-result filtering and sorting are not automatic table state. Model them in query arguments and implement them in the server query before paging.
- `clientFiltering` remains temporarily accepted as a deprecated no-op so staged source migrations compile. Remove it: filtering is always scoped to the loaded page, and complete-result filtering belongs on the server before paging.
- Legacy `{ operator, constraints }` filter entries remain accepted. `operator: 'or'` matches any constraint; all other values match every constraint.
- `Column` remains the declarative column marker. Selection columns now type only the implemented `selectionMode='single'`; the removed `'multiple'` value never provided checkbox selection.
- Table styling uses `DataTableParts` and `data-cratis-part`.
- Server totals remain authoritative for the paginator.

Common built-in Prime match-mode string values remain compatible because Components implements those predicates directly; replace the renderer constants with `DataTableFilterMatchMode` to remove the type dependency. Prime `FilterService.register()` / `registerMatcher()` custom registrations do not cross into Components: replace them with `registerDataTableFilterMatcher()` and use the returned `matchMode` in `DataTableFilterMeta`. An unregistered custom mode deliberately matches nothing.

Separate `RadioButtonField` options bound to one property now require the same explicit `name` prop so native arrow-key radio-group navigation works. `RadioGroupField` and `RatingField` generate a shared internal name automatically.

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

Complete PrimeIcons class strings remain usable where a component accepts `Icon`, but Components no longer installs the font or adds a missing base class. Consumers that retain it must load its stylesheet and pass the complete class string. Prefer a React icon component or product-owned SVG. `DataPage.MenuItem.icon` remains a React component type rather than `Icon`.

## Verify the migration

1. Remove unused Prime dependencies and the PrimeUI license/provider configuration.
2. Import `tokens` and `styles`; choose the baseline `theme` or map product tokens.
3. Replace global Prime presets with Cratis tokens.
4. Update `pt` keys and CSS selectors to Cratis parts.
5. Replace direct Prime imports.
6. Exercise dialogs, filtered tables, dates, dropdowns, toasts, and steppers with keyboard-only navigation.
7. Verify light, dark, forced-colors, reduced-motion, and responsive layouts.
8. Run TypeScript, specs, Storybook, and the production build.

For the decision, trade-offs, and validation gates, read the published [UI foundation](https://cratis.io/components/ui-foundation/) explanation. For the older 2.x → 3.x PrimeReact migration, see [Migrate from Components 2 to 3](https://cratis.io/components/migration-from-2/).

Tracked follow-up remains explicit: [#109](https://github.com/Cratis/Components/issues/109) covers a future Arc React table-state binding, [#159](https://github.com/Cratis/Components/issues/159) covers complete-result server filtering before paging, [#173](https://github.com/Cratis/Components/issues/173) covers the package-export/TSDoc audit, [#174](https://github.com/Cratis/Components/issues/174) covers remaining provider-localized labels, and [#175](https://github.com/Cratis/Components/issues/175) covers locale-aware number input. None is silently implemented by a compatibility flag in Components 4.
