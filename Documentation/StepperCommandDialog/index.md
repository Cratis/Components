---
title: StepperCommandDialog
description: Execute Arc commands through a multi-step dialog with validation-aware navigation.
---

The `StepperCommandDialog` component executes one Arc command through a modal, multi-step form. It and [`CommandStepper`](../CommandStepper/index.md) are sibling public components that share the private `CommandStepperContent` rendering primitive. Both execute the command. Choose `CommandStepper` when the wizard belongs inline; the dialog additionally owns dismissal.

## Purpose

`StepperCommandDialog` organizes a command form across multiple steps, guiding users through a wizard-like workflow. All steps gather into the same underlying command — the Submit button only **appears** when the user has reached the last step and the command passes client validation across every step.

## Key Features

- Multi-step wizard navigation with Previous and Next buttons
- All steps share a single command form — one command is submitted at the end
- Submit button only appears on the last step when all fields are valid
- Previous button hidden on the first step; Next button hidden on the last step
- Cancel via the X button in the dialog header, the Escape key, or a backdrop click, and — with `showCancel` — a Cancel button in the footer
- Step number circles change color to indicate validation state (red = errors shown, green = visited and valid)
- Non-active steps are visually dimmed to keep focus on the current step
- Busy state management during command execution
- Stepper customization (`orientation`, `headerPosition`, `linear`, `start`, `end`, `pt`, …) available directly on the dialog
- Conditional steps (`{condition && <StepperPanel/>}`) are counted correctly — only the steps that actually render
- Supports any `CommandForm` field types inside each `StepperPanel`
- Full integration with Cratis Arc command system

## Basic Usage

The example assumes `CreateProject` is a generated Arc command proxy whose `Handle()` returns a `CreateProjectResponse`.

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

`useDialogContext` takes the request type first and the result type second. `closeDialog(DialogResult.Ok, response)` resolves the caller's `await` with the response; after `onSuccess`, the dialog also closes itself through the dialog context, which changes nothing once the caller has been resolved. The header X, `Escape`, and a backdrop click close the dialog with `DialogResult.Cancelled` without any callback.

Required values that no step shows, such as the id of the item being edited, belong in `initialValues`. See [Initialize command values](../CommandDialog/index.md#initialize-command-values); the same rules apply to every step.

## Props

### Required Props

- `command`: Constructor for the command type
- `title`: Dialog title text
- `children`: `StepperPanel` elements defining each step

### Dialog Props

- `visible`: Boolean controlling dialog visibility (defaults to `true`)
- `initialValues`: Initial values for the command form
- `currentValues`: Current values to populate the form
- `onSuccess`: Callback invoked on successful command execution with the typed response
- `onFailed`: Callback invoked when command execution fails with the full `CommandResult<TResponse>`
- `onException`: Callback invoked when the command throws an exception with error messages and stack trace
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
- `linear`: Whether the wizard is linear (default: `true`). In linear mode the step headers are not directly clickable — the user advances through Previous / Next. Set it to `false` to let the user jump between steps by clicking their headers.
- `onChangeStep`: Called once after each successful move to a different step through Previous, Next, or a clickable header. Receives `{ index }` (zero-based); blocked moves and clicks on the current header do not call it.
- `start`: Content rendered before the stepper
- `end`: Content rendered after the stepper
- `pt`: Cratis-owned HTML attributes for the inner stepper's stable parts
- `ptOptions`: Retained temporarily for source compatibility; ignored because Cratis part attributes always merge
- `unstyled`: Legacy compatibility flag; ignored

## Callback Behavior

### Result Callbacks

`StepperCommandDialog` supports the following result callbacks that are invoked based on the command execution outcome:

- `onSuccess(response: TResponse)`: Invoked when the command executes successfully. Receives the typed response.
- `onFailed(commandResult: CommandResult<TResponse>)`: Invoked when command execution fails for any reason.
- `onException(messages: string[], stackTrace: string)`: Invoked when the command throws an exception.
- `onUnauthorized()`: Invoked when authorization fails.
- `onValidationFailure(validationResults: ValidationResult[])`: Invoked on validation errors.

Multiple callbacks may fire for the same execution. For example, both `onFailed` and `onValidationFailure` will be invoked for validation errors.

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

Steps that are not currently active are dimmed to keep visual focus on the current step.

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

Dismissal is always reachable from the X button in the dialog header, from the Escape key, and from a backdrop click, except while the command runs. Each one runs `onCancel`; the dialog closes with `DialogResult.Cancelled` when `onCancel` returns `true` or calls `closeDialog` itself. Without `onCancel`, `onClose(DialogResult.Cancelled)` decides, and with neither the dialog closes through the dialog context.

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

`StepperCommandDialog` automatically manages a busy state during command execution:

- When Submit is clicked, the Submit button shows a loading spinner and all navigation buttons are disabled.
- Every route out of the dialog is withdrawn for the same window: the footer Cancel is disabled, the header X is not rendered, and neither Escape nor a backdrop click dismisses. A dialog can therefore never report cancellation for a command that goes on to execute anyway.
- The window opens the moment Submit is pressed — including while an `async` `onBeforeExecute` transform or `confirmBeforeExecute` guard is still resolving, before the command has been sent.
- Once execution completes (success or failure), the buttons and every dismissal route return to their normal state.

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

A step that only applies sometimes is written the obvious way, and it is counted the obvious way:

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

**Only the steps that actually render are counted.** `{condition && <StepperPanel/>}` leaves a `false` child behind when the condition does not hold, and `null` / `undefined` children are just as common; all of them are filtered out before the step count, the per-step validation state and the rendered panels are derived — from the same one list, so they cannot drift apart. With `isBusiness` false the wizard above has two steps, and Submit appears on "Confirm" where the user expects it.

The count is not fixed for the lifetime of the dialog either. A late-resolving query or a `currentValues` overlay can flip the condition _after_ the user has advanced past that step, so the active step is clamped into the set that still renders — an index left stranded above the end resolves to the last surviving step rather than a step that is neither last nor navigable.

:::caution[A fragment is one step]
A `<>…</>` fragment wrapping several panels counts as **one** step. Give each step its own `StepperPanel` child.
:::

## Integration

`StepperCommandDialog` integrates with:

- `@cratis/arc/commands` for command execution
- `@cratis/arc.react/commands` for form handling
- the private `CommandStepperContent` rendering primitive and public `StepperPanel` marker for the wizard UI
- The Cratis [`Dialog`](../Dialogs/dialog.md) for the modal wrapper

## See Also

- [Advanced Features](advanced-features.md) - Field validation, transformation, and change tracking across steps
- [CommandStepper](../CommandStepper/index.md) — render an executing command wizard inline without a modal dialog
