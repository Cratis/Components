---
title: AutoCommandForm
description: Generate a command form's fields from the command's property descriptors instead of writing one field per property.
---

`AutoCommandForm` generates its field list from the command's own properties instead of you writing one field per property by hand. Each property's type picks its field component through a registry - `string` gets `InputTextField`, `number` gets `NumberField`, `boolean` gets `CheckboxField`, `Date` gets `CalendarField` - the same components you would otherwise use directly.

## Requirements

Use `@cratis/arc` and `@cratis/arc.react` version 22.16.0 or later within the supported 22.x range. Each generated field names its property explicitly through `fieldName`, because its accessor reads the property dynamically. Arc versions before 22.16.0 ignore that name and infer the property from the accessor's source text instead, so every generated field resolves to the same property and an edit can land on the wrong one. The package's peer range still admits those older versions, so check the installed Arc version yourself.

The command must be a generated Arc command proxy: `AutoCommandForm` creates an instance of it and reads its `propertyDescriptors`.

## Usage

`AutoCommandForm` renders its own Arc `CommandForm`, so use it on its own and supply the submit control through `footer`:

```tsx
import { AutoCommandForm } from '@cratis/components/CommandForm';
import { RegisterProject } from './RegisterProject';

<AutoCommandForm
    command={RegisterProject}
    exclude={['projectId']}
    footer={<button type='submit'>Register</button>}
    onSuccess={() => console.log('Registered')}
/>;
```

The button submits Arc's form, which executes the command and runs the result callbacks. Because the fields are inside a native `<form>`, pressing `Enter` in a text field submits it too.

:::caution[Do not nest AutoCommandForm in a CommandDialog]
`CommandDialog`, `CommandStepper`, and `StepperCommandDialog` each create their own command instance. An `AutoCommandForm` placed inside them binds its fields to a second instance, so the values the user types never reach the command the dialog executes. Write the fields by hand inside those components.
:::

A property whose type has no registered provider - a nested object, an array, an enum - is left out of the generated list. Write the form by hand when that property needs a field, or register a provider for its type (see below).

A property you exclude, or one that has no provider, is still part of the command. If it is non-optional, seed it through `initialValues`, or the form stays invalid and the command's validation rejects the submit.

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

The built-in providers cover `string`, `number`, `boolean` and `Date`. Register your own for any other property type, or to override a default, with `registerFieldTypeProvider`. This one renders every `string` property as a multi-line `TextAreaField`:

```tsx
import { registerFieldTypeProvider, TextAreaField } from '@cratis/components/CommandForm';

registerFieldTypeProvider({
    canHandle: (propertyDescriptor) => propertyDescriptor.type === String,
    component: TextAreaField,
});
```

Register once, in module code that runs before any `AutoCommandForm` renders. Providers are consulted most-recently-registered first, so registering a provider for a type the built-in defaults already cover overrides that default.

`canHandle` receives the property's Arc `PropertyDescriptor` (`name`, `type`, `isOptional`, …). `AutoCommandForm` passes the provider's `component` only `fieldName`, `value`, and `title`. A field that needs more props, such as `DropdownField` with its required `options`, `optionValue`, and `optionLabel`, cannot be registered directly; write that property's field by hand instead.

## Behavior

- Field titles are generated from the property name by splitting on capitals and uppercasing the first letter (`dueDate` becomes "Due Date"); there is no way to override an individual generated field's title other than excluding it and writing that one field by hand.
- `AutoCommandForm` does not set `required` on the fields it generates. Whether a value is required is enforced by the command's own validation (every non-optional property must have a value), not by a field prop.
- Each generated field binds to its descriptor's property name; editing one property leaves the other properties unchanged.
- Every generated field participates in `CommandForm`'s validation, change tracking and initial-value population exactly as a hand-written field does - `AutoCommandForm` only decides *which* fields to render, not how they behave once rendered.
