---
title: CommandStepper
description: Split an Arc command form into validation-aware steps for wizard-style workflows.
---

The `CommandStepper` component executes one Arc command through an inline, multi-step form.

## Purpose

Use `CommandStepper` when the wizard belongs directly in a page region, panel, or route. It establishes a `CommandForm`, renders `StepperPanel` steps with built-in navigation, and executes the command from the final step.

`CommandStepper` and [`StepperCommandDialog`](../StepperCommandDialog/index.md) are sibling public components that share the private `CommandStepperContent` rendering primitive. Both execute the command. Choose `StepperCommandDialog` when the wizard should be modal; the dialog also owns dismissal.

## Basic Usage

The example assumes `CreateProject` is a generated Arc command proxy whose `Handle()` returns a `CreateProjectResponse`, and that `navigate` comes from your router.

```tsx
import { CommandStepper, StepperPanel } from '@cratis/components/CommandDialog';
import { InputTextField, NumberField, TextAreaField } from '@cratis/components/CommandForm/fields';
import { CreateProject } from '../api/projects/CreateProject';

type CreateProjectResponse = {
    projectId: string;
};

export const ProjectWizard = () => (
    <CommandStepper<CreateProject, CreateProjectResponse>
        command={CreateProject}
        onSuccess={(response) => navigate(`/projects/${response.projectId}`)}
        onFailed={(result) => console.error('Could not create project', result.exceptionMessages)}
    >
        <StepperPanel header='Basic info'>
            <InputTextField<CreateProject> value={(c) => c.name} title='Project name' />
            <InputTextField<CreateProject> value={(c) => c.email} title='Contact email' type='email' />
        </StepperPanel>
        <StepperPanel header='Details'>
            <TextAreaField<CreateProject> value={(c) => c.description} title='Description' />
            <NumberField<CreateProject> value={(c) => c.budget} title='Budget' min={0} />
        </StepperPanel>
    </CommandStepper>
);
```

`CommandStepper` is also exported from `@cratis/components/CommandStepper`; `StepperPanel` is only exported from `@cratis/components/CommandDialog`.

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
- Other applicable `CommandForm` props, including `initialValues`, `currentValues`, `validateOnInit`, field-validation callbacks, and inherited command execution callbacks:
  - `onSuccess`: Callback invoked with the typed response after successful command execution
  - `onValidationFailure`: Callback invoked with validation results when command execution returns validation errors
  - `onFailed`: Callback invoked with the full command result for every unsuccessful result, including validation failures, as in the dialogs
  - `onException`: Callback invoked with the exception messages and stack trace when the result has exceptions
  - `onUnauthorized`: Callback invoked when the user is not authorized to execute the command
- `onBeforeExecute`: Transform command values before execution — it must **return** the values to run with, and it runs only on submit, so it can never satisfy required-field validation (seed those through `initialValues`). Submit turns busy before the transform runs, so an async transform cannot be submitted twice
- `linear` (default `true`), `orientation` (`'horizontal'` default / `'vertical'`), `headerPosition` (`'top'` default / `'bottom'`), `start`, `end`, and `pt`: the active `StepperCustomizationProps` surface. It maps onto stable `root`, `list`, `step`, `header`, `number`, `title`, `separator`, `panels`, and `panel` parts.
- `onChangeStep`: Called once after each successful move to a different step through Previous, Next, or a clickable header. Receives `{ index }`, with a zero-based index. Blocked moves and clicks on the current header do not call it.
- `ptOptions` and `unstyled`: retained temporarily for source compatibility; ignored because Cratis part attributes always merge and styling is CSS-owned.

Because `CommandStepper` has no outer dialog, it has no `dialogPt` or `dialogUnstyled` props; `pt` targets the stepper directly.

Conditional steps written as `{condition && <StepperPanel/>}` are counted correctly — only the panels that actually render are counted, so navigation and the per-step validation state stay in step with what is on screen. A `<>…</>` fragment wrapping several panels still counts as **one** step.

## Navigation and Submit

- Previous is hidden on the first step and Next on the last step.
- Next is disabled while a field on the current step shows an error. With the default `validateOn='blur'`, an untouched blank field shows no error, so it does not block Next. Pass `validateOnInit` to show errors from the start.
- `linear` (the default) makes other step headers unclickable; use Previous and Next to navigate. In non-linear mode, clickable headers also cannot advance past a current step showing an error. Neither mode requires a step to be complete before Next when no errors are shown.
- The headers form an ordered list of buttons, not ARIA tabs. Each step panel is labelled by its header unless you pass `pt.header.id`. In that case, the headers keep your id and the panels keep their text labels instead of referencing a shared header id. The current header has `aria-current="step"`.
- On the last step Submit is always rendered, but it is disabled until the command passes client validation and no step shows an error. (`StepperCommandDialog` hides its Submit button instead.)
- While the command runs, Next and Submit are disabled and Submit shows a spinner. `isBusy` disables Previous, Next, and Submit for your own long-running work.
- On failure the stepper stays on the last step, and server validation messages appear on their fields and turn their steps red.
- On success nothing else happens: the stepper keeps its values and stays on the last step. Navigate away or reset the surrounding view in `onSuccess`.

## Validation Indicators

`CommandStepper` identifies `CommandFormField` children inside each `StepperPanel` and extracts the field names from their `value` accessors.

The step number circles are then styled based on state:

- Red: the step contains at least one field that currently shows an error
- Green: the step is visited and has no errors
- Default: not visited and no errors

## See Also

- [StepperCommandDialog](../StepperCommandDialog/index.md) — place the same kind of command wizard in a modal dialog
