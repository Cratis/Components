---
title: CommandStepper for inline command wizards
description: CommandStepper gathers one Arc command across inline form steps, with validation-aware navigation and a final submission that your page handles.
---

`CommandStepper` gathers the fields of one Cratis Arc command into an inline, multi-step form and executes it from the final step. Use it when a task needs several groups of inputs but should stay in the page, with the surrounding content still available.

## Purpose

An inline wizard fits a task that occupies a page region, panel, or route. `CommandStepper` creates the `CommandForm` and provides Previous, Next, and Submit controls. Each `StepperPanel` groups fields from the same command instance; changing steps does not execute the command.

Choose [`StepperCommandDialog`](../StepperCommandDialog/index.md) when the task should open in a modal dialog instead. For the inline stepper, your page owns leaving the wizard and deciding what happens after success.

## Basic Usage

Group the project fields into two panels, then use `onSuccess` to open the created project. This example assumes `CreateProject` is a generated Arc command proxy whose `Handle()` returns a `CreateProjectResponse`, and that `navigate` comes from your router.

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

Both panels edit the same `CreateProject` command. Only Submit executes it, and the response supplies the `projectId` used by `onSuccess`. Keep the fields inside the panels: the stepper already provides the form, so do not nest another `CommandForm` inside it.

`CommandStepper` is also exported from `@cratis/components/CommandStepper`; `StepperPanel` is only exported from `@cratis/components/CommandDialog`.

## Props

- `command`: Command constructor used to establish `CommandForm`
- `children`: `StepperPanel` elements
- `nextLabel`: Next button label. Falls back to the [`CratisComponentsProvider`](../Common/cratis-components-provider.md)'s `messages.stepper.next`, then `'Next'`
- `previousLabel`: Previous button label. Falls back to the provider's `messages.stepper.previous`, then `'Previous'`
- `showNavigation`: Show the built-in footer, including Submit (default: `true`)
- `onStepErrorsChange`: Callback receiving a boolean array of per-step validation errors
- `showSubmit`: Show the built-in submit action on the last step when `showNavigation` is also `true` (default: `true`)
- `okLabel`: Submit button label. Falls back to the provider's `messages.stepper.submit`, then `'Submit'`
- `isBusy`: Disables Previous, Next, and Submit for work managed by your page; it does not disable step headers
- Other applicable `CommandForm` props, including `initialValues`, `currentValues`, `validateOnInit`, field-validation callbacks, and inherited command execution callbacks:
  - `onSuccess`: Callback invoked with the typed response after successful command execution
  - `onValidationFailure`: Callback invoked with validation results when command execution returns validation errors
  - `onFailed`: Callback invoked with the full command result for every unsuccessful result, including validation failures, as in the dialogs
  - `onException`: Callback invoked with the exception messages and stack trace when the result has exceptions
  - `onUnauthorized`: Callback invoked when the user is not authorized to execute the command
- `onBeforeExecute`: Transform command values before execution. It must return the values to run with and runs only on submit, after the validity check. Seed required values through `initialValues`. Submit turns busy before the transform starts and remains disabled while an async transform is pending
- `confirmBeforeExecute(values)`: Optional sync or async approval after validation and `onBeforeExecute`. Receives the transformed values; only `true` permits execution. Returning `false` skips execution without changing steps. If the callback throws or its promise rejects, `onException` runs, not `onFailed`, and Submit becomes available to retry
- `linear` (default `true`), `orientation` (`'horizontal'` default / `'vertical'`), `headerPosition` (`'top'` default / `'bottom'`), `start`, `end`, and `pt`: the active `StepperCustomizationProps` surface. It maps onto stable `root`, `list`, `step`, `header`, `number`, `title`, `separator`, `panels`, and `panel` parts.
- `onChangeStep`: Called once after each successful move to a different step through Previous, Next, or a clickable header. Receives `{ index }`, with a zero-based index. Blocked moves and clicks on the current header do not call it.
- `ptOptions` and `unstyled`: retained temporarily for source compatibility; ignored because Cratis part attributes always merge and styling is CSS-owned.

Because `CommandStepper` has no outer dialog, it has no `dialogPt` or `dialogUnstyled` props; `pt` targets the stepper directly.

For conditional steps such as `{condition && <StepperPanel/>}`, navigation and per-step validation use only the panels that render. A `<>…</>` fragment wrapping several panels still counts as one step.

## Navigation and Submit

