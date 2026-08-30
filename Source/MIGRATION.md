# Migrate from Components 3 to 4

Components 4 replaces the PrimeReact-backed Components 3 foundation with Components-owned markup, styling contracts, and public types. React Aria supplies selected interaction primitives internally. The current Components 4 manifest does not declare PrimeReact, PrimeIcons, PrimeUI, or PrimeUI themes as dependencies or peers; applications retaining direct imports keep their own package and license boundaries.

This is a major-version migration. Rendered markup, styling parts, provider configuration, date entry, root imports, and some deprecated props change.

:::note
An application that has not migrated remains on its Components 3 package profile, including the third-party dependencies declared by that version. Components `>=3 <4` is in maintenance/security-critical support while Components `>=4 <5` is the current candidate and migration target. Owners must decide and approve the Components 3 EOL date no later than 12 months after Components 4 GA. Components 4 does not provide a transparent Prime compatibility package. Its independently versioned `@cratis/components.mui`, `@cratis/components.primereact` (PrimeReact 11), and `@cratis/components.primereact10` adapters are optional and cover only the nine `common.*` presentation slots.
:::

The adapters do not replace complete Components widgets. Core continues to own Dialog, Dropdown, DatePicker, paginator, table, focus, overlay, selection, and keyboard behavior; an adapter only presents button, icon-button, text-input, text-area, checkbox, radio, switch, progress, and surface slots. Installing an adapter neither restores PrimeReact public APIs nor transfers key handling to the adapter.

## Recommended order, stop points, and rollback

1. Preserve the current source, package manifest, and lockfile as the rollback point, then run the existing Components 3 gates.
2. With installed Core still in the Components 3 **source** window (`>=3 <4`), preview and apply the root-namespace transform. Its subpath output works on Components 3 and 4. Re-run the Components 3 gates and checkpoint that import-only change.
3. Upgrade Core to the bounded Components 4 **target** window (`^4.0.0`), configure the provider and styles, then preview and apply the Button transform followed by the change-handler transform.
4. Stop after every nonzero result. Resolve every diagnostic and `TODO(cratis-codemod)`, run the gates, and checkpoint before continuing. Remove a direct Prime island only after its replacement and licensing boundary are verified.

The bounded Components 4 codemod package accepts the supported source or target window at preflight, but the order above avoids introducing Components 4-only props before Core is upgraded. A failed compatibility preflight scans and writes nothing. A transform refusal may annotate or migrate other independently safe syntax, so inspect the diff; restore the preceding checkpoint before retrying if an all-or-nothing rollback is required.

## Update dependencies

Use the commands for the application's package manager. Remove only Prime packages that were installed for Components and are no longer owned by a retained direct Prime island.

```bash
# npm
npm uninstall primereact primeicons @primereact/core @primereact/headless \
  @primereact/hooks @primereact/styles @primereact/types @primeuix/themes
npm install '@cratis/components@^4.0.0'

# pnpm
pnpm remove primereact primeicons @primereact/core @primereact/headless \
  @primereact/hooks @primereact/styles @primereact/types @primeuix/themes
pnpm add '@cratis/components@^4.0.0'

# Yarn
yarn remove primereact primeicons @primereact/core \
  @primereact/headless @primereact/hooks @primereact/styles @primereact/types \
  @primeuix/themes
yarn add '@cratis/components@^4.0.0'
```

Keep a Prime package only when your application still imports it directly. Migrate those imports separately; Components no longer supplies or requires them.

Applications using Canvas or PivotViewer must install `pixi.js@^8.20.0`, now an optional peer rather than a nested Components dependency. Align any existing direct Pixi dependency to the same compatible resolution so public `PIXI.Container` and pointer-event types come from one package instance. Applications using only non-Pixi subpaths do not need it.

The package declares an Arc peer range of `>=20.3.1 <23`. Conformance and all three renderer
adapters declare the final `@cratis/components >=4 <5` peer range, so each remains bounded to the
Components major whose renderer ABI and stable presentation profile it implements.

## Import from explicit subpaths

The canonical rule going forward: **the package root is setup-only; every component ships from its own subpath.**

