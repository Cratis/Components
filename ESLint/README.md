# @cratis/components.eslint

ESLint rules for projects that consume Cratis Components. Compose these on top of the
Cratis base config, [`@cratis/eslint-config`](https://www.npmjs.com/package/@cratis/eslint-config).

| Rule | What it does |
|---|---|
| `no-root-barrel-import` | Disallows importing from the `@cratis/components` root barrel. Use a subpath export (`@cratis/components/CommandDialog`, `@cratis/components/DataPage`, `@cratis/components/Toolbar`, …) — the root pulls the whole optional-peer-heavy surface and hides intent. |
| `no-primereact-dialog` | Disallows importing `Dialog` from `primereact/dialog`. Use `CommandDialog` from `@cratis/components/CommandDialog`, or `Dialog` from `@cratis/components/Dialogs` — the wrappers add Arc command binding, overlay/focus fixes, and theming. |

Both cover `import` and re-`export … from` forms.

## Install

```sh
yarn add -D @cratis/components.eslint @cratis/eslint-config eslint
```

## Use

```js
// eslint.config.mjs
import cratis from '@cratis/eslint-config';
import components from '@cratis/components.eslint';

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
