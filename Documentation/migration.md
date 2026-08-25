---
title: Migrate from Components 3 to 4
description: Move from the PrimeReact-backed release to the renderer-independent React Aria foundation.
---

Components 4 replaces the mandatory PrimeReact 11 foundation with Cratis-owned markup, styling contracts, and public types. React Aria supplies accessible interaction behavior internally. Applications no longer install, configure, license, theme, or type against PrimeReact to use Components.

This is intentionally a major release. Component behavior remains familiar, but rendered markup, styling parts, provider configuration, date entry, and some deprecated props change.

:::note
Components 3 remains the compatibility line for an application that cannot migrate yet. A separate PrimeReact compatibility package will not be published unless PrimeTek confirms the applicable OEM and redistribution terms in writing.

**What staying on Components 3 means.** Components 3 keeps PrimeReact 11 as a peer dependency, and PrimeReact 11 verifies a PrimeUI license key when its provider mounts — on every styling path, including unstyled and the MIT Cratis baseline theme, in development and production. Without a valid key the application shows a fixed _"Invalid PrimeUI License"_ banner. The free Community key is eligibility-limited and must be renewed annually; an expired Community key has a 30-day grace period before the banner returns. See [the Components 2 to 3 guide's licensing section](migration-from-2.md#licensing) for the full terms.

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

Applications using Canvas or PivotViewer must install `pixi.js@^8.20.0`, now an optional peer rather than a nested Components dependency. Align any existing direct Pixi dependency to the same compatible resolution so public `PIXI.Container` and pointer-event types come from one package instance. Applications using only non-Pixi subpaths do not need it.

The supported Arc peer range remains `>=20.3.1 <23`.

## Import from explicit subpaths

The canonical rule going forward: **the package root is setup-only; every component ships from its own subpath.**

```tsx
// Before — root namespace (still works, not canonical)
import { Canvas } from '@cratis/components';

<Canvas.Canvas showControls>
    <Canvas.CanvasItem x={0} y={0}>Content</Canvas.CanvasItem>
</Canvas.Canvas>;
```

```tsx
// After — canonical subpath, named imports
import { Canvas, CanvasItem } from '@cratis/components/Canvas';

<Canvas showControls>
    <CanvasItem x={0} y={0}>Content</CanvasItem>
</Canvas>;
```

This is **not a breaking change in this release.** The root still re-exports every subpath as a namespace (`import { Canvas } from '@cratis/components'`) for source compatibility, exactly as it does today; nothing in this section removes that bridge. It documents the rule new code should already follow and gives existing code a mechanical path onto it, ahead of any future removal — which, if it ever happens, is its own tracked, versioned change with its own migration guide.

Every namespace maps the same way: replace `import { X } from '@cratis/components'` with either an equivalent namespace import from `@cratis/components/X`, or named imports from the same subpath.

| Namespace (root, source-compatible) | Canonical subpath | Namespace-preserving migration | Named migration |
| --- | --- | --- | --- |
| `Canvas` | `@cratis/components/Canvas` | `import * as Canvas from '@cratis/components/Canvas'` | `import { Canvas, CanvasItem } from '@cratis/components/Canvas'` |
| `CommandDialog` | `@cratis/components/CommandDialog` | `import * as CommandDialog from '@cratis/components/CommandDialog'` | `import { CommandDialog } from '@cratis/components/CommandDialog'` |
| `CommandStepper` † | `@cratis/components/CommandStepper` | `import * as CommandStepper from '@cratis/components/CommandStepper'` | `import { CommandStepper } from '@cratis/components/CommandStepper'` |
| `CommandForm` | `@cratis/components/CommandForm` | `import * as CommandForm from '@cratis/components/CommandForm'` | `import { AutoCommandForm, InputTextField } from '@cratis/components/CommandForm'` |
| `Common` | `@cratis/components/Common` | `import * as Common from '@cratis/components/Common'` | `import { CratisComponentsProvider, Button } from '@cratis/components/Common'` |
| `DataPage` | `@cratis/components/DataPage` | `import * as DataPage from '@cratis/components/DataPage'` | `import { DataPage, Column } from '@cratis/components/DataPage'` |
| `DataTables` | `@cratis/components/DataTables` | `import * as DataTables from '@cratis/components/DataTables'` | `import { DataTableForQuery, Column } from '@cratis/components/DataTables'` |
| `Dialogs` | `@cratis/components/Dialogs` | `import * as Dialogs from '@cratis/components/Dialogs'` | `import { Dialog } from '@cratis/components/Dialogs'` |
| `Display` | `@cratis/components/Display` | `import * as Display from '@cratis/components/Display'` | `import { Tag, Badge } from '@cratis/components/Display'` |
| `Dropdown` | `@cratis/components/Dropdown` | `import * as Dropdown from '@cratis/components/Dropdown'` | `import { Dropdown } from '@cratis/components/Dropdown'` |
| `Filter` | `@cratis/components/Filter` | `import * as Filter from '@cratis/components/Filter'` | `import { FilterPanel } from '@cratis/components/Filter'` |
| `Notifications` | `@cratis/components/Notifications` | `import * as Notifications from '@cratis/components/Notifications'` | `import { Toaster, toast } from '@cratis/components/Notifications'` |
| `ObjectContentEditor` | `@cratis/components/ObjectContentEditor` | `import * as ObjectContentEditor from '@cratis/components/ObjectContentEditor'` | `import { ObjectContentEditor } from '@cratis/components/ObjectContentEditor'` |
| `ObjectNavigationalBar` | `@cratis/components/ObjectNavigationalBar` | `import * as ObjectNavigationalBar from '@cratis/components/ObjectNavigationalBar'` | `import { ObjectNavigationalBar } from '@cratis/components/ObjectNavigationalBar'` |
| `PivotViewer` | `@cratis/components/PivotViewer` | `import * as PivotViewer from '@cratis/components/PivotViewer'` | `import { PivotViewer } from '@cratis/components/PivotViewer'` |
| `SchemaEditor` | `@cratis/components/SchemaEditor` | `import * as SchemaEditor from '@cratis/components/SchemaEditor'` | `import { SchemaEditor } from '@cratis/components/SchemaEditor'` |
| `TimeMachine` | `@cratis/components/TimeMachine` | `import * as TimeMachine from '@cratis/components/TimeMachine'` | `import { TimeMachine, EventsView } from '@cratis/components/TimeMachine'` |
| `Toolbar` | `@cratis/components/Toolbar` | `import * as Toolbar from '@cratis/components/Toolbar'` | `import { Toolbar, ToolbarButton } from '@cratis/components/Toolbar'` |
| `Types` | `@cratis/components/types` | `import * as Types from '@cratis/components/types'` | `import { JsonSchema, Json } from '@cratis/components/types'` |

† `CommandStepper` needs care in one direction only: the root's `CommandStepper` namespace is an alias of the _entire_ `CommandDialog` module, so `CommandStepper.StepperCommandDialog` and even `CommandStepper.CommandDialog` are reachable there today. The dedicated `@cratis/components/CommandStepper` subpath only carries `CommandStepper` itself and its stepper types. Migrate anything reached as `CommandStepper.StepperCommandDialog` or `CommandStepper.CommandDialog` to the `CommandDialog` row above instead.

`@cratis/components/CommandForm/fields` is the same module as `@cratis/components/CommandForm` — either subpath resolves identically, so the `CommandForm` row's migration applies to both.

A codemod will automate this rewrite across a source tree once it ships:

```bash
node Source/scripts/migrate-root-imports.mjs <paths...>
```

This script has not shipped in this release — the invocation shape above is documented now so the tool and this guide describe the same command once it lands. Until then, apply the table by hand; it is a mechanical rename, not a behavioral change, so a codemod and a manual edit produce identical output.

See [UI foundation: Capability profiles](ui-foundation.md#capability-profiles) for how these subpaths group into Foundation, Advanced React, and Spatial, and the [capability matrix](ui-foundation.md#capability-matrix) for what each profile owns.

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

| Removed Components 3 export                                                         | Components 4 action                                                                                                                                                          |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `styledMode`, `StyledModeOptions`, `CratisPreset`, `primeReactStyles`               | Remove the renderer configuration. Pass locale/messages to `CratisComponentsProvider`, import the Cratis stylesheet layers, and map product values directly to `--cratis-*`. |
| `primeReactCssLayer`, `primeReactCssLayerOrder`                                     | Delete unless the product still owns direct Prime CSS. Product cascade-layer ordering now belongs in product CSS.                                                            |
| `cratisDarkModeSelector`                                                            | Use the product's own theme selector and assign the corresponding `--cratis-*` values under it.                                                                              |
| `assertPrimeReact11PassThroughCompatibility`                                        | Delete after migrating every renderer slot to a typed Cratis `*Parts` surface. Package export verification replaces the old renderer-sentinel check.                         |
| `components3PrimeReact11PassThroughContract`, `PrimeReact11PassThroughComponent`    | Replace with the component-specific `DialogParts`, `DataTableParts`, `TablePaginatorParts`, `StepperParts`, `ToolbarParts`, and related public types.                        |
| `primeReact11PassThroughSentinelAttribute`, `primeReact11PassThroughSentinelPreset` | Replace sentinel selectors with documented `data-cratis-part` and state attributes.                                                                                          |
| `@cratis/components/primereact-v10-palette` variables                               | Map the product's canonical tokens directly to `--cratis-*`; do not preserve a product → Prime → Cratis bridge.                                                              |

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

| Removed export                                                            | Subpath(s)                                                              | Migration                                                                                                                                           |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CommandStepperContent`                                                   | `@cratis/components/CommandStepper`, `@cratis/components/CommandDialog` | Private rendering primitive behind `CommandStepper` and `StepperCommandDialog`. Use one of those components; there is no direct public replacement. |
| `PivotViewerOptimized`                                                    | `@cratis/components/PivotViewer`                                        | Was an accidental alias of `PivotViewer`. Import `PivotViewer` instead.                                                                             |
| `getInitials`                                                             | `@cratis/components/Canvas`                                             | Private `PersonAvatarCircle` helper. Not part of the public API.                                                                                    |
| `reactionsExcludingUser`                                                  | `@cratis/components/Canvas`                                             | Private `ChatMessageBubble` rendering helper. `findOwnReaction` remains public for consumers that own reaction commands.                            |
| `matchCandidates`, `activeMentionQuery`, `applyMention`, `MentionApplied` | `@cratis/components/Canvas`                                             | Private `ChatComposer` mention helpers. Not part of the public API.                                                                                 |
| `EMOJI_CATALOG`, `EmojiCategoryKey`                                       | `@cratis/components/Canvas`                                             | Private `EmojiPicker` implementation details. Not part of the public API.                                                                           |
| `DEFAULT_EMOJIS`, `QUICK_ROW_SIZE`                                        | `@cratis/components/Canvas`                                             | Private `recentEmojis`/`rememberEmoji` constants. Not part of the public API.                                                                       |
| `buildFilterValues`, `buildRangeValues`, `RenderedHistogramBucket`        | `@cratis/components/Filter`                                             | Private `useFilterState`/`RangeHistogramFilter` helpers. Not part of the public API.                                                                |

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

See [Stable component parts](Styling/pass-through.md) for the documented foundation surfaces.

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

### Product-owned preset migration

Consider a product that previously supplied `styledMode({ preset: ProductPreset })`, Prime locale types, a PrimeUI license, and a legacy token bridge:

1. Remove `styledMode`, `ProductPreset`, and the license from the **Components provider**. If the product still renders Prime directly, keep its Prime provider, preset, dependencies, and license beside Components until those direct imports are removed.
2. Replace `LocaleProps['locales']` with product-owned message input and map only Components labels into `CratisComponentsMessages`.
3. Keep `--product-*` as the canonical design tokens. Replace the `--p-*` and `--surface-*` bridge with direct `--cratis-*` assignments.
4. Keep the product's theme selector and map both light and dark values there; Components does not own the product's theme lifecycle.

```tsx
import type { ReactNode } from 'react';
import {
    CratisComponentsProvider,
    type CratisComponentsMessages,
} from '@cratis/components/Common';

interface ProductComponentsProviderProps {
    children: ReactNode;
    locale?: string;
    messages?: CratisComponentsMessages;
}

export const ProductComponentsProvider = ({
    children,
    locale = 'en-US',
    messages,
}: ProductComponentsProviderProps) => (
    <CratisComponentsProvider value={{ locale, messages }} toaster>
        {children}
    </CratisComponentsProvider>
);
```

Import Components structure but omit its optional theme, then load the product mapping:

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles';
import './product-components.css';
```

```css
:root {
    --cratis-surface-0: var(--product-surface);
    --cratis-surface-100: var(--product-subtle);
    --cratis-surface-ground: var(--product-canvas);
    --cratis-surface-section: var(--product-subtle);
    --cratis-surface-card: var(--product-surface);
    --cratis-surface-overlay: var(--product-surface);
    --cratis-surface-hover: var(--product-subtle);
    --cratis-surface-border: var(--product-border-default);
    --cratis-control-background: var(--product-surface);
    --cratis-control-border: var(--product-border-default);

    --cratis-text-color: var(--product-text-primary);
    --cratis-text-color-secondary: var(--product-text-secondary);

    --cratis-primary-color: var(--product-accent-700);
    --cratis-primary-color-text: var(--product-text-inverse);
    --cratis-primary-300: var(--product-accent-300);
    --cratis-primary-400: var(--product-accent-400);
    --cratis-primary-500: var(--product-accent-500);
    --cratis-primary-600: var(--product-accent-600);
    --cratis-action-background: var(--product-accent-500);
    --cratis-action-background-hover: var(--product-accent-600);
    --cratis-action-background-active: var(--product-accent-700);
    --cratis-action-text: var(--product-text-inverse);

    --cratis-highlight-bg: var(--product-accent-50);
    --cratis-highlight-text-color: var(--product-accent-700);
    --cratis-green-500: var(--product-success-fg);
    --cratis-orange-500: var(--product-warning-fg);
    --cratis-red-500: var(--product-error-fg);
    --cratis-info-background: var(--product-info-fg);
    --cratis-info-text: var(--product-text-inverse);
    --cratis-success-background: var(--product-success-fg);
    --cratis-success-text: var(--product-text-inverse);
    --cratis-warning-background: var(--product-warning-fg);
    --cratis-warning-text: var(--product-text-inverse);
    --cratis-danger-background: var(--product-error-fg);
    --cratis-danger-text: var(--product-text-inverse);
    --cratis-control-height: var(--product-control-min-size);
    --cratis-control-height-small: var(--product-control-min-size);
    --cratis-control-height-large: var(--product-control-min-size);
    --cratis-border-radius: 6px;
    --cratis-focus-ring: var(--product-ring-focus);
    --cratis-maskbg: var(--product-scrim);
    --cratis-shadow-subtle: var(--product-shadow-sm);
    --cratis-shadow-overlay: var(--product-shadow-md);
    --cratis-shadow-dialog: var(--product-shadow-xl);
    --cratis-shadow-toast: var(--product-shadow-md);
}
```

Because these assignments reference product tokens, existing dark, enhanced-contrast, control-size, status, and accessibility selectors flow through without duplicating the mapping. The product continues to own typography, spacing, motion, elevation, and component-specific treatments.

If one product area still uses Prime's locale-aware `InputNumber`, keep it as an explicitly bounded Prime island. Mount the Prime provider independently around that remaining surface and retain its installed-version theme/license requirements; do not put renderer keys back into `CratisComponentsProvider`:

```tsx
import { PrimeReactProvider } from '@primereact/core';

<CratisComponentsProvider value={{ locale, messages }}>
    <PrimeReactProvider license={primeUiLicense}>
        <LocaleAwareNumberInput />
    </PrimeReactProvider>
</CratisComponentsProvider>;
```

PrimeReact 11 receives `license` directly as a provider prop; it does **not** use the `value={{ license }}` shape of `CratisComponentsProvider`. Add the installed Prime theme/provider options beside `license` when that island needs them.

The provider boundary scopes Prime runtime configuration and context, but a JavaScript-imported Prime theme stylesheet is still a **document-global side effect**. Put the import in the smallest host entry point that contains the island and inventory any `.p-*` selectors that intentionally depend on it; wrapping a subtree does not isolate that CSS. Every retained island should have an owner, a reason it remains, its licensing/theme dependencies, and an explicit removal condition or tracking issue.

Other areas can remove Prime as soon as they have no direct Prime imports. Remove the separate Prime provider only when number grouping, decimal handling, fraction digits, prefix/suffix, min/max, and command binding have an accepted renderer-independent replacement.

This preserves product token and theme ownership while removing the circular product → Prime preset → Prime variables → Cratis translation.

Custom filters must migrate in the same change: replace the Prime `FilterMatchMode` import with `DataTableFilterMatchMode`, replace `registerMatcher` with `registerDataTableFilterMatcher`, and store the returned `matchMode` in the corresponding constraint. Built-in mode strings remain behaviorally compatible, but using the Cratis constants removes the renderer type dependency; custom registration never crosses registries automatically. Tests and application-owned adapters that must verify the live registered predicate can call `resolveDataTableFilterMatcher(matchMode)` from the same DataTables subpath.

### Migrate directly from Components 2

A PrimeReact 10 application does not need to adopt Components 3/PrimeReact 11 before moving to Components 4. Migrate the two boundaries independently:

1. Keep the existing Prime 10 provider and Lara/product theme while direct Prime controls remain.
2. Mount `CratisComponentsProvider` separately and import `tokens` plus `styles`.
3. Map the product palette directly to `--cratis-*`; omit the baseline `theme` when product CSS owns the appearance.
4. Use the Cratis `Column` marker inside `DataPage`. Alias and retain Prime `Column` only for grouped/expandable direct Prime tables.
5. Replace low-risk direct Button, Tag, Badge, Avatar, Message, Progress, Dropdown, Dialog, and Toast surfaces in batches.
6. Retain Prime or build product primitives for tabs, sidebars, timelines, select-button groups, menubars, and advanced tables until their requirements have an intentional replacement.
7. Retain PrimeIcons while class strings remain; move to React icons/product SVGs separately.

This avoids an unnecessary intermediate Prime 11 migration and does not imply that Components configures the remaining Prime 10 surfaces.

### Baseline-first coexistence with PrimeReact 11

A Components 3 / PrimeReact 11 application can adopt Components 4 while retaining Prime 11 directly:

1. Mount Components and Prime providers independently. Keep Prime dependencies, theme, and license for direct Prime controls.
2. Remove `styledMode()` and `@cratis/components/primereact-v10-palette` from the Components side.
3. Start with `tokens`, `styles`, and `theme` plus `cratis-dark` for the maintained baseline dark appearance.
4. Keep temporary legacy `--surface-*` aliases in product-owned CSS while direct Prime and old product styles remain; migrate those references to `--cratis-*` over time.
5. Replace simple product-owned Prime wrappers where Components or native composition has parity.
6. Keep the application-owned grouped/lazy table adapter until #109 or another proven state seam covers its grouping and controlled server sorting.
7. Use Components `Toolbar` only for canvas/tool-palette interactions. Keep a native action row for ordinary page actions rather than forcing a canvas toolbar replacement.

Every host entry point that renders Components must import the structural stylesheet. A package that imports Components must also declare it rather than relying on another workspace's dependency.

### Product compositor migration

A deeply customized product can retain its shaders and measurement wrappers while replacing renderer types and selectors at the Components boundary:

- Type dialog maps as `DialogParts`: `mask` → `backdrop`, `headerTitle` → `title`, and `closeButton` → `close`.
- Type stepper maps as `StepperParts`: `nav` → `list`, `panelContainer` → `panels`, `stepperpanel.root` → `step`, `action` → `header`, and `content` → `panel`.
- Toolbar composition exposes `ToolbarParts`, `ToolbarButtonParts`, `ToolbarGroupParts`, `ToolbarSeparatorParts`, `ToolbarLayoutParts`, `ToolbarSectionParts`, `ToolbarFolderParts`, and `ToolbarFanOutParts`. A product measurement wrapper should identify boundaries through `toolbar-group`, `toolbar-separator`, `toolbar-layout`, `toolbar-section`, `toolbar-context`, and `toolbar-slot*` `data-cratis-part` values. Direction, mode, expanded, settled, active, and transitioning state are data attributes, so the product can keep its composited sibling and measurement algorithm without depending on `.toolbar*` implementation classes.
- For integrated Canvas controls, pass the product surface through `controlsGlassSurface`, localized actions through `controlsLabels`, and compositor marker names through `captureAttributes`. Set `disableControlsGlass` only when the product intentionally wants the low-cost CSS fallback. Components does not hardcode or duplicate product marker vocabulary.
- Preserve product-owned capture attributes through the documented Canvas prop and ordinary part attributes; keep capture/compositor implementation in the product.

```tsx
import { ProductCompositorSurface } from './ProductCompositorSurface';

<Canvas
    captureAttributes={{
        layer: 'data-product-compositor-layer',
        content: 'data-product-compositor-content',
        transformHost: 'data-product-compositor-transform-host',
    }}
    controlsGlassSurface={<ProductCompositorSurface cornerRadius={999} />}
    controlsLabels={canvasControlLabels}
/>;
```

For direct Prime tables, map `value` to `data`. Replace `size='small'`, `stripedRows`, and `Column align` with product classes through `DataTableParts` / `Column` body and header classes. Stop and keep an application-owned or Prime table when the surface requires grouping, row expansion, or controlled lazy/server sorting that `DataTableCore` does not claim to provide. Move Prime `Column` imports used inside `DataPage` to the Cratis marker independently from those advanced tables.

Removing Prime UI imports is not the same as removing a deliberate Prime schema/prototype catalog. If a product keeps Prime metadata generation or a PrimeReact prototype workspace, Prime remains an intentional tooling/product dependency and must be versioned and licensed on that basis even after application screens migrate.

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

`Tooltip` now enhances the actual trigger so focus, hover, and `aria-describedby` stay on one element. Its `children` contract is one React element rather than an arbitrary node list. Wrap text, fragments, multiple siblings, or conditional content in one appropriate native control before passing it to `Tooltip`. `className` is merged onto that trigger instead of an extra wrapper.

```tsx
import { FaGear } from 'react-icons/fa6';
import { Tooltip } from '@cratis/components/Common';

<Tooltip content='Account settings'>
    <button type='button' aria-label='Account settings'>
        <FaGear aria-hidden='true' />
    </button>
</Tooltip>;
```

## Update tables

`DataTableCore` now renders semantic HTML. Query-backed paging remains owned by Arc.

- Sorting and filtering apply to the currently loaded page.
- Complete-result filtering and sorting are not automatic table state. Model them in query arguments and implement them in the server query before paging.
- `clientFiltering` remains temporarily accepted as a deprecated no-op so staged source migrations compile. Remove it: filtering is always scoped to the loaded page, and complete-result filtering belongs on the server before paging.
- Legacy `{ operator, constraints }` filter entries remain accepted. `operator: 'or'` matches any constraint; all other values match every constraint.
- `Column` remains the declarative column marker. Its selection-column contract is explicitly single-row (`selectionMode='single'`); the old `'multiple'` type advertised checkbox behavior that the implementation never provided. Build multiple selection as an explicit product interaction rather than relying on that removed value.
- Table styling uses `DataTableParts` and `data-cratis-part`.
- Server totals remain authoritative for the paginator.

Prime's built-in match-mode **string values** continue to work because Components implements the same common predicates directly. Replace the renderer constants with Cratis constants to remove the type dependency:

| Prime constant                | Cratis constant                       |
| ----------------------------- | ------------------------------------- |
| `FilterMatchMode.STARTS_WITH` | `DataTableFilterMatchMode.StartsWith` |
| `FilterMatchMode.CONTAINS`    | `DataTableFilterMatchMode.Contains`   |
| `FilterMatchMode.EQUALS`      | `DataTableFilterMatchMode.Equals`     |
| `FilterMatchMode.IN`          | `DataTableFilterMatchMode.In`         |
| `FilterMatchMode.DATE_BEFORE` | `DataTableFilterMatchMode.DateBefore` |
| `FilterMatchMode.DATE_AFTER`  | `DataTableFilterMatchMode.DateAfter`  |

Custom matcher registration is different: Prime `FilterService.register()` or an application helper around it does **not** populate the Components registry. Replace the registration and the constraint together:

```ts
import {
    DataTableFilterMatchMode,
    registerDataTableFilterMatcher,
    type DataTableFilterMeta,
} from '@cratis/components/DataTables';

const roleMatcher = registerDataTableFilterMatcher(
    'product.roleContains',
    (value, filter) =>
        String(value ?? '')
            .toLocaleLowerCase()
            .includes(String(filter ?? '').toLocaleLowerCase()),
);

const filters: DataTableFilterMeta = {
    name: { value: 'Morgan', matchMode: DataTableFilterMatchMode.Contains },
    role: { value: 'admin', matchMode: roleMatcher.matchMode },
};

// Call roleMatcher.unregister() when the owning integration is permanently removed.
```

A retained arbitrary match-mode string keeps source compatibility but does not register behavior. Unknown modes deliberately match nothing rather than silently applying the wrong predicate.

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

Complete PrimeIcons class strings remain usable where a component accepts the public `Icon` type, but Components no longer installs the font or adds a missing provider base class. A consumer that intentionally retains PrimeIcons must load its stylesheet and pass the complete class string. Prefer a React icon component or product-owned SVG. `DataPage.MenuItem.icon` remains a React component type rather than the shared `Icon` union.

## Verify the migration

1. Remove unused Prime dependencies and the PrimeUI license/provider configuration.
2. Import `tokens` and `styles`; choose the baseline `theme` or map product tokens.
3. Replace global Prime presets with Cratis tokens.
4. Update `pt` keys and CSS selectors to Cratis parts.
5. Replace direct Prime imports.
6. Exercise dialogs, filtered tables, dates, dropdowns, toasts, and steppers with keyboard-only navigation.
7. Verify light, dark, forced-colors, reduced-motion, and responsive layouts.
8. Run TypeScript, specs, Storybook, and the production build.
9. Import components from their explicit subpath rather than the root namespace; apply the mapping table under [Import from explicit subpaths](#import-from-explicit-subpaths), or run the codemod once it ships.

A TypeScript 6 application using `skipLibCheck: false` may see bounded upstream diagnostics from Pixi's `@webgpu/types` collision with TypeScript's built-in WebGPU declarations, from `@cratis/arc.react`'s published global JSX declarations, or under NodeNext from extensionless declaration imports in the current Arc and Fundamentals packages. Components validates every packed subpath without suppressing these diagnostics; exact versions, codes, affected subpaths, and removal conditions are documented under [Strict public-type validation](ui-foundation.md#strict-public-type-validation) and tracked in [#176](https://github.com/Cratis/Components/issues/176).

For the decision, trade-offs, and validation gates, read [UI foundation](ui-foundation.md). For the older 2.x → 3.x PrimeReact migration, see [Migrate from Components 2 to 3](migration-from-2.md).
