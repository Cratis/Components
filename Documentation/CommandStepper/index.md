---
title: CommandStepper
description: Split an Arc command form into validation-aware steps for wizard-style workflows.
---

The `CommandStepper` component executes one Arc command through an inline, multi-step form.

## Purpose

Use `CommandStepper` when the wizard belongs directly in a page region, panel, or route. It establishes a `CommandForm`, renders `StepperPanel` steps with built-in navigation, and executes the command from the final step.

`CommandStepper` and [`StepperCommandDialog`](../StepperCommandDialog/index.md) are sibling public components that share the private `CommandStepperContent` rendering primitive. Both execute the command. Choose `StepperCommandDialog` when the wizard should be modal; it also owns dialog dismissal, authorization-result routing, and its execution busy state.

## Basic Usage

```tsx
import { CommandStepper } from '@cratis/components/CommandDialog';
import { StepperPanel } from '@cratis/components/CommandDialog';
import { InputTextField } from '@cratis/components/CommandForm/fields';
import { CreateProject } from '../api/projects/CreateProject';

export const ProjectWizard = () => {
    return (
        <CommandStepper<CreateProject>
            command={CreateProject}
            autoServerValidate={false}
            validateOnInit
        >
            <StepperPanel header='Basic Info'>
                <InputTextField<CreateProject>
                    value={(c) => c.name}
                    title='Project Name'
                />
            </StepperPanel>
            <StepperPanel header='Details'>{/* CommandForm fields */}</StepperPanel>
        </CommandStepper>
    );
};
```

## Props

- `command`: Command constructor used to establish `CommandForm`
- `children`: `StepperPanel` elements
- `nextLabel`: Next button label. Falls back to the [`CratisComponentsProvider`](../Common/cratis-components-provider.md)'s `messages.stepper.next`, then `'Next'`
- `previousLabel`: Previous button label. Falls back to the provider's `messages.stepper.previous`, then `'Previous'`
- `showNavigation`: Show built-in navigation controls (default: `true`)
- `onStepErrorsChange`: Callback receiving a boolean array of per-step validation errors
- `showSubmit`: Show the built-in submit action on the last step (default: `true`)
- `okLabel`: Submit button label. Falls back to the provider's `messages.stepper.submit`, then `'Submit'`
- `isBusy`: Disables the navigation controls while something is running
- `onSuccess`: Callback invoked with the typed response after successful command execution
- `onValidationFailure`: Callback invoked with validation results when command execution returns validation errors
- `onFailed`: Callback invoked with the full command result for an unsuccessful, non-validation result
- Other applicable `CommandForm` props, including `initialValues`, `currentValues`, `validateOnInit`, and field-validation callbacks
- `onBeforeExecute`: Transform command values before execution — it must **return** the values to run with, and it runs only on submit, so it can never satisfy required-field validation (seed those through `initialValues`)
- `linear` (default `true`), `orientation` (`'horizontal'` default / `'vertical'`), `headerPosition` (`'top'` default / `'bottom'`), `start`, `end`, `onChangeStep`, and `pt`: the active `StepperCustomizationProps` surface. It maps onto stable `root`, `list`, `step`, `header`, `number`, `title`, `separator`, `panels`, and `panel` parts.
- `ptOptions` and `unstyled`: retained temporarily for source compatibility; ignored because Cratis part attributes always merge and styling is CSS-owned.

There is no outer dialog, so `CommandStepper` has no `dialogPt` or `dialogUnstyled` props. Its `pt` prop targets the stepper directly.

Conditional steps written as `{condition && <StepperPanel/>}` are counted correctly — only the panels that actually render are counted, so navigation and the per-step validation state stay in step with what is on screen. A `<>…</>` fragment wrapping several panels still counts as **one** step.

## Validation Indicators

`CommandStepper` identifies `CommandFormField` children inside each `StepperPanel` and extracts the field names from their `value` accessors.

The step number circles are then styled based on state:

- Red: the step contains at least one field with an error
- Green: the step is visited and has no errors
- Default: not visited and no errors

## See Also

- [StepperCommandDialog](../StepperCommandDialog/index.md) — place the same kind of command wizard in a modal dialog
