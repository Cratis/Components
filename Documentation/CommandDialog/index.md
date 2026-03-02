# CommandDialog

The `CommandDialog` component provides a dialog interface for executing commands with built-in form handling and validation.

## Purpose

CommandDialog simplifies the process of presenting a command form to users within a modal dialog. It handles command execution, validation, and result management automatically.

## Key Features

- Automatic form generation from command types
- Built-in validation support
- Field-level change tracking
- Pre-execution transformation of values
- Success and cancellation handling
- Integration with Cratis Arc command system

## Recommended Usage Pattern

For new implementations, use the same dialog pattern as other typed dialogs:

- Open dialogs through `useDialog<TResult>()`
- Close from inside the dialog through `useDialogContext<TResult>()`
- `await` the dialog at the call site and handle `[dialogResult, value]`

When the value represents command execution output, use `CommandResult<TResponse>` as the dialog result type.

## Basic Usage

```typescript
import { DialogResult, useDialog, useDialogContext } from '@cratis/arc.react/dialogs';
import { CommandResult } from '@cratis/arc/commands';
import { CommandDialog } from '@cratis/components/CommandDialog';
import { CreateProject } from './commands';

type CreateProjectResponse = {
    projectId: string;
};

const CreateProjectDialog = () => {
    const { closeDialog } = useDialogContext<CommandResult<CreateProjectResponse>>();

    return (
        <CommandDialog<CreateProject, CreateProjectResponse>
            command={CreateProject}
            header='Create project'
            onConfirm={async result => closeDialog(DialogResult.Ok, result as CommandResult<CreateProjectResponse>)}
            onCancel={() => closeDialog(DialogResult.Cancelled)}
        />
    );
};

function MyComponent() {
    const [CreateProjectDialogWrapper, showCreateProjectDialog] = useDialog<CommandResult<CreateProjectResponse>>(CreateProjectDialog);

    const handleCreateProject = async () => {
        const [dialogResult, commandResult] = await showCreateProjectDialog();

        if (dialogResult === DialogResult.Ok && commandResult?.isSuccess) {
            // Handle successful command response
        }
    };

    return (
        <>
            <button onClick={handleCreateProject}>Create project</button>
            <CreateProjectDialogWrapper />
        </>
    );
}
```

> `CommandDialog` invokes `onConfirm` only when command execution succeeds.

## Props

### Required Props

- `command`: Constructor for the command type
- `header`: Dialog title text
- `onConfirm`: Callback function when command succeeds
- `onCancel`: Callback function when dialog is cancelled

### Optional Props

- `visible`: Boolean controlling dialog visibility (defaults to `true`)
- `initialValues`: Initial values for the command form
- `currentValues`: Current values to populate the form
- `confirmLabel`: Custom text for confirm button (default: "OK")
- `cancelLabel`: Custom text for cancel button (default: "Cancel")
- `confirmIcon`: Icon for confirm button
- `cancelIcon`: Icon for cancel button
- `onFieldValidate`: Custom validation function for fields
- `onFieldChange`: Callback when field values change
- `onBeforeExecute`: Transform command values before execution
- `style`: Custom CSS styles
- `width`: Dialog width

## Context

`CommandDialog` is built on top of `CommandForm` and uses the command form context internally for values, validation, and execution state.

When used as an awaitable dialog, pair it with `useDialogContext<CommandResult<TResponse>>()` in a wrapping dialog component.

## Integration

CommandDialog integrates with:

- `@cratis/arc/commands` for command execution
- `@cratis/arc.react/commands` for form handling
- PrimeReact Dialog component for UI

## See Also

- [Advanced Features](advanced-features.md) - Field validation, transformation, and change tracking
