---
title: GuidField
description: Edit a scalar Fundamentals Guid property on an Arc command as text, with format and required errors.
---

`GuidField` is a native text input bound to a scalar `Guid`, `Guid | undefined`, or `Guid | null` property. It keeps the command value a native Fundamentals `Guid` and never writes a string. It is opt-in: [AutoCommandForm](auto-command-form.md) does not pick it for `Guid` properties until you register it.

## Requirements

`GuidField` imports and renders on every Arc version in the package's supported peer range. Refusing to submit an invalid draft relies on Arc's custom-field-error execution guard, so use matching `@cratis/arc` and `@cratis/arc.react` versions 22.19.1 or later. Earlier versions still show the format and required errors and still leave the command value empty for an invalid draft, but they do not refuse execution because of the field's error.

## Usage

Place the field inside Arc's `CommandForm` or a Components command dialog. The excerpt assumes `AssignSample` is a generated command proxy whose `sampleId` property is a native Fundamentals `Guid`, not a string.

```tsx
import { GuidField } from '@cratis/components/CommandForm';

<GuidField<AssignSample>
    value={(command) => command.sampleId}
    title='Sample identifier'
    placeholder='Enter a Guid'
/>
```

## Registering it for AutoCommandForm

`GuidField` is not one of the built-in providers. Register it once, in module code that runs before any `AutoCommandForm` renders, so every scalar `Guid` property gets the field:

```tsx
import { Guid } from '@cratis/fundamentals';
import { GuidField, registerFieldTypeProvider } from '@cratis/components/CommandForm';

registerFieldTypeProvider({
    canHandle: (propertyDescriptor) => propertyDescriptor.type === Guid,
    component: GuidField,
});
```

Without the registration, `Guid` properties stay out of the generated field list exactly as before. When the registered provider's component is `GuidField`, `AutoCommandForm` also passes it a `resetKey` derived from `currentValues`, so a changed overlay discards an in-progress draft.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(command: TCommand) => Guid \| undefined \| null` | — | **Required.** Accessor for the bound scalar property. |
| `fieldName` | `string` | Inferred from `value` | Explicit property name, for an accessor that reads the property dynamically. |
| `required` | `boolean` | From the command | An empty required field reports a required error. |
| `formatErrorMessage` | `string` | `'Enter a valid Guid.'` | Error for nonempty text that is not a Guid. Override to localize. |
| `requiredErrorMessage` | `string` | `'A value is required.'` | Error for an empty required field. Override to localize. |
| `resetKey` | `unknown` | — | Change it to discard the draft when the command value itself has not changed. |
| `placeholder` | `string` | — | Placeholder text shown while the field is empty. |
| `className` | `string` | — | Extra CSS class on the input. |
| `pt.root` | `InputHTMLAttributes<HTMLInputElement>` | — | Native input attributes. Value, change handling and validation attributes stay owned by the field. |

Every field also accepts Arc's shared field props, such as `title`, `description`, `initialValue`, and `noInitialValue`, and the accessibility props `id`, `aria-label`, and `aria-describedby`. See [Accessible names and validation errors](index.md#accessible-names-and-validation-errors). Native `pt.root.disabled` and `pt.root.readOnly` are reflected in `data-disabled` and `data-readonly`.

## Behavior

- Shows an empty input while the bound property is unset. No identifier is generated.
- Nonempty text is checked with `Guid.isGuid` and parsed with `Guid.parse`. Partial or invalid text stays editable, writes `undefined` to the command at once, never the previous valid identifier, and reports the format error.
- Empty text on an optional property writes `undefined` without an error. On a required property it reports the required error instead.
- Every value `Guid.isGuid` accepts is accepted, including the empty Guid and any version. Add a command rule when your domain needs more.
- Errors are published through the form's custom field errors and associated with the input through `aria-invalid` and `aria-describedby`. The field clears only an error it published itself, so an error set by your own code, for example in `onFieldValidate`, survives a valid edit and the field's unmount.
- A programmatic change to the command value replaces the draft and recalculates its error. Unrelated field edits keep a partial draft.

## Clearing and resetting

Assigning the same empty value again carries no reset signal through Arc's field binding. To discard an invalid draft whose command value is already empty, change `resetKey` on a hand-written field, change the `AutoCommandForm` `currentValues` overlay, or remount the form.