```tsx
// Before — Components 3 root namespace (removed in Components 4)
import { Canvas } from '@cratis/components';

<Canvas.Canvas showControls>
    <Canvas.CanvasItem x={0} y={0}>
        Content
    </Canvas.CanvasItem>
</Canvas.Canvas>;
```

```tsx
// After — canonical subpath, named imports
import { Canvas, CanvasItem } from '@cratis/components/Canvas';

<Canvas showControls>
    <CanvasItem x={0} y={0}>
        Content
    </CanvasItem>
</Canvas>;
```

This is an intentional Components 4 breaking change. The package root now exposes setup APIs only; component namespaces no longer exist there. Every retained namespace maps mechanically: replace `import { X } from '@cratis/components'` with either an equivalent namespace import from the documented subpath, or named imports from that subpath. The removed renderer-only `Compatibility` namespace is the deliberate manual exception.

| Removed Components 3 root namespace | Components 4 subpath                                      | Namespace-preserving migration                                                      | Named migration                                                                    |
| ----------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `Canvas`                            | `@cratis/components/Canvas`                               | `import * as Canvas from '@cratis/components/Canvas'`                               | `import { Canvas, CanvasItem } from '@cratis/components/Canvas'`                   |
| `Chat`                              | `@cratis/components/Chat`                                 | `import * as Chat from '@cratis/components/Chat'`                                   | `import { ChatSidebar, ChatConversation } from '@cratis/components/Chat'`          |
| `CommandDialog`                     | `@cratis/components/CommandDialog`                        | `import * as CommandDialog from '@cratis/components/CommandDialog'`                 | `import { CommandDialog } from '@cratis/components/CommandDialog'`                 |
| `CommandStepper` †                  | `@cratis/components/CommandDialog` (namespace-preserving) | `import * as CommandStepper from '@cratis/components/CommandDialog'`                | `import { CommandStepper } from '@cratis/components/CommandStepper'`               |
| `CommandForm`                       | `@cratis/components/CommandForm`                          | `import * as CommandForm from '@cratis/components/CommandForm'`                     | `import { AutoCommandForm, InputTextField } from '@cratis/components/CommandForm'` |
| `Common`                            | `@cratis/components/Common`                               | `import * as Common from '@cratis/components/Common'`                               | `import { Button } from '@cratis/components/Common'`                               |
| `Compatibility` ††                  | No Components 4 subpath                                   | Manual migration required; the codemod refuses and exits nonzero                    | Replace Prime compatibility contracts with typed Cratis parts, then remove it      |
| `DataPage`                          | `@cratis/components/DataPage`                             | `import * as DataPage from '@cratis/components/DataPage'`                           | `import { DataPage, Column } from '@cratis/components/DataPage'`                   |
| `DataTables`                        | `@cratis/components/DataTables`                           | `import * as DataTables from '@cratis/components/DataTables'`                       | `import { DataTableForQuery, Column } from '@cratis/components/DataTables'`        |
| `Dialogs`                           | `@cratis/components/Dialogs`                              | `import * as Dialogs from '@cratis/components/Dialogs'`                             | `import { Dialog } from '@cratis/components/Dialogs'`                              |
| `Display`                           | `@cratis/components/Display`                              | `import * as Display from '@cratis/components/Display'`                             | `import { Tag, Badge } from '@cratis/components/Display'`                          |
| `Dropdown`                          | `@cratis/components/Dropdown`                             | `import * as Dropdown from '@cratis/components/Dropdown'`                           | `import { Dropdown } from '@cratis/components/Dropdown'`                           |
| `Filter`                            | `@cratis/components/Filter`                               | `import * as Filter from '@cratis/components/Filter'`                               | `import { FilterPanel } from '@cratis/components/Filter'`                          |
| `Notifications`                     | `@cratis/components/Notifications`                        | `import * as Notifications from '@cratis/components/Notifications'`                 | `import { Toaster, toast } from '@cratis/components/Notifications'`                |
| `ObjectContentEditor`               | `@cratis/components/ObjectContentEditor`                  | `import * as ObjectContentEditor from '@cratis/components/ObjectContentEditor'`     | `import { ObjectContentEditor } from '@cratis/components/ObjectContentEditor'`     |
| `ObjectNavigationalBar`             | `@cratis/components/ObjectNavigationalBar`                | `import * as ObjectNavigationalBar from '@cratis/components/ObjectNavigationalBar'` | `import { ObjectNavigationalBar } from '@cratis/components/ObjectNavigationalBar'` |
| `PivotViewer`                       | `@cratis/components/PivotViewer`                          | `import * as PivotViewer from '@cratis/components/PivotViewer'`                     | `import { PivotViewer } from '@cratis/components/PivotViewer'`                     |
| `SchemaEditor`                      | `@cratis/components/SchemaEditor`                         | `import * as SchemaEditor from '@cratis/components/SchemaEditor'`                   | `import { SchemaEditor } from '@cratis/components/SchemaEditor'`                   |
| `TimeMachine`                       | `@cratis/components/TimeMachine`                          | `import * as TimeMachine from '@cratis/components/TimeMachine'`                     | `import { TimeMachine, EventsView } from '@cratis/components/TimeMachine'`         |
| `Toolbar`                           | `@cratis/components/Toolbar`                              | `import * as Toolbar from '@cratis/components/Toolbar'`                             | `import { Toolbar, ToolbarButton } from '@cratis/components/Toolbar'`              |
| `Types`                             | `@cratis/components/types`                                | `import * as Types from '@cratis/components/types'`                                 | `import { JsonSchema, Json } from '@cratis/components/types'`                      |

