---
title: Basic controls
description: Native Components-owned inputs, choices, icon actions, and semantic surfaces.
---

The `Common` subpath provides native basic controls for ordinary React state and browser forms. They expose real element refs, standard native attributes, semantic value callbacks, stable parts, and canonical state attributes without an Arc command binding.

```tsx
import {
    Checkbox,
    IconButton,
    Radio,
    Surface,
    Switch,
    TextArea,
    TextInput,
} from '@cratis/components/Common';

<Surface as='section' aria-label='Preferences'>
    <TextInput
        name='displayName'
        aria-label='Display name'
        defaultValue='Sample User'
        onChange={(value) => console.log(value)}
    />
    <TextArea name='notes' aria-label='Notes' />
    <Checkbox name='updates' value='email' label='Email updates' />
    <Radio name='frequency' value='daily' label='Daily' />
    <Switch name='notifications' value='enabled' label='Enable notifications' />
    <IconButton icon={<span aria-hidden='true'>+</span>} aria-label='Add preference' />
</Surface>
```

## API reference

| Component | Native element and ref | Semantic value | Stable parts | Canonical states |
| --- | --- | --- | --- | --- |
| `IconButton` | `button` / `HTMLButtonElement` | Uses `Button` click semantics | `root`, `spinner`, `icon`, `label` | `disabled`, `loading` on `root` |
| `TextInput` | `input` / `HTMLInputElement` | `string` | `root` | `disabled`, `invalid`, `readonly` |
| `TextArea` | `textarea` / `HTMLTextAreaElement` | `string` | `root` | `disabled`, `invalid`, `readonly` |
| `Checkbox` | `input[type=checkbox]` / `HTMLInputElement` | `boolean` | `root`, `input`, `box`, `indicator`, `label` | `selected`, `disabled`, `invalid`, `readonly` |
| `Radio` | one `input[type=radio]` / `HTMLInputElement` | `boolean` when checked | `root`, `input`, `box`, `indicator`, `label` | `selected`, `disabled`, `invalid`, `readonly` |
| `Switch` | `input[type=checkbox][role=switch]` / `HTMLInputElement` | `boolean` | `root`, `input`, `control`, `handle`, `label` | `selected`, `disabled`, `invalid`, `readonly` |
| `Surface` | `div`, `section`, or `article` / `HTMLElement` | none | `root` | none |

`IconButton` requires `aria-label` and delegates to `Button`; it does not add another button or interaction layer. It accepts the same semantic `variant`, `tone`, `shape`, `size`, `loading`, and `disabled` props as `Button`.

`TextInput` accepts the native text-like types `text`, `email`, `password`, `search`, `tel`, and `url`. `TextInput` and `TextArea` preserve native controlled (`value`) and uncontrolled (`defaultValue`) behavior.

`Radio` represents exactly one native option. Give related options the same `name`; the browser owns grouping. Components does not add radio-group state or keyboard orchestration.

## Change metadata

Each value control uses `ChangeHandler<T>`:

```ts
onChange?: (value: T, meta?: ChangeMeta) => void;
```

A user change supplies `{ source: 'user', nativeEvent }`, where `nativeEvent` is the real browser `Event`. The optional second argument keeps a one-argument callback, including a React state setter, directly assignable.

## Native forms and read-only choices

The controls preserve `name`, `value`, `form`, `checked`, `defaultChecked`, `value`, and `defaultValue` on the real native element. Uncontrolled controls therefore submit and reset through browser form behavior.

HTML does not define native read-only behavior for checkboxes and radios. `Checkbox`, `Radio`, and `Switch` keep a read-only selected control enabled so its `name` and `value` still submit, expose the canonical `data-readonly` state, and prevent user toggling. `Checkbox` and `Switch` additionally expose supported `aria-readonly` semantics; native radio does not allow that ARIA attribute. Use `disabled` instead when the control must be excluded from submission.

For progress UI, use `ProgressBar` and its existing `ProgressBarProps` contract from `@cratis/components/Display`; `Common` does not define a second progress component.