By default, people move through the panels with Previous and Next. Previous is hidden on the first step, and Next is hidden on the last. `linear` defaults to `true`, so other step headers are not clickable. Set `linear={false}` to allow header navigation. Moving backward is allowed even when the current step shows an error; moving forward through Next or a clickable header is blocked by a displayed error on the current step.

Step navigation checks displayed field errors, not whether every required value is present. With the default `validateOn='blur'`, an untouched blank field has no displayed error and does not block Next. Pass `validateOnInit` to show validation errors from the start. Seed required hidden values through `initialValues`; `onBeforeExecute` runs too late to make an invalid command eligible for submission.

With the default footer settings, Submit appears on the last step and stays disabled until the command passes client validation and no step shows an error. This differs from `StepperCommandDialog`, which hides Submit while the form is invalid. While `onBeforeExecute`, confirmation, or execution is pending, Next and Submit are disabled and Submit shows a spinner. Previous remains available unless you set `isBusy`; step headers are not disabled by the busy state.

An unsuccessful result leaves the form open with its values intact. Server validation messages appear on their fields and mark the affected steps red, so people can return to those steps to correct them. Success also keeps the form and values in place. Use `onSuccess` to navigate away, as in the example, or reset the surrounding view yourself.

The headers form an ordered list of buttons, not ARIA tabs. Each step panel is labelled by its header unless you pass `pt.header.id`. In that case, the headers keep your id and the panels keep their text labels instead of referencing a shared header id. The current header has `aria-current="step"`.

## Cancellation

`CommandStepper` has no built-in Cancel button or `onCancel` callback. Put a cancel or back action in the surrounding page and decide whether it navigates away or removes the wizard. If you need dialog dismissal, use [`StepperCommandDialog`](../StepperCommandDialog/index.md) instead. Leaving the inline wizard is not a request to abort a command that has already started.

## Confirm before submitting

Use `confirmBeforeExecute` when someone should review their decision before the command runs. It works as it does in [`CommandDialog`](../CommandDialog/index.md#confirm-before-executing): validation and `onBeforeExecute` come first, then the callback receives the transformed values. Only a `true` result permits execution.

When this callback is configured, fields are disabled from the moment you submit until the guarded submission settles. If the values change during that time, for example through `currentValues`, the command is not executed and no result callback runs. Submit again to confirm the new values.

To ask through a confirmation dialog, wrap the page in `DialogComponents` and call `useConfirmationDialog` from a child of that provider:

```tsx
import { DialogButtons, DialogComponents, DialogResult, useConfirmationDialog } from '@cratis/arc.react/dialogs';
import { CommandStepper, StepperPanel } from '@cratis/components/CommandDialog';
import { InputTextField } from '@cratis/components/CommandForm/fields';
import { ConfirmationDialog } from '@cratis/components/Dialogs';
import { CreateProject } from './CreateProject';

function ProjectSteps() {
    const [confirm] = useConfirmationDialog('Create project?', 'Continue?', DialogButtons.YesNo);
    return (
        <CommandStepper<CreateProject> command={CreateProject}
            confirmBeforeExecute={async (_values) => (await confirm()) === DialogResult.Yes}>
            <StepperPanel header='Details'>
                <InputTextField<CreateProject> value={(command) => command.name} title='Project name' />
            </StepperPanel>
        </CommandStepper>
    );
}

export function ProjectWizardWithConfirmation() {
    return <DialogComponents confirmation={ConfirmationDialog}><ProjectSteps /></DialogComponents>;
}
```

Choosing No declines this submission without clearing the values or leaving the wizard, so the person can edit and submit again. For another example of the same callback, see `WithPreExecutionConfirmation` in `Source/CommandDialog/CommandDialog.stories.tsx`.

## Validation Indicators

`CommandStepper` reads the `value` accessors of `CommandFormField` children inside each `StepperPanel` to associate errors with steps. The step number circles show where someone has been and where corrections are needed:

- Red: the step contains at least one field that currently shows an error
- Green: the step is visited and has no displayed errors
- Default: not visited and no displayed errors

A green indicator means the step has no displayed errors, not that every required command value is present. The final Submit gate still checks command validity.

## See Also

For a modal wizard with dismissal controls, continue with [StepperCommandDialog](../StepperCommandDialog/index.md). For field bindings and defaults that affect whether the command is valid, see [CommandForm fields](../CommandForm/index.md).
