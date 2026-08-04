# CommandForm

The `CommandForm` component provides form field components for building command input forms with automatic type handling and validation.

## Purpose

CommandForm offers a complete set of form field components designed to work seamlessly with Cratis Arc commands. It handles different data types, validation, and integration with command execution.

## Key Features

- Automatic field type detection
- Support for various input types (text, number, date, boolean, etc.)
- Built-in validation
- Integration with CommandDialog
- Type-safe field handling

## Available Field Components

The CommandForm module exports specialized field components built on [PrimeReact](https://primereact.org/) primitives. Each field wraps a PrimeReact component using `asCommandFormField`, providing automatic value binding, validation state, and integration with Cratis Arc commands.

See the field type pages in this section for documentation on each available field component.

## Type-Safe Binding

All field components bind to a property on the command via a `value` accessor function. Pass the command type as a generic type parameter so the accessor is fully typed:

```tsx
// ✅ Correct: full type safety — 'c' is typed as MyCommand
<InputTextField<MyCommand> value={c => c.title} />

// ❌ Incorrect: missing type parameter — 'c' is 'unknown'
<InputTextField value={c => c.title} />
```

The `value` prop accepts a function of the form `(instance: TCommand) => unknown`.

## Integration

CommandForm fields are used as children of `CommandDialog`:

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { InputTextField, NumberField, CheckboxField } from '@cratis/components/CommandForm';

<CommandDialog command={MyCommand} visible={visible} onCancel={() => setVisible(false)}>
    <InputTextField<MyCommand> value={c => c.title} />
    <NumberField<MyCommand> value={c => c.quantity} />
    <CheckboxField<MyCommand> value={c => c.active} label="Active" />
</CommandDialog>
```

## How a child is recognized as a field

`CommandForm`, `CommandDialog` and `CommandStepper` decide which of their children are
fields by inspecting the child's component type. A component is treated as a field when
it carries either of the following:

- the `CommandFormFieldMarker` symbol set to `true` — what `asCommandFormField` and
  `markAsCommandFormField` stamp; or
- the legacy `displayName` of `'CommandFormField'`, which is checked as a fallback and
  is supported indefinitely.

Columns work the same way, through `CommandFormColumnMarker` and `'CommandFormColumn'`.

> [!IMPORTANT]
> **`displayName` is load-bearing on field and column components — never overwrite it.**
> A child whose `displayName` has been replaced and that carries no marker is not
> recognized as a field: it renders without its container, so it gets no label, no bound
> value and no change handler. This fails silently — there is no error and no warning.

The marker exists so that this stops being fatal. Because it is a `Symbol.for` registry
key rather than a string property, a build-time transform that rewrites `displayName`
cannot reach it, and a field keeps working even after being renamed.

### Build tooling that rewrites `displayName`

The most common way to hit this is Storybook's
`reactDocgen: 'react-docgen-typescript'` setting, whose underlying plugin defaults
`setDisplayName` to `true` and appends `<Component>.displayName = "<ExportName>"` to
every module it processes. If you wrap fields of your own with `asCommandFormField`,
turn that off:

```ts
// .storybook/main.ts
typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
        setDisplayName: false
    }
}
```

### Writing a custom field

Prefer `asCommandFormField` from `@cratis/arc.react`, which marks the component for you.
To mark a component directly — when hand-rolling a field or a column — use the helpers:

```tsx
import { markAsCommandFormField } from '@cratis/components/CommandForm';

const MyField = (props: { value?: (c: MyCommand) => unknown }) => { /* ... */ };

markAsCommandFormField(MyField);
```

Both helpers set the marker *and* the legacy `displayName`, so a component marked this
way is recognized by every version of `@cratis/arc.react` within this package's
supported range.
