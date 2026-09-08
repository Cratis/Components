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
        <CommandDialog<CreateProject, CreateProjectResponse>
            command={CreateProject}
            title='Create project'
            okLabel='Create'
            onSuccess={(response) => {
                console.log('Project created:', response.projectId);
                closeDialog(DialogResult.Ok);
            }}
            onValidationFailure={(errors) => {
                console.error('Validation failed:', errors);
            }}
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

> `CommandDialog` invokes `onSuccess` when command execution succeeds, and other callbacks based on the command result.

## Props

### Required Props

- `command`: Constructor for the command type
- `title`: Dialog title text

### Optional Props

- `visible`: Boolean controlling dialog visibility (defaults to `true`)
- `initialValues`: Initial values for the command form
- `currentValues`: Current values to populate the form
- `onSuccess`: Callback invoked on successful command execution with the typed response
- `onFailed`: Callback invoked when command execution fails with the full `CommandResult<TResponse>`
- `onException`: Callback invoked when the command throws an exception with error messages and stack trace
- `onUnauthorized`: Callback invoked when authorization fails
- `onValidationFailure`: Callback invoked on validation errors with the validation results
- `onConfirm`: Confirm callback from `Dialog` (called only after successful command execution)
- `onCancel`: Cancel callback from `Dialog`
- `onClose`: Fallback close callback from `Dialog`
- `okLabel`: Custom text for confirm button (default: "Ok")
- `cancelLabel`: Custom text for cancel button (default: "Cancel")
- `yesLabel`, `noLabel`: Labels for `YesNo` and `YesNoCancel` button modes
- `buttons`: `DialogButtons` value or custom footer content
- `initialFocus`: Where keyboard focus lands when the dialog opens — forwarded to `Dialog` (see below)
- `resizable`: Accepted for source compatibility; the viewport-bounded Cratis dialog has no resize handle
- `isValid`: Additional validity gate combined with command form validity
- `onFieldValidate`: Custom validation function for fields
- `onFieldChange`: Callback when field values change
- `onBeforeExecute`: Transform command values before execution
- `style`: Custom CSS styles
- `contentStyle`: Custom CSS styles for the dialog content area
- `width`: Dialog width
- `className`, `pt`: Styling hooks for the Cratis-owned dialog root and stable parts
- `ptOptions`, `unstyled`: Retained temporarily for source compatibility; ignored because Cratis part attributes always merge and styling is CSS-owned

> [!NOTE]
> `dismissable` and `closeAriaLabel` are forwarded to the underlying `Dialog`. `isBusy` is managed internally while the command executes, so consumers should not set it directly.

## Callback Behavior

### Result Callbacks

`CommandDialog` supports the following result callbacks that are invoked based on the command execution outcome:

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

## Destructive Commands and Initial Focus

The confirm button is focused when the dialog opens, and a focused native button
fires `click` from the `keydown` of `Enter`. A command whose form has required
fields is protected from a held or double-tapped `Enter` for free, because the
form's validity keeps confirm disabled until something is filled in. A command
that takes **no** input — the typical "delete this, permanently" command — has
no such gate, so its confirm button is armed the instant the dialog appears.

Pass `initialFocus` for those. It is forwarded straight to
[`Dialog`](../Dialogs/dialog.md#initial-focus) and changes nothing else — the
footer, the close (X), `Escape`, and the confirm wiring that runs the command
all stay intact.

```tsx
import { DialogInitialFocus } from '@cratis/components/Dialogs';

<CommandDialog<DeletePersonalData>
    command={DeletePersonalData}
    title='Delete personal data?'
    okLabel='Delete'
    initialFocus={DialogInitialFocus.Cancel}
    onSuccess={() => closeDialog(DialogResult.Ok)}
>
    This cannot be undone.
</CommandDialog>;
```

## Busy State

`CommandDialog` automatically manages a busy state from the start of `onBeforeExecute` until command execution settles:

- All buttons, including header close, are disabled and the primary button shows a loading spinner.
- Escape and backdrop dismissal are ignored while work is in flight.
- Once execution completes (success or failure), the buttons return to their normal state.
- This prevents duplicate submissions and accidental dismissal while giving users clear visual feedback.

## Context

`CommandDialog` is built on top of `CommandForm` and `Dialog`, and uses command form context internally for values, validation, and execution state.

When used as an awaitable dialog, pair it with `useDialogContext<CommandResult<TResponse>>()` in a wrapping dialog component.

## Integration

CommandDialog integrates with:

- `@cratis/arc/commands` for command execution
- `@cratis/arc.react/commands` for form handling
- React Aria modal/focus behavior behind Cratis-owned markup

## See Also

- [Advanced Features](advanced-features.md) - Field validation, transformation, and change tracking
