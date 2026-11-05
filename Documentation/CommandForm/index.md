---
title: 'CommandForm: build command input in React'
description: Build React forms for Arc commands with fields that bind to command properties, show validation errors, and work in inline forms or dialogs.
---

Cratis Components' `CommandForm` module supplies input fields for Arc commands in React. Use these fields to collect command values and show validation errors in a page, dialog, or step-by-step form without writing a value binding for each input.

## Purpose

Arc's `CommandForm` owns the command instance, execution, and validation results. Components supplies the input controls and connects their accessible names and errors. Import the inline form container from `@cratis/arc.react/commands` and the fields from `@cratis/components/CommandForm`; they are separate parts of the same form.

Before building a command form, set up the providers, CSS, backend, and generated command proxies in [Getting started](../getting-started.mdx). If you want a complete add-author flow rather than a field reference, follow [Building a form](../building-a-form.md). A local controlled input does not need to execute an Arc command.

## Key Features

Choose explicit fields when you need control over their order, labels, or input type. Each field binds to a command property through a typed accessor and displays validation feedback from Arc.

When the command's metadata is enough to choose the inputs, [AutoCommandForm](auto-command-form.md) generates the field list instead. It reads property descriptors: runtime metadata that names each command property, its type, and whether it is optional. The same field controls work in inline forms, dialogs, and steppers.

## Available Field Components

The module exports Cratis-owned fields built with native controls. Each field uses Arc's `asCommandFormField` wrapper to connect its value, changes, and validation state to the command. Field pages describe their keyboard behavior, accessible names, and validation. For example, [GuidField](guid-field.md) lets a person edit a scalar Fundamentals `Guid` as text while keeping the command value a native `Guid`.

Import fields from `@cratis/components/CommandForm` or `@cratis/components/CommandForm/fields`; both subpaths resolve to the same module, so pick one and use it consistently.

Use the field pages in this section to choose the control for each property, or continue with [AutoCommandForm](auto-command-form.md) to generate them.

## Type-Safe Binding

All field components bind to a property on the command via a `value` accessor function. Pass the command type as a generic type parameter so the accessor is fully typed:

```tsx
// ✅ Correct: full type safety — 'c' is typed as MyCommand
<InputTextField<MyCommand> value={c => c.title} />

// ❌ Incorrect: missing type parameter — 'c' is 'unknown'
<InputTextField value={c => c.title} />
```

The `value` prop accepts a function of the form `(instance: TCommand) => unknown`. Arc infers the property name from an ordinary accessor such as `c => c.title`. For a dynamic accessor such as `c => c[propertyName]`, also supply `fieldName` so Arc can identify the property; this requires Arc 22.16.0 or later. Arc supplies the control's current value and change handler; you do not need separate React state for that input.

## Integration

CommandForm fields are children of Arc's `CommandForm` or of a Components command surface such as `CommandDialog`. The excerpt assumes `MyCommand` is a generated command proxy and `visible` / `setVisible` is component state:

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import {
    InputTextField,
    NumberField,
    CheckboxField,
} from '@cratis/components/CommandForm';

<CommandDialog<MyCommand>
    command={MyCommand}
    title='Edit item'
    visible={visible}
    onSuccess={() => setVisible(false)}
    onCancel={() => setVisible(false)}
>
    <InputTextField<MyCommand> value={(c) => c.title} title='Title' />
    <NumberField<MyCommand> value={(c) => c.quantity} title='Quantity' />
    <CheckboxField<MyCommand> value={(c) => c.active} label='Active' />
</CommandDialog>;
```

`title` is required on `CommandDialog`. Outside `useDialog`, close the dialog yourself from `onSuccess` and `onCancel`; see [CommandDialog](../CommandDialog/index.md#controlled-visibility).

## Choose the execution container

| Screen requirement | Use | Completion responsibility |
| --- | --- | --- |
| Input inside the current page | Arc `CommandForm` plus Components fields | The host decides what to show or navigate to after execution |
| One command in a modal | `CommandDialog` | Closes on success through `useDialog`, or through host callbacks in controlled mode |
| One command gathered across steps | `CommandStepper` or `StepperCommandDialog` | Keep required values and validation timing aligned across steps |

The dialog and stepper containers already create an Arc `CommandForm`. Put fields inside them, not another `CommandForm` or `AutoCommandForm`, which would create a separate form and command instance.

A field accessor selects a generated command member; it does not supply missing context such as a parent id. Set required hidden values through `initialValues` before validation. `onBeforeExecute` cannot repair a missing value that prevents reaching submit.

When checking the form, try an empty required field, a valid starting value, a server rejection, and a successful submission. If the form adds an item to an observable list, check command completion first, then the later query result. Command success alone does not insert a row into the list.

## Field defaults and command values

A displayed default is not a command value. For example, `CheckboxField` can look unchecked and `NumberField` can show `0` while the bound property remains unset. Each field page states its display default; the control writes a value to the command when the person edits it.

An unset non-optional property fails Arc's client validation, so the form stays invalid and `CommandDialog` keeps confirm disabled. If zero or false is the intended starting value, supply it through `initialValues`. That gives the command an actual value before anyone edits the input. See [Initialize command values](../CommandDialog/index.md#initialize-command-values).

## Accessible names and validation errors

Every Components field associates its primary native control or semantic group with Arc's `title` and validation messages:

- `title` becomes the default accessible name while Arc continues rendering the visible field title.
- Validation messages are referenced through `aria-describedby` and remain visible through Arc's normal error presentation.
- `id`, `aria-label`, and `aria-describedby` can override or extend the generated values on every field.
- Component-specific `pt` attributes remain fallback values; named accessibility props take precedence.

Checkboxes and switches prefer their inline `label`; radio options use their option labels while the `RadioGroupField` / `RatingField` group uses `title`.

## Populating Initial Values from a Query

For an edit form, let Arc load the starting values through `populateFromQuery` or `populateFromObservableQuery`. The form runs the query and matches result properties to command properties by name. Every field here supports this through `asCommandFormField`.

This excerpt assumes generated `GetUserProfile` and `UpdateProfile` proxies and a `userId` in scope. The query result and command both have `firstName` and `lastName` properties:

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

Use these shared field props when a field should not take the same-named value from the query:

- `noInitialValue` - skip this field entirely, even if the query result has a same-named property.
- `initialValue` - override how the field's value is derived from the query result, either a property accessor matched by name or a function composing a value from the whole result.

See Arc's [Populating a Form from a Query](https://www.cratis.io/arc/frontend/react/command-form/data-loading/) for the full behavior, including how the populated data becomes the form's change-tracking baseline.

## How a child is recognized as a field

`CommandForm`, `CommandDialog`, and `CommandStepper` inspect each child's component type. A field carries `isCommandFormField: true`; a column carries `isCommandFormColumn: true`. The legacy `displayName` values remain permanent fallbacks so independently versioned Components and Arc packages interoperate in either upgrade order.

Use `asCommandFormField` from `@cratis/arc.react/commands` for custom fields; it stamps the marker automatically. For a hand-rolled field or column, use `markAsCommandFormField` or `markAsCommandFormColumn` from `@cratis/components/CommandForm`.

The marker is a plain shared property rather than a package-private symbol, so a component marked by Arc is recognized by Components and vice versa. Build transforms may rewrite `displayName` without silently breaking binding.

Once you have chosen the fields, continue with [Building a form](../building-a-form.md) to connect them to a complete command flow, or [AutoCommandForm](auto-command-form.md) to generate the field list.
