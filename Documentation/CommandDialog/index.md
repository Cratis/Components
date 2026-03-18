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
- Busy state management during command execution (buttons disabled, spinner shown)
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
        <CommandDialog<CreateProject>
            command={CreateProject}
            title='Create project'
            okLabel='Create'
            onConfirm={async () => closeDialog(DialogResult.Ok)}
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
- `title`: Dialog title text

### Optional Props

- `visible`: Boolean controlling dialog visibility (defaults to `true`)
- `initialValues`: Initial values for the command form
- `currentValues`: Current values to populate the form
- `onConfirm`: Confirm callback from `Dialog` (called only after successful command execution)
- `onCancel`: Cancel callback from `Dialog`
- `onClose`: Fallback close callback from `Dialog`
- `okLabel`: Custom text for confirm button (default: "Ok")
- `cancelLabel`: Custom text for cancel button (default: "Cancel")
- `yesLabel`, `noLabel`: Labels for `YesNo` and `YesNoCancel` button modes
- `buttons`: `DialogButtons` value or custom footer content
- `resizable`: Whether dialog can be resized
- `isValid`: Additional validity gate combined with command form validity
- `onFieldValidate`: Custom validation function for fields
- `onFieldChange`: Callback when field values change
- `onBeforeExecute`: Transform command values before execution
- `style`: Custom CSS styles
- `contentStyle`: Custom CSS styles for the dialog content area
- `width`: Dialog width

## Callback Behavior

- `onConfirm` is executed only after command execution succeeds.
- If `onConfirm` returns `true`, the dialog closes; otherwise it stays open.
- If `onConfirm` is not provided, `onClose(DialogResult.Ok)` is used.
- `onCancel` follows the same behavior as `Dialog` (`true` closes).
- `onClose` closes unless it returns `false`.

## Busy State

`CommandDialog` automatically manages a busy state during command execution:

- When the Ok/Yes button is clicked and command execution begins, all buttons are disabled and the primary button shows a loading spinner.
- Once execution completes (success or failure), the buttons return to their normal state.
- This prevents duplicate submissions and gives users clear visual feedback.

## Context

`CommandDialog` is built on top of `CommandForm` and `Dialog`, and uses command form context internally for values, validation, and execution state.

When used as an awaitable dialog, pair it with `useDialogContext<CommandResult<TResponse>>()` in a wrapping dialog component.

## Integration

CommandDialog integrates with:

- `@cratis/arc/commands` for command execution
- `@cratis/arc.react/commands` for form handling
- PrimeReact Dialog component for UI

## See Also

- [Advanced Features](advanced-features.md) - Field validation, transformation, and change tracking
