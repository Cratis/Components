# AutoCommandForm

`AutoCommandForm` generates its field list from the command's own properties instead of you writing one field per property by hand. Each property's type picks its field component through a registry - `string` gets `InputTextField`, `number` gets `NumberField`, `boolean` gets `CheckboxField`, `Date` gets `CalendarField`, scalar `Guid` gets [GuidField](guid-field.md) - the same components you would otherwise use directly.

## Requirements

Use matching `@cratis/arc` and `@cratis/arc.react` versions in the supported range `>=22.19.1 <23`. Generated fields rely on explicit property-name binding, and Guid validation relies on Arc's native custom-field-error execution guard and live error lookup. Earlier versions can misbind generated fields or allow invalid optional Guid drafts to submit.

## Usage

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { AutoCommandForm } from '@cratis/components/CommandForm';

<CommandDialog command={RegisterProject} visible={visible} onCancel={() => setVisible(false)}>
    <AutoCommandForm command={RegisterProject} exclude={['projectId']} />
</CommandDialog>
```

A property whose type has no registered provider - a nested object, an array, an enum - is left out of the generated list. Add it as a hand-written `CommandForm` field alongside `AutoCommandForm`, or register a provider for it (see below).

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `command` | `Constructor<TCommand>` | — | **Required.** The command type to generate fields for. |
| `exclude` | `(keyof TCommand)[]` | — | Property names to leave out of the generated field list. |
| `footer` | `React.ReactNode` | — | Optional content after the generated fields, inside the native Arc form and command context. |

`AutoCommandForm` also accepts every other `CommandForm` prop (`initialValues`, `populateFromQuery`, `onSuccess`, `validateOn`, and so on) except `children`, which it generates itself.

## Adding an action inside the form

The default remains fields-only. Supply `footer` to add content or a native submit control:

```tsx
import { AutoCommandForm } from '@cratis/components/CommandForm';
import { SampleCommand } from './SampleCommand';

<AutoCommandForm
    command={SampleCommand}
    footer={<button type='submit'>Submit</button>}
/>
```

The button submits Arc's existing form; it does not create a second command or executor.
A component placed in `footer` can use Arc's `useCommandFormContext` for execution and
authorization state. `footer` takes React content, not a render callback, and adds no wrapper
or DOM-prop forwarding. Authorization and validation behavior remain Arc's responsibility.

## Registering a field type provider

The built-in providers cover `string`, `number`, `boolean`, `Date` and scalar Fundamentals `Guid`. Guid arrays are not handled. Register your own for any other property type - a Cratis concept, an enum, a custom value object - with `registerFieldTypeProvider`:

```tsx
import { registerFieldTypeProvider } from '@cratis/components/CommandForm';
import { DropdownField } from '@cratis/components/CommandForm';
import { Status } from './Status';

registerFieldTypeProvider({
    canHandle: propertyDescriptor => propertyDescriptor.type === Status,
    component: DropdownField
});
```

Register once, at module load, before any `AutoCommandForm` renders. Providers are consulted most-recently-registered first, so registering a provider for a type the built-in defaults already cover - `string`, say - overrides that default.

## Behavior

- Field titles are generated from the property name by splitting on capitals and uppercasing the first letter (`dueDate` becomes "Due Date"); there is no way to override an individual generated field's title other than excluding it and writing that one field by hand.
- Arc derives `required` from the property descriptor's `isOptional` when no explicit field override is present. An optional empty Guid has no format error; an empty required Guid is invalid.
- Guid edits use `Guid.isGuid` and `Guid.parse`, never generate an identifier, and impose no version or nonzero restriction. Invalid drafts clear the bound value immediately instead of retaining an older identifier. A changed `currentValues` Guid overlay also resets its draft; see [Guid reset behavior](guid-field.md#clearing-and-resetting).
- Each generated field binds to its descriptor's property name; editing one property leaves the other properties unchanged.
- Every generated field participates in `CommandForm`'s validation, change tracking and initial-value population exactly as a hand-written field does - `AutoCommandForm` only decides *which* fields to render, not how they behave once rendered.
