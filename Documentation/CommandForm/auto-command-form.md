---
title: 'AutoCommandForm: generate command input fields'
description: AutoCommandForm generates React inputs from Arc command property descriptors, with a field type registry for choosing or replacing controls.
---

`AutoCommandForm` builds an input form from an Arc command's property descriptors, so you do not have to declare a field for every property. Use it when the command's types are enough to choose the controls; use explicit fields when you need individual labels, placement, or input-specific props.

A property descriptor names a command property, its runtime type, and whether it is optional. A registry matches each descriptor to a field component. The built-in mappings use the same controls you can declare by hand:

| Property type | Field |
| --- | --- |
| `string` | `InputTextField` |
| `number` | `NumberField` |
| `boolean` | `CheckboxField` |
| `Date` | `CalendarField` |

## Requirements

Use a generated Arc command proxy and `@cratis/arc` and `@cratis/arc.react` version 22.16.0 or later within the supported 22.x range. For provider setup, CSS, and proxy generation, follow [Getting started](../getting-started.mdx).

`AutoCommandForm` creates an instance of the command and reads its `propertyDescriptors`. Each generated field names its property through `fieldName` because its accessor reads the property dynamically. Arc versions before 22.16.0 ignore that name and infer it from the accessor's source text, causing the generated fields to resolve to the same property. An edit can then reach the wrong property. The package's peer range admits those older versions, so check the installed Arc version before using this component.

## Usage

Render `AutoCommandForm` as the form itself and put a submit control in `footer`. This excerpt assumes a generated `RegisterProject` proxy with a `projectId` property:

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

The button submits Arc's native `<form>`, which executes the command and runs the result callbacks. Pressing `Enter` in a text field submits it too. `AutoCommandForm` adds no submit control unless you supply one.

:::caution[Do not nest AutoCommandForm in a CommandDialog]
`CommandDialog`, `CommandStepper`, and `StepperCommandDialog` each create their own command instance. An `AutoCommandForm` placed inside them binds its fields to a second instance, so the values the user types never reach the command the dialog executes. Write the fields by hand inside those components.
:::

Fields appear in property-descriptor order, excluding the names in `exclude` and any descriptor without a matching provider. If a property is missing from the form, check its descriptor type and the registry. Nested objects and arrays have no built-in provider. You can register a provider for an unsupported type or use Arc's ordinary `CommandForm` with explicit fields for a custom layout. A manual field beside `AutoCommandForm` is outside its command context; appearing on the same page does not make it edit the same command.

Leaving out an editor does not remove the property from the command. If `projectId` in the example is non-optional, supply it through `initialValues` before validation. Do the same for any required property that has no provider. A number showing `0` or an unchecked checkbox also needs an initial value if that is the intended answer: display defaults do not populate the command.

For the distinction, read [Field defaults and command values](index.md#field-defaults-and-command-values), then [Initialize command values](../CommandDialog/index.md#initialize-command-values). Do not defer a required starting value to `onBeforeExecute` if invalid state keeps the submit control disabled.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `command` | `Constructor<TCommand>` | — | **Required.** The command type to generate fields for. |
| `exclude` | `(keyof TCommand)[]` | — | Property names to leave out of the generated field list. |
| `footer` | `React.ReactNode` | — | Optional content after the generated fields, inside the native Arc form and command context. |

The component also accepts the other Arc `CommandForm` props, including `initialValues`, `populateFromQuery`, `onSuccess`, and `validateOn`. It generates `children` itself. Use `initialValues` for the baseline and `currentValues` for an explicit overlay from the parent; changes to that overlay revalidate the command.

`exclude` only hides an editor. The command's validation requirements still apply, and the server remains responsible for authorizing submitted values.

## Adding an action inside the form

Use `footer` for content that needs to be inside the form, such as this submit button. The excerpt assumes a generated `SampleCommand` proxy:

```tsx
import { AutoCommandForm } from '@cratis/components/CommandForm';
import { SampleCommand } from './SampleCommand';

<AutoCommandForm
    command={SampleCommand}
    footer={<button type='submit'>Submit</button>}
/>
```

The button submits the existing form rather than creating a second command or executor. For a button that responds to execution, validity, or authorization state, put a child component in `footer` and read Arc's `useCommandFormContext` inside that component.

`footer` accepts React content, not a render callback. It adds no wrapper and does not forward DOM props. Arc still owns authorization and validation behavior.

## Registering a field type provider

Register a field type provider when a property type has no mapping or when you want to replace a built-in choice. This example makes every `string` property use a multi-line `TextAreaField`:

```tsx
import { registerFieldTypeProvider, TextAreaField } from '@cratis/components/CommandForm';

registerFieldTypeProvider({
    canHandle: (propertyDescriptor) => propertyDescriptor.type === String,
    component: TextAreaField,
});
```

For Fundamentals `Guid` properties, register the opt-in [GuidField](guid-field.md#registering-it-for-autocommandform) the same way; it is not a built-in default.

Register once, in module code that runs before any `AutoCommandForm` renders. Providers are consulted most-recently-registered first, so registering a provider for a type the built-in defaults already cover overrides that default.

`canHandle` receives the property's Arc `PropertyDescriptor`, with `name`, `type`, and `isOptional`. The generated field receives `fieldName`, `value`, and `title`; `GuidField` itself also receives `resetKey`.

Choose explicit fields if the control needs additional props. For example, `DropdownField` requires `options`, `optionValue`, and `optionLabel`, so it cannot be registered directly with no other configuration. Use an ordinary Arc `CommandForm` and declare that field with its options.

## Behavior

A property name becomes the field title by splitting on capitals and uppercasing the first letter: `dueDate` becomes "Due Date". For an individual title or custom placement, declare the fields in an ordinary Arc `CommandForm`. `exclude` does not create a place to insert a replacement editor.

`AutoCommandForm` does not pass a `required` prop. Arc's field wrapper derives required state from the descriptor's `isOptional` value, and the command validates its non-optional properties. Hiding an editor or changing its required treatment does not remove that validation.

Each generated field binds to its descriptor's property name, so editing one property leaves the others unchanged. The fields use Arc's validation, change tracking, and initial-value population just like explicit fields. `AutoCommandForm` chooses the field list; Arc owns the form behavior.

If generation no longer fits the interaction, return to [Choose the execution container](index.md#choose-the-execution-container) to build an inline form, dialog, or stepper with explicit fields.
