# @cratis/eslint-plugin-components

ESLint rules for projects that consume Cratis Components. Compose these on top of the
Cratis base config, [`@cratis/eslint-config`](https://www.npmjs.com/package/@cratis/eslint-config).

| Rule | What it does |
|---|---|
| `no-root-barrel-import` | Disallows importing from the `@cratis/components` root barrel. Use a subpath export (`@cratis/components/CommandDialog`, `@cratis/components/DataPage`, `@cratis/components/Toolbar`, …) — the root pulls the whole optional-peer-heavy surface and hides intent. |
| `no-primereact-dialog` | Disallows importing `Dialog` from `primereact/dialog`. Use `CommandDialog` from `@cratis/components/CommandDialog`, or `Dialog` from `@cratis/components/Dialogs` — the wrappers add Arc command binding, overlay/focus fixes, and theming. |
| `onbeforeexecute-must-return` | Requires an `onBeforeExecute` callback to return the command values. `onBeforeExecute` is a transformer — a body that can complete without returning executes the command with `undefined` (silent data loss). |
| `no-hooks-in-view-model` | Disallows React hooks (including generated Arc proxies' `.use()`) inside a view model class. View models must be plain, hook-free classes that receive injected abstractions. |

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

`onbeforeexecute-must-return` and `no-hooks-in-view-model` take no options.

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
