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

The CommandForm module exports Cratis-owned semantic fields built with native controls and accessible interaction behavior. Each field uses `asCommandFormField` for automatic value binding, validation state, and Arc command integration.

See the field type pages in this section for documentation on each available field component. To generate a form's fields from a command's own properties instead of writing them out by hand, see [AutoCommandForm](auto-command-form.md).

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
import {
    InputTextField,
    NumberField,
    CheckboxField,
} from '@cratis/components/CommandForm';

<CommandDialog command={MyCommand} visible={visible} onCancel={() => setVisible(false)}>
    <InputTextField<MyCommand> value={(c) => c.title} />
    <NumberField<MyCommand> value={(c) => c.quantity} />
    <CheckboxField<MyCommand> value={(c) => c.active} label='Active' />
</CommandDialog>;
```

## Populating Initial Values from a Query

Every field here is built with `asCommandFormField` from `@cratis/arc.react/commands`, so each one automatically supports `CommandForm`'s `populateFromQuery`/`populateFromObservableQuery` props - the form fetches a single-instance query itself and seeds its fields from the result, matched onto the command by property name:

```tsx
import { CommandForm } from '@cratis/arc.react/commands';
import { InputTextField } from '@cratis/components/CommandForm';
import { GetUserProfile } from './queries';
import { UpdateProfile } from './commands';

<CommandForm
    command={UpdateProfile}
    populateFromQuery={GetUserProfile}
    populateFromQueryArgs={{ userId }}
>
    <InputTextField<UpdateProfile> value={(c) => c.firstName} title='First name' />
    <InputTextField<UpdateProfile> value={(c) => c.lastName} title='Last name' />
</CommandForm>;
```

Two field props refine this per field - both work on every field type in this package, since they come from the shared `asCommandFormField` wrapper:

- `noInitialValue` - skip this field entirely, even if the query result has a same-named property.
- `initialValue` - override how the field's value is derived from the query result, either a property accessor matched by name or a function composing a value from the whole result.

See Arc's [Populating a Form from a Query](https://github.com/Cratis/Arc/blob/main/Documentation/frontend/react/command-form/data-loading.md) for the full behavior, including how the populated data becomes the form's change-tracking baseline.

## How a child is recognized as a field

`CommandForm`, `CommandDialog`, and `CommandStepper` inspect each child's component type. A field carries `isCommandFormField: true`; a column carries `isCommandFormColumn: true`. The legacy `displayName` values remain permanent fallbacks so independently versioned Components and Arc packages interoperate in either upgrade order.

Use `asCommandFormField` from `@cratis/arc.react/commands` for custom fields; it stamps the marker automatically. For a hand-rolled field or column, use `markAsCommandFormField` or `markAsCommandFormColumn` from `@cratis/components/CommandForm`.

The marker is a plain shared property rather than a package-private symbol, so a component marked by Arc is recognized by Components and vice versa. Build transforms may rewrite `displayName` without silently breaking binding.