† The removed root `CommandStepper` namespace aliased the _entire_ `CommandDialog` module. The codemod therefore maps that namespace to `@cratis/components/CommandDialog`, preserving the correct module identity for members retained in Components 4. It does not restore removed accidental exports such as `CommandStepperContent`. New code that needs only the standalone component should use the narrower named import from `@cratis/components/CommandStepper`.

†† Components 3.6 also exported the `Compatibility` namespace and its pass-through helpers directly from the root. Components 4 has no destination for `Compatibility`, `assertPrimeReact11PassThroughCompatibility`, `components3PrimeReact11PassThroughContract`, `PrimeReact11PassThroughComponent`, `primeReact11PassThroughSentinelAttribute`, or `primeReact11PassThroughSentinelPreset`. The codemod recognizes these known removals, leaves their statement unchanged, and exits nonzero with typed-parts guidance.

The Components 3.6 `Chat` namespace maps to `@cratis/components/Chat`; its public models, sidebar, conversation, observable-query wrapper, mentions, and emoji contracts remain on that subpath.

`@cratis/components/CommandForm/fields` is the same module as `@cratis/components/CommandForm` — either subpath resolves identically, so the `CommandForm` row's migration applies to both. Provider/configuration/message setup stays on the package root; only Common components such as `Button` move to `@cratis/components/Common`.

Run the migration codemod in preview mode first, then apply it:

```bash
TOOLING_RANGE='^4.0.0'
npx --package "@cratis/components-codemods@$TOOLING_RANGE" \
  cratis-components-remove-root-namespace-imports --check path/to/app/src
npx --package "@cratis/components-codemods@$TOOLING_RANGE" \
  cratis-components-remove-root-namespace-imports path/to/app/src
```

Components 3 has no matching 3.x codemod train. Use the bounded Components 4 tooling range (`>=4 <5`; `^4.0.0` above is the shell-safe equivalent). Never substitute `latest`. Tooling patches release independently from Core. Before scanning or writing, every codemod validates its bundled compatibility manifest, its own version, and the installed Components package from the invocation directory. It fails closed when Components is absent, outside the supported 3.x source or 4.x target window, or the manifest is invalid.

The examples use npm's `npx`. pnpm and Yarn 2+ can launch the same bounded package without adding it:

```bash
pnpm dlx --package "@cratis/components-codemods@$TOOLING_RANGE" \
  cratis-components-remove-root-namespace-imports --check path/to/app/src
yarn dlx --package "@cratis/components-codemods@$TOOLING_RANGE" \
  cratis-components-remove-root-namespace-imports --check path/to/app/src
```

