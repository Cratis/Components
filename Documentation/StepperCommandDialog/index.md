---
title: StepperCommandDialog multi-step command workflows
description: StepperCommandDialog collects one Arc command across modal steps, keeps values together, and submits when the whole command is valid.
---

`StepperCommandDialog` is a Cratis Components React component for collecting one Cratis Arc command across several steps in a modal dialog. Use it when users need to work through groups of fields before submitting once. Choose [`CommandStepper`](../CommandStepper/index.md) for an inline workflow, or [`CommandDialog`](../CommandDialog/index.md) when the form fits on one step.

## Purpose

Split the fields into named `StepperPanel` children without splitting the command itself. Values entered on an earlier step remain available when users move forward or go back. Submit appears only on the last step, once the whole command is valid and the optional `isValid` gate is not `false`.

## Key Features

Previous and Next let users review the form without executing it. Step number circles identify fields with displayed errors, so users can find the step that needs attention. The final Submit action executes the shared command; a failed result leaves the dialog open for correction.

Users can dismiss through the header X, Escape, or a backdrop click. Add `showCancel` for a footer action. Dismissal is blocked while a submission is in progress, including an asynchronous transform or confirmation. Conditional panels participate in navigation only while they render.

## Basic Usage

This example gathers a project's contact details and budget in two steps, then returns the created project's id to the caller. It assumes `CreateProject` is a generated Arc command proxy whose `Handle()` returns a `CreateProjectResponse`. Both panels bind fields to that same proxy instance.

```tsx
import { DialogResult, useDialog, useDialogContext } from '@cratis/arc.react/dialogs';
import { StepperCommandDialog, StepperPanel } from '@cratis/components/CommandDialog';
import { InputTextField, NumberField, TextAreaField } from '@cratis/components/CommandForm/fields';
import { CreateProject } from './CreateProject';

type CreateProjectResponse = {
    projectId: string;
};

const CreateProjectDialog = () => {
    const { closeDialog } = useDialogContext<object, CreateProjectResponse>();

    return (
        <StepperCommandDialog<CreateProject, CreateProjectResponse>
            command={CreateProject}
            title='Create project'
            okLabel='Create'
            onSuccess={(response) => closeDialog(DialogResult.Ok, response)}
        >
            <StepperPanel header='Basic info'>
                <InputTextField<CreateProject> value={(c) => c.name} title='Project name' />
                <InputTextField<CreateProject> value={(c) => c.email} title='Contact email' type='email' />
            </StepperPanel>
            <StepperPanel header='Details'>
                <TextAreaField<CreateProject> value={(c) => c.description} title='Description' rows={4} />
                <NumberField<CreateProject> value={(c) => c.budget} title='Budget' min={0} />
            </StepperPanel>
        </StepperCommandDialog>
    );
};

export const Projects = () => {
    const [CreateProjectDialogWrapper, showCreateProjectDialog] =
        useDialog<CreateProjectResponse>(CreateProjectDialog);

    const createProject = async () => {
        const [result, response] = await showCreateProjectDialog();
        if (result === DialogResult.Ok && response) {
            console.log('Created project', response.projectId);
        }
    };

    return (
        <>
            <button type='button' onClick={createProject}>
                Create project
            </button>
            <CreateProjectDialogWrapper />
        </>
    );
};
```

Clicking Create on the valid final step executes `CreateProject`. The `onSuccess` callback passes the response to `closeDialog(DialogResult.Ok, response)`, resolving the caller's `await` so it can use `response.projectId`. `useDialogContext` takes the request type first and the result type second; `useDialog` takes the result type first.

Without a custom close callback, a successful submission closes through the dialog context with `DialogResult.Ok` but no response value. Closing from `onSuccess`, as above, lets the caller receive the response before that automatic close. The header X, Escape, and a backdrop click resolve with `DialogResult.Cancelled` unless `onCancel` or `onClose` prevents dismissal.

