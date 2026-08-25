# @cratis/eslint-plugin-components

ESLint rules for projects that consume Cratis Components. Compose these on top of the
Cratis base config, [`@cratis/eslint-config`](https://www.npmjs.com/package/@cratis/eslint-config).

| Rule | What it does |
|---|---|
| `no-root-barrel-import` | Disallows importing from the `@cratis/components` root barrel. Use a subpath export (`@cratis/components/CommandDialog`, `@cratis/components/DataPage`, `@cratis/components/Toolbar`, …) — the root pulls the whole optional-peer-heavy surface and hides intent. |
| `no-primereact-dialog` | Disallows importing `Dialog` from `primereact/dialog`. Use `CommandDialog` from `@cratis/components/CommandDialog`, or `Dialog` from `@cratis/components/Dialogs` — the wrappers add Arc command binding, overlay/focus fixes, and theming. |
| `onbeforeexecute-must-return` | Requires an `onBeforeExecute` callback to return the command values. `onBeforeExecute` is a transformer — a body that can complete without returning executes the command with `undefined` (silent data loss). |
| `no-hooks-in-view-model` | Disallows React hooks (including generated Arc proxies' `.use()`) inside a view model class. View models must be plain, hook-free classes that receive injected abstractions. |
| `no-raw-command-form-marker` | Disallows identifying a CommandForm field or column by a hand-written `displayName` string, in either direction. Use `markAsCommandFormField`/`markAsCommandFormColumn` and `isCommandFormField`/`isCommandFormColumn` from `@cratis/components/CommandForm` — they go through a marker a build transform cannot rewrite. |

The two import rules cover `import` and re-`export … from` forms.

## Install

```sh
yarn add -D @cratis/eslint-plugin-components @cratis/eslint-config eslint
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
    allow: [],                          // exact specifiers to permit
}],
'@cratis/components/no-primereact-dialog': ['error', {
    source: 'primereact/dialog',        // module to forbid
}],
```

`onbeforeexecute-must-return`, `no-hooks-in-view-model` and `no-raw-command-form-marker` take no options.

## Considered and rejected: a hardcoded-owned-label rule

During the issue #174 localization pass, a static rule flagging a hardcoded English literal that
bypasses `CratisComponentsProvider` messages (e.g. a `title`/`aria-label` string sitting next to an
already-localized prop) was considered and rejected. Every rule above is a syntactic, structural
pattern an AST visitor resolves unambiguously (an import specifier, a known display-name
constant, a callback's control-flow shape). Detecting an *owned-label bypass* instead requires
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

### `onbeforeexecute-must-return`

`onBeforeExecute` (on `CommandDialog`, `StepperCommandDialog`, `CommandScope`, …) is a
**transformer**: it receives the current command values and must **return** them (mutated or
not). A callback that returns nothing runs the command with `undefined` — every field is
wiped at submit time. TypeScript catches this at fully-typed call sites; this rule is the
backstop for JavaScript and loosely-typed consumers.

```tsx
// ✅ returns the values
<CommandDialog onBeforeExecute={values => { values.id = Guid.create(); return values; }} />
<CommandDialog onBeforeExecute={values => values} />

// ❌ side-effect only — command executes with undefined
<CommandDialog onBeforeExecute={values => { values.id = Guid.create(); }} />
// ❌ bare return
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
    load() { const [authors] = AllAuthors.use(); }   // flagged
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
*diagnostic* name, a routine target for build tooling. Storybook's
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
if (component.displayName === 'CommandFormField') { wrap(component); }

// ✅ marker first, legacy displayName still set and still honoured
import { markAsCommandFormField, isCommandFormField } from '@cratis/components/CommandForm';

markAsCommandFormField(MyField);
if (isCommandFormField(component)) { wrap(component); }
```

Flagged in both directions: assignment (`C.displayName = '…'`, including computed and
object-literal forms) and comparison (`===`, `!==`, either operand order). Referring to the
exported `CommandFormFieldDisplayName` / `CommandFormColumnDisplayName` constants is not
flagged, so the declarations themselves and any deliberate legacy-path code stay clean.
Prefer `asCommandFormField` from `@cratis/arc.react` where it applies — it marks for you.