Quote real paths containing spaces. Do not type angle-bracket placeholders in a shell: `<...>` means input redirection.

The codemod scans JavaScript/JSX and TypeScript/TSX (including `.mjs`, `.cjs`, `.mts`, and `.cts`), preserves aliases and type-only imports, splits mixed setup/namespace imports, and rewrites a named `export { X } from '@cratis/components'` re-export the same way as the matching import. It reports unsupported cases without guessing: default or whole-package namespace imports, TypeScript `import = require(...)` assignments, dynamic imports, CommonJS `require(...)`, wildcard or whole-package re-exports (`export * from '@cratis/components'` / `export * as X from '@cratis/components'`), side-effect imports, and unknown symbols. Review its diagnostics, then run the consuming project's lint, build, and tests.

### Migrate Button appearance and change callbacks

Run the root-import codemod above first. The Button and callback codemods resolve Components-owned identifiers from explicit subpaths, so the authoritative order is:

1. `cratis-components-remove-root-namespace-imports`
2. `cratis-components-button-variant-tone`
3. `cratis-components-change-handler`

Use the bounded Components 4 tooling train and preview each transform before applying it:

```bash
TOOLING_RANGE='^4.0.0'

npx --package "@cratis/components-codemods@$TOOLING_RANGE" \
  cratis-components-button-variant-tone --check path/to/app/src
npx --package "@cratis/components-codemods@$TOOLING_RANGE" \
  cratis-components-button-variant-tone path/to/app/src

npx --package "@cratis/components-codemods@$TOOLING_RANGE" \
  cratis-components-change-handler --check path/to/app/src
npx --package "@cratis/components-codemods@$TOOLING_RANGE" \
  cratis-components-change-handler path/to/app/src
```

Keep the tooling range within `>=4 <5`; never use `latest`. The codemod preflight enforces the bundled source/target support windows.

The Button transform preserves the legacy `link` → `text` → `outlined` → `solid` precedence and maps literal props to `variant`, `tone`, and `shape`. Existing literal new props win:

```tsx
// Before
<Button outlined rounded severity='warn'>Review</Button>
<Button variant='ghost' text severity='danger'>Cancel</Button>

// After
<Button variant='outline' shape='pill' tone='caution'>Review</Button>
<Button variant='ghost' tone='critical'>Cancel</Button>
```

`secondary` and `contrast` map to `neutral`; `info` and `help` to `accent`; `success` to `positive`; `warn` to `caution`; and `danger` to `critical`. `contrast` adds `variant='solid'` only when no explicit or stronger legacy variant applies.

The callback transform rewrites only structurally-proven single forwarding callbacks on affected Components-owned Dropdown and CommandForm controls:

```tsx
// Before
<Dropdown onChange={(event) => setRole(event.value)} />
<InputTextField onChange={(event) => setName(event.target.value)} />
<CheckboxField onChange={({ target: { checked } }) => setEnabled(checked)} />

// After
<Dropdown onChange={(value) => setRole(value)} />
<InputTextField onChange={(value) => setName(value)} />
<CheckboxField onChange={(value) => setEnabled(value)} />
```

Dynamic Button props, JSX spreads, unknown new/legacy conflicts, duplicate props, multi-use callbacks, and native-event-dependent callbacks are not guessed. They stay semantically unchanged, produce a nonzero exit, and receive one syntax-safe `TODO(cratis-codemod)` annotation:

```tsx
// Manual review required
<Button text={appearance.text} severity={appearance.severity} />
<Dropdown onChange={(event) => {
    audit(event.originalEvent);
    setRole(event.value);
}} />
```

Review every diagnostic and `TODO(cratis-codemod)` before removing the compatibility props. Then run the application's formatter, lint, type check, tests, and production build. Both codemods are idempotent, include their own TypeScript compiler, support `--package`, require Node.js 20 or newer, and recursively scan `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.mts`, and `.cts` files.

Install the bounded Components 4 ESLint train after migration and compose its recommended config after `@cratis/eslint-config`; `no-root-barrel-import` prevents component namespaces from returning. ESLint patches release independently from Core:

```bash
TOOLING_RANGE='^4.0.0'
npm install --save-dev "@cratis/eslint-plugin-components@$TOOLING_RANGE"
```

See the `@cratis/eslint-plugin-components` README included with that package for the flat-config example and the other Components consumer rules.

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
                toolbar: {
                    label: 'Verktøy',
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

An audit of the package `exports` map ([#173](https://github.com/Cratis/Components/issues/173)) found implementation-only symbols that were unintentionally reachable from a public subpath — each was exported only because the owning module's barrel used a blanket `export *`, not because it was a supported contract. Components 4 stops re-exporting them from their public barrel; the underlying files keep the symbol for their own internal cross-file use, so this is a package-export change only, not a behavior change.

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

None of these had a documented contract, and none is required by any other public API in this package. An application that imported one of these directly has no documented replacement to migrate to — inline the equivalent logic, or open an issue describing the use case if the behavior should become a supported public contract.

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

For a product-owned design system, remove `styledMode`, `ProductPreset`, Prime locale types, and the PrimeUI license from the Components provider. Keep `--product-*` as the canonical tokens and map them directly to `--cratis-*`. If the product still imports Prime directly, retain a separate Prime provider, preset, dependencies, and license until those imports are removed. PrimeReact 11 receives its license directly — `<PrimeReactProvider license={primeUiLicense}>` — not through the `value={{ license }}` shape used by `CratisComponentsProvider`. The provider scopes runtime context, not CSS: a Prime theme imported from JavaScript remains document-global, so keep it in the smallest host entry point that owns the island and track every retained island's owner, licensing/theme dependencies, and removal condition. Migrate custom filters from `registerMatcher` to `registerDataTableFilterMatcher`, use the returned `matchMode` in each constraint, and use `resolveDataTableFilterMatcher` when a test or application-owned adapter must verify the live registered predicate.

A Components 2 / PrimeReact 10 product can migrate directly to Components 4 without an intermediate Prime 11 conversion. Keep its Prime 10 provider/theme for direct Prime surfaces, mount Components independently, move `DataPage` children to the Cratis `Column`, and migrate direct controls in batches.

A Components 3 / PrimeReact 11 product can start with the Components baseline theme while keeping a separate licensed Prime provider. Retain application-owned grouped/lazy tables and ordinary action rows when Components does not claim those behaviors.

For a product-owned compositor, replace renderer part types with `DialogParts`, `StepperParts`, and the complete Toolbar part family: `ToolbarParts`, `ToolbarButtonParts`, `ToolbarGroupParts`, `ToolbarSeparatorParts`, `ToolbarLayoutParts`, `ToolbarSectionParts`, `ToolbarFolderParts`, and `ToolbarFanOutParts`. Keep shaders and measurement wrappers product-owned. Measure stable `data-cratis-part` and state boundaries; pass the integrated Canvas surface through `controlsGlassSurface`; pass `data-product-compositor-*` marker names through `captureAttributes`; and localize actions through `controlsLabels`.

This migration guide records the current mappings and stop conditions for each archetype.

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
- `showTime` and `hourFormat` remain in the current API.

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
9. Import components from their explicit subpath rather than the removed root namespace; apply the mapping table under [Import from explicit subpaths](#import-from-explicit-subpaths), or run the migration codemod.

A TypeScript 6 application using `skipLibCheck: false` may see bounded upstream diagnostics from Pixi's `@webgpu/types` collision with TypeScript's built-in WebGPU declarations, from `@cratis/arc.react`'s published global JSX declarations, or under NodeNext from extensionless declaration imports in the current Arc and Fundamentals packages. Components validates every packed subpath without suppressing these diagnostics; exact versions, codes, affected subpaths, and removal conditions are recorded in the owning repository at `Documentation/ui-foundation.md#strict-public-type-validation` and tracked in [#176](https://github.com/Cratis/Components/issues/176).

For the current decision, trade-offs, and validation gates, read `Documentation/ui-foundation.md` in the owning repository. The older 2.x → 3.x path remains in `Documentation/Migration/2-to-3.md`.

Open issues may track adjacent gaps, but they do not establish a public roadmap, support window, stable-release date, or compatibility promise for Components 4.