Required values that no step shows, such as the id of the item being edited, belong in `initialValues`. See [Initialize command values](../CommandDialog/index.md#initialize-command-values); the same rules apply to every step.

## Props

### Required Props

- `command`: Constructor for the command type
- `title`: Dialog title text
- `children`: `StepperPanel` elements defining each step

### Dialog Props

- `visible`: Boolean controlling dialog visibility (defaults to `true`)
- `initialValues`: Initial command values and the baseline for change tracking; an `undefined` value does not clear an existing value
- `currentValues`: Reactive values owned outside the form; present keys update the command, including `null` or explicit `undefined` to clear a property
- `onSuccess`: Callback invoked on successful command execution with the typed response
- `onFailed`: Callback invoked when command execution fails with the full `CommandResult<TResponse>`
- `onException`: Callback receiving messages and stack trace when a command result contains exceptions; also handles a rejected `confirmBeforeExecute` guard
- `onUnauthorized`: Callback invoked when authorization fails
- `onValidationFailure`: Callback invoked on validation errors with the validation results
- `onConfirm`: Confirm callback — called only after successful command execution
- `onCancel`: Cancel callback — invoked for every dismissal that is not a successful submit: the X in the dialog header, the Escape key, a backdrop click, and the footer Cancel button when `showCancel` is on. Return `true`, or call `closeDialog` yourself, to close
- `onClose`: Fallback close callback
- `okLabel`: Label for the submit button shown on the last step when valid. Falls back to the [`CratisComponentsProvider`](../Common/cratis-components-provider.md)'s `messages.stepper.submit`, then `'Submit'`
- `nextLabel`: Label for the next step button. Falls back to the provider's `messages.stepper.next`, then `'Next'`
- `previousLabel`: Label for the previous step button. Falls back to the provider's `messages.stepper.previous`, then `'Previous'`
- `showCancel`: Adds a Cancel button as the first item in the footer (default: `false`)
- `cancelLabel`: Label for the footer cancel button. Falls back to the provider's `messages.dialog.cancel` — the same group `Dialog`'s own Cancel button resolves through — then `'Cancel'`
- `isValid`: Additional validity gate combined with command form validity
- `width`: Dialog width (default: `'600px'`)
- `resizable`: Accepted for source compatibility; the viewport-bounded Cratis dialog has no resize handle. Existing call sites keep compiling; the prop simply has no effect.
- `style`: Custom CSS styles
- `contentStyle`: Custom CSS styles for the dialog content area
- `dialogClassName`: Extra CSS class name for the outer dialog root
- `headerActions`: Actions rendered in the dialog header before the close button — see [Header actions](../Dialogs/dialog.md#header-actions)
- `hideGlobalHeaderActions`: Leaves out the app-wide header actions registered on `CratisComponentsProvider`
- `sliceLocation`: The `{ module, feature, slice }` the dialog was opened from, handed to app-wide header actions
- `dialogPt`: Cratis-owned stable part attributes for the **outer** dialog; inherited `pt` targets the **inner** stepper
- `dialogPtOptions` / `dialogUnstyled` / inherited `ptOptions` / inherited `unstyled`: Retained temporarily for source compatibility; ignored because part attributes always merge and styling is CSS-owned
- `onFieldValidate`: Custom validation function for fields
- `onFieldChange`: Callback when field values change
- `onBeforeExecute`: Transform command values before execution — it must **return** the values to run with. It runs only on submit, after every step has been validated, so a value produced here can never satisfy required-field validation; seed required values through `initialValues` instead.
- `confirmBeforeExecute(values)`: Optional sync or async guard after validation and `onBeforeExecute`. Receives transformed values; return `false` to leave the wizard open without executing. Rejection calls `onException` (or logs if absent), not `onFailed`.

### Stepper Props

`StepperCustomizationProps` is Cratis-owned. The surface below is complete and maps onto stable stepper parts rather than renderer props.

- `orientation`: `'horizontal'` (default) or `'vertical'`
- `headerPosition`: `'top'` (default) or `'bottom'`
- `linear`: Whether the wizard is linear (default: `true`). In linear mode users move with Previous and Next, not header clicks. Set it to `false` to allow header navigation; forward moves still stop when the current step shows a field error.
- `onChangeStep`: Called once after each successful move to a different step through Previous, Next, or a clickable header. Receives `{ index }` (zero-based); blocked moves and clicks on the current header do not call it.
- `start`: Content rendered before the stepper
- `end`: Content rendered after the stepper
- `pt`: Cratis-owned HTML attributes for the inner stepper's stable parts
- `ptOptions`: Retained temporarily for source compatibility; ignored because Cratis part attributes always merge
- `unstyled`: Legacy compatibility flag; ignored

## Callback Behavior

### Result Callbacks

Use result callbacks to react to the submitted command, not to movement between steps:

- `onSuccess(response: TResponse)`: Invoked when the command executes successfully. Receives the typed response.
- `onFailed(commandResult: CommandResult<TResponse>)`: Invoked when execution returns an unsuccessful command result.
- `onException(messages: string[], stackTrace: string)`: Invoked when the result contains exceptions.
- `onUnauthorized()`: Invoked when authorization fails.
- `onValidationFailure(validationResults: ValidationResult[])`: Invoked on validation errors.

On an unsuccessful result, `onFailed` runs first, followed by the applicable `onException`, `onUnauthorized`, and `onValidationFailure` callbacks in that order. A successful result calls `onSuccess` instead, then follows the close rules below. See [validation and callbacks](advanced-features.md) for typed responses and rules that compare fields across steps.

### Dialog Callbacks

"Closes" means that the dialog calls `closeDialog` from the surrounding `useDialog` context. Without that context nothing closes automatically; hide the dialog yourself from `onSuccess` and `onCancel`.

- `onConfirm` is executed only after command execution succeeds.
- If `onConfirm` returns `true`, the dialog closes; otherwise it stays open.
- If `onConfirm` is not provided, `onClose(DialogResult.Ok)` is used.
- `onCancel` follows the same behavior as `Dialog` (`true` closes).
- `onClose` closes unless it returns `false`.
- With none of the three, a successful submit closes with `DialogResult.Ok` and every dismissal closes with `DialogResult.Cancelled`.
- A callback that calls `closeDialog(...)` itself closes the dialog regardless of its return value.

## Confirm before submitting

Pass `confirmBeforeExecute` when Submit should ask another question before running the command. Fields are disabled from the moment you submit until the guarded submission settles. If the values change during that time (for example, through `currentValues`), the command is not executed and no result callback runs; confirm again with the new values. Wrap the wizard in `DialogComponents` and use `useConfirmationDialog` from a child of that provider, as shown in the [CommandDialog recipe](../CommandDialog/index.md#confirm-before-executing):

```tsx
import { DialogButtons, DialogComponents, DialogResult, useConfirmationDialog } from '@cratis/arc.react/dialogs';
import { StepperCommandDialog, StepperPanel } from '@cratis/components/CommandDialog';
import { InputTextField } from '@cratis/components/CommandForm/fields';
import { ConfirmationDialog } from '@cratis/components/Dialogs';
import { CreateProject } from './CreateProject';

function ProjectStepsDialog() {
    const [showConfirmation] = useConfirmationDialog(
        'Create project?', 'Submit these details?', DialogButtons.YesNo,
    );
    return (
        <StepperCommandDialog<CreateProject>
            command={CreateProject}
            title='Create project'
            confirmBeforeExecute={async (_values) =>
                (await showConfirmation()) === DialogResult.Yes}>
            <StepperPanel header='Details'>
                <InputTextField<CreateProject> value={(command) => command.name} title='Project name' />
            </StepperPanel>
        </StepperCommandDialog>
    );
}

export function ProjectWizardDialogs() {
    return <DialogComponents confirmation={ConfirmationDialog}><ProjectStepsDialog /></DialogComponents>;
}
```

A No response returns to the final step without calling success, failure, or close callbacks. The outer dialog stays busy while the nested confirmation is open; the confirmation stacks above it.

## Validation Indicators

The step number circles in the wizard navigation bar reflect the validation state of each step:

| Circle color | Meaning |
| ------------ | ------- |
| **Red** | A field in the step currently shows a validation error, whether or not the step was visited |
| **Green** | The step has been visited (navigated through) and none of its fields shows an error |
| **Default** | The step has not been visited and none of its fields shows an error |

Inactive step headers are dimmed; only the current panel's fields are visible.

To show validation indicators immediately on open — before the user has touched any fields — pass the `validateOnInit` prop:

```tsx
<StepperCommandDialog<CreateProject> command={CreateProject} title='Create project' validateOnInit>
    <StepperPanel header='Basic info'>
        <InputTextField<CreateProject> value={(c) => c.name} title='Project name' />
    </StepperPanel>
</StepperCommandDialog>
```

This is useful when the dialog opens with pre-populated values that may already be partially invalid.

The indicators, and the Next button, react to errors that are **shown**. With the default `validateOn='blur'`, a required field the user has not touched shows no error yet, so it neither turns the step red nor blocks Next. The Submit button is different: it follows the command's validity, including fields the user never touched.

## Navigation and Submit

| Step position       | Footer content   | Footer content with `showCancel` |
| ------------------- | ---------------- | -------------------------------- |
| First step          | Next             | Cancel, Next                     |
| Middle step         | Previous, Next   | Cancel, Previous, Next           |
| Last step (invalid) | Previous         | Cancel, Previous                 |
| Last step (valid)   | Previous, Submit | Cancel, Previous, Submit         |

The Submit button is hidden, not disabled, until the user reaches the last step **and** the command passes validation across every step (and `isValid` is not `false`). Next is disabled while a field on the current step shows an error. Submit receives focus when it appears.

`linear` (the default) makes other step headers unclickable; users still move with Previous and Next. In non-linear mode, clickable headers also cannot advance past a current step showing an error. Next does not require a step's fields to be filled when no errors are shown. The step headers are buttons in an ordered list, not ARIA tabs; each panel is labelled by its header unless you pass `pt.header.id`. In that case, the headers keep your id and the panels keep their text labels instead of referencing a shared header id. The current header has `aria-current="step"`.

## Cancelling

The header X, Escape, and a backdrop click offer dismissal except while a submission is in progress. Each one runs `onCancel`; the dialog closes with `DialogResult.Cancelled` when `onCancel` returns `true` or calls `closeDialog` itself. Without `onCancel`, `onClose(DialogResult.Cancelled)` decides, and with neither the dialog closes through the dialog context.

Set `showCancel` to add a Cancel button to the footer as well. It leads the footer on every step — on the dismissal side of the divider, opposite Next and Submit — and takes exactly the same path as the header X. Use it for a wizard whose dismissal should be as reachable as its submit: a destructive or long flow, or one presented without a visible header. `cancelLabel` renames it.

The excerpt assumes `closeDialog` comes from `useDialogContext()` and `environments` is an array of `{ id, name }` objects.

```tsx
<StepperCommandDialog<DeleteEnvironment>
    command={DeleteEnvironment}
    title='Delete environment'
    okLabel='Delete'
    showCancel
    cancelLabel='Keep environment'
    onCancel={() => closeDialog(DialogResult.Cancelled)}
>
    <StepperPanel header='Environment'>
        <DropdownField<DeleteEnvironment>
            value={(c) => c.environmentId}
            title='Environment'
            options={environments}
            optionValue='id'
            optionLabel='name'
        />
    </StepperPanel>
    <StepperPanel header='Confirm'>
        <InputTextField<DeleteEnvironment>
            value={(c) => c.confirmationText}
            title='Type the environment name to confirm'
        />
    </StepperPanel>
</StepperCommandDialog>
```

## Busy State

Busy state starts as soon as Submit is pressed, before an asynchronous `onBeforeExecute` transform or `confirmBeforeExecute` guard finishes. Submit shows a spinner, footer navigation and Cancel are disabled, and the header X is hidden. Escape and backdrop clicks cannot dismiss the dialog during this window.

Busy state ends before result callbacks run, whether execution succeeds or fails. With `confirmBeforeExecute`, fields are also disabled until the guarded submission settles; without that guard, fields remain editable.

## Step Structure

Each step is defined by a `StepperPanel` from `@cratis/components/CommandDialog`. The `header` prop sets the step title shown in the stepper navigation:

```tsx
<StepperPanel header='Contact Details'>
    <InputTextField<MyCommand> value={(c) => c.email} title='Email' />
</StepperPanel>
```

CommandForm fields placed inside a `StepperPanel` are automatically bound to the same command instance, regardless of which step they are on.

`StepperPanel` is a pure Cratis marker: the stepper consumes its props, so rendering one on its own produces nothing.

## Conditional steps

Render a `StepperPanel` conditionally when a group of fields applies only to some users. In this example, `isBusiness` is a boolean owned by the surrounding component; it decides whether the Company step appears.

```tsx
<StepperCommandDialog<RegisterCustomer> command={RegisterCustomer} title='New customer'>
    <StepperPanel header='Customer'>
        <InputTextField<RegisterCustomer> value={(c) => c.name} title='Name' />
    </StepperPanel>
    {isBusiness && (
        <StepperPanel header='Company'>
            <InputTextField<RegisterCustomer>
                value={(c) => c.organizationNumber}
                title='Organization number'
            />
        </StepperPanel>
    )}
    <StepperPanel header='Confirm'>
        <CheckboxField<RegisterCustomer>
            value={(c) => c.acceptedTerms}
            label='I accept the terms'
        />
    </StepperPanel>
</StepperCommandDialog>
```

Only rendered panels count as steps; `false`, `null`, and `undefined` children are ignored. With `isBusiness` false, the example has Customer and Confirm steps, and Submit appears on Confirm once the command is valid.

If the condition changes while the dialog is open, navigation uses the remaining panels. An active index beyond the new last step moves to that last step. Removing a panel does not clear its command values or remove command validation rules: a required `organizationNumber` still needs a valid value or a conditional rule that permits its absence.

:::caution[A fragment is one step]
A `<>…</>` fragment wrapping several panels counts as **one** step. Give each step its own `StepperPanel` child.
:::

## Integration

`StepperCommandDialog` uses `@cratis/arc/commands` for execution and `@cratis/arc.react/commands` for the shared form. The Cratis [`Dialog`](../Dialogs/dialog.md) supplies the modal wrapper, while `StepperPanel` names each group of fields.

## See Also

- [Validate fields and handle responses](advanced-features.md) when the workflow needs cross-step rules, custom inputs, or value transformations
- [CommandStepper](../CommandStepper/index.md) — render an executing command wizard inline without a modal dialog
