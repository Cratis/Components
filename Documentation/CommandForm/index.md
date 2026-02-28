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
import { CommandDialog } from '@cratis/components';
import { InputTextField, NumberField, CheckboxField } from '@cratis/components/CommandForm';

<CommandDialog command={MyCommand} visible={visible} onHide={() => setVisible(false)}>
    <InputTextField<MyCommand> value={c => c.title} />
    <NumberField<MyCommand> value={c => c.quantity} />
    <CheckboxField<MyCommand> value={c => c.active} label="Active" />
</CommandDialog>
```
