# StepperCommandDialog

The `StepperCommandDialog` component provides a multi-step wizard dialog interface for executing commands, built on top of `CommandStepper` and the [PrimeReact Stepper](https://primereact.org/stepper/).

## Purpose

`StepperCommandDialog` organizes a command form across multiple steps, guiding users through a wizard-like workflow. All steps gather into the same underlying command — the Submit button only **appears** when all fields across every step are valid and the user has reached the last step.

## Key Features

- Multi-step wizard navigation with Previous and Next buttons
- All steps share a single command form — one command is submitted at the end
- Submit button only appears on the last step when all fields are valid
- Previous button hidden on the first step; Next button hidden on the last step
- Cancel via the X button in the dialog header or the Escape key, and — with `showCancel` — a Cancel button in the footer
- Step number circles change color to indicate validation state (red = errors, green = visited and valid)
- Non-active steps are visually dimmed to keep focus on the current step
- Busy state management during command execution
- All [PrimeReact Stepper](https://primereact.org/stepper/) customization props available directly (orientation, headerPosition, pt, etc.)
- Supports any `CommandForm` field types inside each `StepperPanel`
- Full integration with Cratis Arc command system

## Basic Usage

```typescript
import { StepperCommandDialog } from '@cratis/components/CommandDialog';
import { StepperPanel } from 'primereact/stepperpanel';
import { InputTextField, TextAreaField, NumberField } from '@cratis/components/CommandForm/fields';
import { CommandResult } from '@cratis/arc/commands';
import { DialogResult, useDialog, useDialogContext } from '@cratis/arc.react/dialogs';

type CreateProjectResponse = {
    projectId: string;
};

const CreateProjectDialog = () => {
    const { closeDialog } = useDialogContext<CommandResult<CreateProjectResponse>>();

    return (
        <StepperCommandDialog<CreateProject, CreateProjectResponse>
            command={CreateProject}
            title="Create New Project"
            okLabel="Create"
            onSuccess={(response) => {
                console.log('Project created:', response.projectId);
                closeDialog(DialogResult.Ok);
            }}
            onValidationFailure={(errors) => {
                console.error('Validation failed:', errors);
            }}
            onCancel={() => closeDialog(DialogResult.Cancelled)}
        >
            <StepperPanel header="Basic Info">
                <InputTextField<CreateProject> value={c => c.name} title="Project Name" />
                <InputTextField<CreateProject> value={c => c.email} title="Contact Email" type="email" />
            </StepperPanel>
            <StepperPanel header="Details">
                <TextAreaField<CreateProject> value={c => c.description} title="Description" rows={4} />
                <NumberField<CreateProject> value={c => c.budget} title="Budget" />
            </StepperPanel>
        </StepperCommandDialog>
    );
};

function MyComponent() {
    const [CreateProjectDialogWrapper, showCreateProjectDialog] = useDialog(CreateProjectDialog);

    return (
        <>
            <button onClick={() => showCreateProjectDialog()}>Create Project</button>
            <CreateProjectDialogWrapper />
        </>
    );
}
```

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
- `onCancel`: Cancel callback — invoked for every dismissal that is not a successful submit: the X in the dialog header, the Escape key, and the footer Cancel button when `showCancel` is on
- `onClose`: Fallback close callback
- `okLabel`: Label for the submit button shown on the last step when valid (default: `'Submit'`)
- `nextLabel`: Label for the next step button (default: `'Next'`)
- `previousLabel`: Label for the previous step button (default: `'Previous'`)
- `showCancel`: Adds a Cancel button as the first item in the footer (default: `false`)
- `cancelLabel`: Label for the footer cancel button (default: `'Cancel'`)
- `isValid`: Additional validity gate combined with command form validity
- `width`: Dialog width (default: `'600px'`)
- `resizable`: Whether the dialog can be resized
- `style`: Custom CSS styles
- `contentStyle`: Custom CSS styles for the dialog content area
- `onFieldValidate`: Custom validation function for fields
- `onFieldChange`: Callback when field values change
- `onBeforeExecute`: Transform command values before execution

### Stepper Props

All [PrimeReact Stepper](https://primereact.org/stepper/) customization props are available directly:

- `orientation`: `'horizontal'` (default) or `'vertical'`
- `headerPosition`: `'top'`, `'right'`, `'bottom'`, or `'left'`
- `linear`: Whether steps must be completed in order (default: `true`)
- `onChangeStep`: Callback when the active step changes
- `start`: Custom content rendered before the stepper navigation
- `end`: Custom content rendered after the stepper navigation
- `pt`: PrimeReact PassThrough options for deep DOM customization
- `ptOptions`: PassThrough configuration options
- `unstyled`: Removes built-in component styles

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

- `onConfirm` is executed only after command execution succeeds.
- If `onConfirm` returns `true`, the dialog closes; otherwise it stays open.
- If `onConfirm` is not provided, `onClose(DialogResult.Ok)` is used.
- `onCancel` follows the same behavior as `Dialog` (`true` closes).
- `onClose` closes unless it returns `false`.

## Validation Indicators

The step number circles in the wizard navigation bar reflect the validation state of each step:

| Circle color | Meaning |
|---|---|
| **Red** | The step contains at least one field with a validation error |
| **Green** | The step has been visited (navigated through) and all its fields are valid |
| **Default** (theme primary) | The step has not been visited yet |

Steps that are not currently active are dimmed to keep visual focus on the current step.

To show validation indicators immediately on open — before the user has touched any fields — pass the `validateOnInit` prop:

```tsx
<StepperCommandDialog
    command={CreateProject}
    validateOnInit
    ...
>
```

This is useful when the dialog opens with pre-populated values that may already be partially invalid.

## Navigation and Submit

| Step position | Footer content | Footer content with `showCancel` |
|---|---|---|
| First step | Next | Cancel, Next |
| Middle step | Previous, Next | Cancel, Previous, Next |
| Last step (invalid) | Previous | Cancel, Previous |
| Last step (valid) | Previous, Submit | Cancel, Previous, Submit |

The Submit button is hidden until the user reaches the last step **and** all command form fields across every step pass validation.

## Cancelling

Dismissal is always reachable from the X button in the dialog header and from the Escape key. Both run `onCancel` and close with `DialogResult.Cancelled`.

Set `showCancel` to add a Cancel button to the footer as well. It leads the footer on every step — on the dismissal side of the divider, opposite Next and Submit — and takes exactly the same path as the header X. Use it for a wizard whose dismissal should be as reachable as its submit: a destructive or long flow, or one presented without a visible header. `cancelLabel` renames it.

```tsx
<StepperCommandDialog<DeleteEnvironment>
    command={DeleteEnvironment}
    title="Delete environment"
    okLabel="Delete"
    showCancel
    cancelLabel="Keep environment"
    onCancel={() => closeDialog(DialogResult.Cancelled)}
>
    <StepperPanel header="Environment">
        <DropdownField<DeleteEnvironment> value={c => c.environmentId} title="Environment" options={environments} />
    </StepperPanel>
    <StepperPanel header="Confirm">
        <InputTextField<DeleteEnvironment> value={c => c.confirmationText} title="Type the environment name to confirm" />
    </StepperPanel>
</StepperCommandDialog>
```

## Busy State

`StepperCommandDialog` automatically manages a busy state during command execution:

- When Submit is clicked, the Submit button shows a loading spinner and all navigation buttons are disabled.
- Every route out of the dialog is withdrawn for the same window: the footer Cancel is disabled, the header X is not rendered, and Escape does not dismiss. A dialog can therefore never report cancellation for a command that goes on to execute anyway.
- The window opens the moment Submit is pressed — including while an `async` `onBeforeExecute` transform is still resolving, before the command has been sent.
- Once execution completes (success or failure), the buttons and every dismissal route return to their normal state.

## Step Structure

Each step is defined by a `StepperPanel` from `primereact/stepperpanel`. The `header` prop sets the step title shown in the stepper navigation:

```tsx
<StepperPanel header="Contact Details">
    <InputTextField<MyCommand> value={c => c.email} title="Email" />
</StepperPanel>
```

CommandForm fields placed inside a `StepperPanel` are automatically bound to the same command instance, regardless of which step they are on.

## Integration

`StepperCommandDialog` integrates with:

- `@cratis/arc/commands` for command execution
- `@cratis/arc.react/commands` for form handling
- [PrimeReact Stepper](https://primereact.org/stepper/) and `StepperPanel` components for the wizard UI
- PrimeReact `Dialog` component for the modal wrapper

## See Also

- [Advanced Features](advanced-features.md) - Field validation, transformation, and change tracking across steps
- [CommandStepper](../CommandStepper/index.md) - Standalone stepper foundation component
