# @cratis/eslint-plugin-components

ESLint rules for projects that consume Cratis Components. Compose these on top of the
Cratis base config, [`@cratis/eslint-config`](https://www.npmjs.com/package/@cratis/eslint-config).

| Rule                          | What it does                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-root-barrel-import`       | Disallows importing a removed Components 3 component namespace from the Components 4 setup-only root. Use the exact component subpath (`@cratis/components/CommandDialog`, `@cratis/components/DataPage`, `@cratis/components/Toolbar`, …). Package-wide provider/configuration symbols remain allowed at the root; an unambiguous namespace violation is autofixed. |
| `no-primereact-dialog`        | Disallows importing `Dialog` from `primereact/dialog`. Use `CommandDialog` from `@cratis/components/CommandDialog`, or `Dialog` from `@cratis/components/Dialogs` — the wrappers add Arc command binding, overlay/focus fixes, and theming.                                                                                                                          |
| `onbeforeexecute-must-return` | Requires an `onBeforeExecute` callback to return the command values. The runtime guards a missing return by keeping the current object and warning, but a replacement value is discarded and the callback violates the transformer contract.                                                                                                                         |
| `no-hooks-in-view-model`      | Disallows React hooks (including generated Arc proxies' `.use()`) inside a view model class. View models must be plain, hook-free classes that receive injected abstractions.                                                                                                                                                                                        |
| `no-raw-command-form-marker`  | Disallows identifying a CommandForm field or column by a hand-written `displayName` string, in either direction. Use `markAsCommandFormField`/`markAsCommandFormColumn` and `isCommandFormField`/`isCommandFormColumn` from `@cratis/components/CommandForm` — they go through a marker a build transform cannot rewrite.                                            |
| `no-react-in-kernel`          | Repository architecture rule that rejects React, React DOM, React Aria Components, and browser DOM globals in the explicit Components kernel inventory. It is intentionally not part of the consumer `recommended` config.                                                                                                                                        |

Both import rules cover static `import` and re-`export … from` forms. The root-barrel rule also reports TypeScript `import = require(...)`, dynamic `import(...)`, and CommonJS `require(...)` of the package root; ambiguous forms are never autofixed.

## Install

Use the independently released Components 4 tooling train bounded to `>=4 <5`. Never use
`latest`; plugin patches can release independently from Components Core:

```sh
TOOLING_RANGE='^4.0.0' # Shell-safe equivalent of >=4 <5.
yarn add -D "@cratis/eslint-plugin-components@$TOOLING_RANGE" \
  @cratis/eslint-config eslint
```

## Use

```js
// eslint.config.mjs
import cratis from '@cratis/eslint-config';
import components from '@cratis/eslint-plugin-components';

export default [
    ...cratis.configs.consumer,
    ...components.configs.recommended,
    // …your project rules
];
```

### Options

```js
'@cratis/components/no-root-barrel-import': ['error', {
    packageName: '@cratis/components',  // barrel to forbid
    allow: [],                          // exact specifiers to permit wholesale
}],
'@cratis/components/no-primereact-dialog': ['error', {
    source: 'primereact/dialog',        // module to forbid
}],
```

`onbeforeexecute-must-return`, `no-hooks-in-view-model` and `no-raw-command-form-marker` take no options.

`no-react-in-kernel` is a repository-owned architecture guard and is not enabled by the consumer preset. Components configures it with the canonical inventory in `lib/kernelBoundary.js`; an explicit `kernelPaths` array may be supplied when testing or applying the rule to another owned tree.

## Repository kernel boundary

`no-react-in-kernel` applies only when the linted filename is one of the explicitly declared `kernelPaths`. It reports static imports and re-exports, TypeScript import assignments, dynamic imports, CommonJS `require(...)`, package subpaths, and browser DOM global references. Near-miss package names and files outside the inventory are left alone. The repository decision and exact included/excluded modules are documented in `Documentation/decisions/0003-kernel-boundary.md`.

## Considered and rejected: a hardcoded-owned-label rule

During the issue #174 localization pass, a static rule flagging a hardcoded English literal that
bypasses `CratisComponentsProvider` messages (e.g. a `title`/`aria-label` string sitting next to an
already-localized prop) was considered and rejected. Every rule above is a syntactic, structural
pattern an AST visitor resolves unambiguously (an import specifier, a known display-name
constant, a callback's control-flow shape). Detecting an _owned-label bypass_ instead requires
understanding which of a component's many string literals are user-facing chrome versus CSS class
names, `data-*` values, decorative glyphs, or genuinely correct per-instance defaults — a semantic
judgment call, not a syntactic one. A rule broad enough to catch a real bypass (any string literal
passed to `title`/`aria-label`/`placeholder`/a `Tooltip`'s `content`) flags the large fraction of
those call sites that are already correct, and an allowlist narrow enough to avoid that noise stops
catching new bypasses the moment a new component or prop name is introduced — the allowlist would
need updating in lockstep with every future component, which defeats the purpose of a ratchet.
Render-time sentinel-provider specs (see
`Source/Common/for_CratisComponentsProvider/when_every_owned_label_is_overridden.tsx`) are the
reliable gate instead: they render each audited surface under a provider whose messages are all
unmistakable sentinel strings and assert the rendered label is the sentinel, never the English
default — a real behavioral check that a static rule cannot approximate without the same false-positive
cost. Revisit a lint rule if a narrower, high-confidence pattern emerges (for example, once every
owned-label prop follows one consistent naming and JSDoc convention).

## Rules

### `no-root-barrel-import`

Components 4 removes every component-family namespace from the package root. The rule keeps a fixed map from each Components 3 namespace to its Components 4 subpath, plus the exact setup allowlist that remains at the root:

- `CratisComponentsProvider`, `useCratisComponentsConfig`, `cratisDefaults`, and `mergeCratisComponentsConfig`;
- `CratisComponentsConfig`, `CratisComponentsProviderProps`, and `CratisComponentsMessages`;
- `CratisPaginatorMessages`, `CratisDatePickerMessages`, `CratisDropdownMessages`, `CratisDialogMessages`, `CratisStepperMessages`, `CratisNotificationsMessages`, `CratisDataTableMessages`, and `CratisColumnFilterMessages`.

```ts
// ✅ approved setup symbols stay at the root
import { CratisComponentsProvider } from '@cratis/components';

// ❌ a component namespace imported from the root barrel
import { Canvas } from '@cratis/components';

// ✅ the same namespace, imported from its subpath
import * as Canvas from '@cratis/components/Canvas';

// ❌ whole-package forms are ambiguous and reported without an autofix
import Components = require('@cratis/components');
const lazyComponents = await import('@cratis/components');
```

A single-namespace violation is autofixed to the namespace form shown above, preserving an alias (`Canvas as C`) and `import type` (`import type { Canvas } from '@cratis/components'` becomes `import type * as Canvas from '@cratis/components/Canvas'`, and a per-specifier `type` modifier is honored the same way). The historical `CommandStepper` namespace is mapped to `@cratis/components/CommandDialog`, because that root namespace exposed the complete CommandDialog module rather than only the narrower standalone stepper entry. A mixed import naming both a setup symbol and a namespace is split — the setup symbol stays imported from the root, the namespace moves:

```ts
// Before
import { CratisComponentsProvider, Canvas } from '@cratis/components';

// After (autofixed)
import { CratisComponentsProvider } from '@cratis/components';
import * as Canvas from '@cratis/components/Canvas';
```

The rule never guesses. Each of these is flagged with guidance but **not** autofixed:

- A namespace import of the whole package (`import * as Everything from '@cratis/components'`)
  — which subpath each later member access belongs to cannot be inferred from the import alone.
- A default import (`import Everything from '@cratis/components'`) — the package has no
  default export.
- A side-effect-only import (`import '@cratis/components'`) — there is no binding to infer a
  subpath from.
- A named import of a symbol that is neither an approved setup symbol nor a known namespace
  (for example a member that only exists _inside_ a namespace, not at the root) — the whole
  statement is left unfixed rather than partially migrated.
- Any `export … from '@cratis/components'` re-export form — flagged with the same subpath
  guidance, but re-exports are never autofixed.

A companion, standalone codemod applies the equivalent rewrite across a whole project in one
pass, and additionally autofixes a named `export { Canvas } from '@cratis/components'`
re-export the same way it autofixes the matching import — this rule flags every re-export
form with guidance but never autofixes any of them; see
[`@cratis/components-codemods`](https://www.npmjs.com/package/@cratis/components-codemods).

### `onbeforeexecute-must-return`

`onBeforeExecute` (on `CommandDialog`, `StepperCommandDialog`, `CommandScope`, …) is a
**transformer**: it receives the current command values and must **return** them (mutated or
not). A callback that returns nothing does not run the command with `undefined` — a runtime
guard (`applyBeforeExecute`) falls back to the current object and logs a `console.warn`.
In-place mutations may therefore remain, but a replacement object is discarded and the call
still violates the transformer contract. TypeScript catches this at fully typed call sites;
this rule is the static backstop for JavaScript and loosely typed consumers, so behavior never
relies on the fallback.

```tsx
// ✅ returns the values
<CommandDialog onBeforeExecute={values => { values.id = Guid.create(); return values; }} />
<CommandDialog onBeforeExecute={values => values} />

// ❌ replacement is discarded — the runtime falls back to `values` and warns
<CommandDialog onBeforeExecute={values => { const updated = { ...values, id: Guid.create() }; }} />
// ❌ bare return — same guarded fallback
<CommandDialog onBeforeExecute={values => { return; }} />
```

It flags JSX attribute (`onBeforeExecute={…}`), object property (`{ onBeforeExecute: … }`),
and variable (`const onBeforeExecute = …`) forms. It is a lint backstop, not a full
control-flow analysis: a callback that returns a value on some branches but can still fall
through is not flagged.

### `no-hooks-in-view-model`

A view model is plain TypeScript — it must never call React hooks. `react-hooks/rules-of-hooks`
does not reliably flag hooks called from **class methods**, so this rule fills the gap for
Cratis MVVM view models. Inject an abstraction (`IIdentityProvider`, `IMessenger`, a query
service) instead of calling a hook.

```ts
// ❌ generated Arc proxy hook inside a view model
class AuthorsViewModel {
    load() {
        const [authors] = AllAuthors.use();
    } // flagged
}

// ✅ inject the abstraction; call hooks only in the component
@injectable
class AuthorsViewModel {
    constructor(private readonly identity: IIdentityProvider) {}
}
```

A class is treated as a view model when it is registered via `withViewModel(...)`, decorated
with `@injectable`, or named `*ViewModel`. Both bare hooks (`useState`, `useIdentity`, …) and
proxy member hooks (`.use()`, `.useSuspense()`, `.useChangeStream()`) are flagged. Hooks
inside a nested non–view-model class are not.

### `no-raw-command-form-marker`

`CommandForm`, `CommandDialog` and `CommandStepper` decide which children are fields by
inspecting the child's component type. Historically that test was a single string
comparison against `displayName` — and `displayName` is React's public, writable
_diagnostic_ name, a routine target for build tooling. Storybook's
`reactDocgen: 'react-docgen-typescript'` setting rewrites it by default.

When it is rewritten, the child stops being recognized as a field: it renders with no
container, so no label, no bound value and no change handler. There is no error and no
warning, and every gate stays green.

The helpers go through an `isCommandFormField` / `isCommandFormColumn` marker that a rename
does not touch, while still setting and honoring the legacy `displayName` — so they are strictly
more permissive than the literal, never less. `@cratis/arc.react` marks and reads the same two
properties, and that shared shape is what carries the contract across the two packages.

```ts
// ❌ a build transform that rewrites displayName silently unbinds this field
MyField.displayName = 'CommandFormField';
if (component.displayName === 'CommandFormField') {
    wrap(component);
}

// ✅ marker first, legacy displayName still set and still honoured
import {
    markAsCommandFormField,
    isCommandFormField,
} from '@cratis/components/CommandForm';

markAsCommandFormField(MyField);
if (isCommandFormField(component)) {
    wrap(component);
}
```

Flagged in both directions: assignment (`C.displayName = '…'`, including computed and
object-literal forms) and comparison (`===`, `!==`, either operand order). Referring to the
exported `CommandFormFieldDisplayName` / `CommandFormColumnDisplayName` constants is not
flagged, so the declarations themselves and any deliberate legacy-path code stay clean.
Prefer `asCommandFormField` from `@cratis/arc.react` where it applies — it marks for you.
