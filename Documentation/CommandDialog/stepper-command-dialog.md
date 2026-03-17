# StepperCommandDialog

The `StepperCommandDialog` component provides a multi-step wizard dialog interface for executing commands, powered by the PrimeReact Stepper.

## Purpose

`StepperCommandDialog` organizes a command form across multiple steps, guiding users through a wizard-like workflow. All steps gather into the same underlying command — the Submit button only **appears** when all fields across every step are valid and the user has reached the last step.

## Key Features

- Multi-step wizard navigation with Previous and Next buttons
- All steps share a single command form — one command is submitted at the end
- Submit button only appears on the last step when all fields are valid
- Previous button hidden on the first step; Next button hidden on the last step
- Cancel via the X button in the upper-right corner — no footer Cancel button
- Busy state management during command execution
- All PrimeReact `Stepper` customization props available directly (orientation, headerPosition, pt, etc.)
- Supports any `CommandForm` field types inside each `StepperPanel`
- Full integration with Cratis Arc command system

## Basic Usage

```typescript
import { StepperCommandDialog } from '@cratis/components/CommandDialog';
import { StepperPanel } from 'primereact/stepperpanel';
import { InputTextField, TextAreaField, NumberField } from '@cratis/components/CommandForm/fields';
import { CommandResult } from '@cratis/arc/commands';
import { DialogResult, useDialog, useDialogContext } from '@cratis/arc.react/dialogs';

const CreateProjectDialog = () => {
    const { closeDialog } = useDialogContext<CommandResult<object>>();

    return (
        <StepperCommandDialog<CreateProject>
            command={CreateProject}
            title="Create New Project"
            okLabel="Create"
            onConfirm={() => closeDialog(DialogResult.Ok)}
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
- `onConfirm`: Confirm callback — called only after successful command execution
- `onCancel`: Cancel callback — invoked when the X button is clicked
- `onClose`: Fallback close callback
- `okLabel`: Label for the submit button shown on the last step when valid (default: `'Submit'`)
- `nextLabel`: Label for the next step button (default: `'Next'`)
- `previousLabel`: Label for the previous step button (default: `'Previous'`)
- `isValid`: Additional validity gate combined with command form validity
- `width`: Dialog width (default: `'600px'`)
- `resizable`: Whether the dialog can be resized
- `style`: Custom CSS styles
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

## Navigation and Submit

| Step position | Footer content |
|---|---|
| First step | Next |
| Middle step | Previous, Next |
| Last step (invalid) | Previous |
| Last step (valid) | Previous, Submit |

Cancel is always available via the X button in the dialog header. The Submit button is hidden until the user reaches the last step **and** all command form fields across every step pass validation.

## Busy State

`StepperCommandDialog` automatically manages a busy state during command execution:

- When Submit is clicked, the Submit button shows a loading spinner and all navigation buttons are disabled.
- Once execution completes (success or failure), the buttons return to their normal state.

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
- PrimeReact `Stepper` and `StepperPanel` components for the wizard UI
- PrimeReact `Dialog` component for the modal wrapper

