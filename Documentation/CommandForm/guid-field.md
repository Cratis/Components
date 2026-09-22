---
title: GuidField
description: Edit a scalar Fundamentals Guid with native Arc binding and accessible format validation.
---

`GuidField` is a native text input bound to a scalar `Guid`, `Guid | undefined`, or `Guid | null` property. [AutoCommandForm](auto-command-form.md) selects it for descriptors whose type is Fundamentals `Guid`, not arrays.

## Requirements

Use matching `@cratis/arc` and `@cratis/arc.react` versions in the supported range `>=22.19.1 <23`. This minimum includes Arc's custom-field-error execution guard and live error lookup: invalid drafts block native submission, context execution and `formRef.execute()`, while unmounting a field clears only its own current error.

## Usage

```tsx
import { GuidField } from '@cratis/components/CommandForm';
import { SampleCommand } from './SampleCommand';

<GuidField<SampleCommand>
    value={(command) => command.sampleId}
    title='Sample identifier'
    placeholder='Enter a Guid'
/>
```

Place the field inside Arc's `CommandForm` or a Components command dialog. `SampleCommand.sampleId` must be a native Fundamentals `Guid` property, not a string.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(command: TCommand) => Guid \| undefined \| null` | Required | Scalar property accessor. |
| `fieldName` | `string` | Inferred | Explicit binding for a dynamic accessor. |
| `required` | `boolean` | Descriptor's `!isOptional` | An empty required field has a required-value error. |
| `formatErrorMessage` | `string` | `Enter a valid Guid.` | Error for a nonempty invalid draft. |
| `requiredErrorMessage` | `string` | `A value is required.` | Error for an empty required draft. |
| `resetKey` | `unknown` | — | Change to discard a draft when the command value has not changed. |
| `placeholder` | `string` | — | Native placeholder. |
| `className` | `string` | — | Additional input classes. |
| `pt.root` | `InputHTMLAttributes<HTMLInputElement>` | — | Native input attributes; binding and validation attributes remain field-owned. |

The field also supports Arc population props and the shared [accessible naming props](index.md#accessible-names-and-validation-errors). Native `pt.root.disabled` and `pt.root.readOnly` states are reflected in data attributes.

## Validation and values

- Nonempty drafts are checked with `Guid.isGuid` and parsed with `Guid.parse`. Partial or invalid input stays editable and immediately writes `undefined` to the command, never the previous valid identifier.
- Empty optional input writes `undefined` without a format error. Required emptiness produces a required-value error instead.
- No identifier is generated. Zero Guids and any version bits accepted by Fundamentals are accepted here; add explicit command rules when your domain requires more.
- Format and required errors use the real Arc `setCustomFieldError` context API. The field never replaces native command execution. Native command validation rules still apply independently of field presentation.
- Errors are associated with the input through `aria-describedby` and `aria-invalid`. On unmount, the field removes only its own current custom error.

## Clearing and resetting

External value changes replace the displayed draft and recalculate its error. A changed `AutoCommandForm.currentValues` Guid overlay also resets the draft, including a change to explicit `undefined` after invalid input has already emptied the native value. Equivalent Guid overlays do not erase ongoing edits.

An assignment of the same empty value carries no observable reset intent in Arc's field binding. For an explicit same-value reset, change a hand-written field's `resetKey` (or remount the form). A custom Guid provider can forward this prop. Do not reset drafts on every `commandVersion` change: unrelated field edits must preserve partial input.
