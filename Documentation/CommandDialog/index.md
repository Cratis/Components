---
title: CommandDialog
description: Execute Arc commands in a dialog with automatic form state, validation, and result handling.
---

The `CommandDialog` component provides a dialog interface for executing commands with built-in form handling and validation.

## Purpose

CommandDialog simplifies the process of presenting a command form to users within a modal dialog. It handles command execution, validation, and result management automatically.

## Key Features

- Binds `CommandForm` field children to one command instance
- Keeps the confirm button disabled until the command passes client validation
- Field-level change tracking and custom field validation
- Pre-execution transformation of values
- Success and cancellation handling through the Arc dialog context
- Busy state management during command execution (buttons and fields disabled, spinner shown)
- Integration with Cratis Arc command system

## Recommended Usage Pattern

For new implementations, use the same dialog pattern as other typed dialogs:

- Open dialogs through `useDialog<TResult>()`
- Close from inside the dialog through `useDialogContext<TRequest, TResult>()` when you need to return a value
- `await` the dialog at the call site and handle `[dialogResult, value]`

`useDialogContext` takes the request (input props) type first and the result type second. When the dialog returns the command's response, use the response type as `TResult` and pass it to `closeDialog` from `onSuccess`.

## Basic Usage

The example assumes `CreateProject` is the proxy Arc generates from a C# `[Command]` whose `Handle()` returns a `CreateProjectResponse`, and that the app renders `<Arc>` around `CratisComponentsProvider`.

```tsx
import { DialogResult, useDialog, useDialogContext } from '@cratis/arc.react/dialogs';
import { CommandDialog } from '@cratis/components/CommandDialog';
import { InputTextField } from '@cratis/components/CommandForm';
import { CreateProject } from './CreateProject';

type CreateProjectResponse = {
    projectId: string;
};

const CreateProjectDialog = () => {
    const { closeDialog } = useDialogContext<object, CreateProjectResponse>();

    return (
        <CommandDialog<CreateProject, CreateProjectResponse>
            command={CreateProject}
            title='Create project'
            okLabel='Create'
            onSuccess={(response) => closeDialog(DialogResult.Ok, response)}
        >
            <InputTextField<CreateProject> value={(c) => c.name} title='Name' />
            <InputTextField<CreateProject> value={(c) => c.email} title='Contact email' type='email' />
        </CommandDialog>
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

What happens when the user clicks **Create**:

1. The command runs. While it is in flight the dialog is busy (see [Busy State](#busy-state)).
2. On failure the matching result callbacks fire, field errors from the server appear on the form, and the dialog stays open.
3. On success `onSuccess` receives the typed response. Here it calls `closeDialog(DialogResult.Ok, response)`, which closes the dialog and resolves the caller's `await` with the response. `CommandDialog` then also closes through the dialog context with `DialogResult.Ok`; `useDialog` has already resolved, so that second close changes nothing.

**Cancel**, the header close (X), `Escape`, and a backdrop click close the dialog with `DialogResult.Cancelled` without any callback. You only need `onSuccess` here because the caller wants the response; a dialog whose caller only needs to know that it succeeded can leave out every callback.

## Initialize command values

A generated command proxy starts with every property unset. Arc's client validation reports any non-optional property that is still `undefined` or `null`, so the confirm button stays disabled until each one has a value. Values that no field renders, such as the id of the item being edited, must be seeded explicitly.

| Prop | When it applies | Counts for validation before confirm |
| ---- | --------------- | ------------------------------------ |
| `initialValues` | Seeds the command when the form mounts and becomes the change-tracking baseline | Yes |
| `currentValues` | Overlays values the parent keeps changing; the form re-validates when they change | Yes |
| `onBeforeExecute` | Transforms the values only after the user clicks confirm, immediately before execution | No |

Pass required ids and the values being edited through `initialValues`:

```tsx
import { useDialog } from '@cratis/arc.react/dialogs';
import { CommandDialog } from '@cratis/components/CommandDialog';
import { InputTextField } from '@cratis/components/CommandForm';
import { Guid } from '@cratis/fundamentals';
import { RenameProject } from './RenameProject';

type RenameProjectDialogProps = {
    projectId: Guid;
    name: string;
};

const RenameProjectDialog = ({ projectId, name }: RenameProjectDialogProps) => (
    <CommandDialog<RenameProject>
        command={RenameProject}
        title='Rename project'
        initialValues={{ projectId, name }}
    >
        <InputTextField<RenameProject> value={(c) => c.name} title='Name' />
    </CommandDialog>
);

export const RenameProjectButton = (props: RenameProjectDialogProps) => {
    const [RenameProjectDialogWrapper, showRenameProjectDialog] = useDialog(RenameProjectDialog);

    return (
        <>
            <button type='button' onClick={() => showRenameProjectDialog(props)}>
                Rename
            </button>
            <RenameProjectDialogWrapper />
        </>
    );
};
```

For a client-generated id, create it once and seed it the same way, for example `const [projectId] = useState(() => Guid.create());` followed by `initialValues={{ projectId }}`. Keeping the value stable avoids generating a new id every time the component renders.

:::caution[Required values seeded in onBeforeExecute never enable confirm]
`onBeforeExecute` runs only after confirm is clicked, and confirm stays disabled while a required value is missing. A required id that only `onBeforeExecute` fills in keeps the dialog stuck with a disabled confirm button and no visible error, because no field shows that property. Seed it through `initialValues` instead.
:::

Field display defaults are not command values either. A `CheckboxField` shows an unchecked box and a `NumberField` shows `0` while the bound property is still unset, so a non-optional `boolean` or `number` keeps confirm disabled until the user edits it. Seed those values, for example `initialValues={{ isActive: false }}`, when the default is an acceptable answer.

## Validation and when confirm enables

The confirm button is enabled when all of the following hold:

- Arc's client validation passes: every non-optional property has a value and the command's client-side validation rules pass. The form validates on mount and after every change.
- The `isValid` prop is not `false`. It can only disable a valid form; `isValid={true}` never enables an invalid one.
- No command is executing.

The form is treated as invalid until its first validation finishes, so confirm starts out disabled for a moment even when every value is already present.

`validateOn` (`'blur'` by default, or `'change'` / `'both'`) and `validateOnInit` only control **when error messages appear**. They do not change when confirm enables. Set `autoServerValidate` to also ask the server's validate endpoint once client validation passes (throttled by `autoServerValidateThrottle`, 500 ms by default); its result also enables or disables confirm.

`onFieldValidate` messages appear on the field, but they do not disable confirm. Use a command validator, `autoServerValidate`, or the `isValid` prop for rules that must block submission. See [Advanced Features](advanced-features.md#field-validation).

## Props

### Required Props

- `command`: Constructor for the command type
- `title`: Dialog title text

### Optional Props

- `visible`: Boolean controlling dialog visibility (defaults to `true`). See [Controlled visibility](#controlled-visibility)
- `initialValues`: Initial values for the command form. See [Initialize command values](#initialize-command-values)
- `currentValues`: Values that the parent keeps in sync with the command
- `populateFromQuery`, `populateFromObservableQuery`, `populateFromQueryArgs`: Seed the form from a query result (Arc `CommandForm` props)
- `onSuccess`: Callback invoked on successful command execution with the typed response
- `onFailed`: Callback invoked when command execution fails with the full `CommandResult<TResponse>`
- `onException`: Callback invoked when the command throws an exception with error messages and stack trace
- `onUnauthorized`: Callback invoked when authorization fails
- `onValidationFailure`: Callback invoked on validation errors with the validation results
- `onConfirm`: Runs only after successful command execution; return `true` to close the dialog
- `onCancel`: Runs for Cancel, the header close (X), `Escape`, and a backdrop click; return `true` to close the dialog
- `onClose`: Fallback used for whichever of `onConfirm` / `onCancel` is absent; closes unless it returns `false`
- `okLabel`: Custom text for confirm button (default: the provider's `messages.dialog.ok`, then `'Ok'`)
- `cancelLabel`: Custom text for cancel button (default: the provider's `messages.dialog.cancel`, then `'Cancel'`)
- `yesLabel`, `noLabel`: Labels for `YesNo` and `YesNoCancel` button modes
- `buttons`: `DialogButtons` value or custom footer content (default: `DialogButtons.OkCancel`). A custom footer does not run the command; keep the predefined buttons unless you execute the command yourself
- `initialFocus`: Where keyboard focus lands when the dialog opens — forwarded to `Dialog` (see below)
- `dismissable`: Whether the header close (X), `Escape`, and a backdrop click are offered. Defaults to `true` for predefined `buttons`
- `closeAriaLabel`: Accessible name for the header close button
- `resizable`: Accepted for source compatibility; the viewport-bounded Cratis dialog has no resize handle
- `isValid`: Additional validity gate combined with command form validity
- `validateOn`, `validateOnInit`, `validateAllFieldsOnChange`: When validation messages are shown
- `autoServerValidate`, `autoServerValidateThrottle`: Server-side validation while the user edits
- `onFieldValidate`: Custom validation function for fields
- `onFieldChange`: Callback when field values change
- `onBeforeExecute`: Transform command values before execution. It must return the values to run with and may be async
- `style`: Custom CSS styles
- `contentStyle`: Custom CSS styles for the dialog content area
- `width`: Dialog width (default: `'450px'`)
- `className`, `pt`: Styling hooks for the Cratis-owned dialog root and stable parts
- `ptOptions`, `unstyled`: Retained temporarily for source compatibility; ignored because Cratis part attributes always merge and styling is CSS-owned

:::note
`isBusy` is managed internally while the command executes, so `CommandDialog` does not accept it. The `Dialog` props `subtitle`, `placement`, and `closeIcon` type-check on `CommandDialog`, but it does not forward them to the dialog, so they have no effect.
:::

## Callback Behavior

### Result Callbacks

`CommandDialog` supports the following result callbacks that are invoked based on the command execution outcome:

- `onSuccess(response: TResponse)`: Invoked when the command executes successfully. Receives the typed response.
- `onFailed(commandResult: CommandResult<TResponse>)`: Invoked when command execution fails for any reason.
- `onException(messages: string[], stackTrace: string)`: Invoked when the command throws an exception.
- `onUnauthorized()`: Invoked when authorization fails.
- `onValidationFailure(validationResults: ValidationResult[])`: Invoked on validation errors.

Multiple callbacks may fire for the same execution. For example, both `onFailed` and `onValidationFailure` will be invoked for validation errors. If `onBeforeExecute` throws, the command does not execute, no result callback runs, and the dialog stays open.

### Dialog Callbacks

"Closes" below means that the dialog calls `closeDialog` from the surrounding `useDialog` context.

| User action | `onConfirm` / `onCancel` present | Only `onClose` present | No callback |
| ----------- | -------------------------------- | ---------------------- | ----------- |
| Confirm, after the command succeeds | `onConfirm()` runs; closes only if it returns `true` | `onClose(DialogResult.Ok)` runs; closes unless it returns `false` | Closes with `DialogResult.Ok` |
| Confirm, command fails | Not called; dialog stays open | Not called; dialog stays open | Dialog stays open |
| Cancel, X, `Escape`, backdrop | `onCancel()` runs; closes only if it returns `true` | `onClose(DialogResult.Cancelled)` runs; closes unless it returns `false` | Closes with `DialogResult.Cancelled` |

A callback that calls `closeDialog(...)` itself closes the dialog regardless of its return value. Use `closeDialog(DialogResult.Ok, value)` when the caller needs a value; the automatic close never passes one.

## Controlled visibility

Without `useDialog` there is no dialog context, so nothing closes automatically. Close the dialog yourself from `onSuccess` and `onCancel`:

```tsx
import { useState } from 'react';
import { CommandDialog } from '@cratis/components/CommandDialog';
import { InputTextField } from '@cratis/components/CommandForm';
import { Guid } from '@cratis/fundamentals';
import { RenameProject } from './RenameProject';

export const RenameProjectInline = ({ projectId, name }: { projectId: Guid; name: string }) => {
    const [visible, setVisible] = useState(false);

    return (
        <>
            <button type='button' onClick={() => setVisible(true)}>
                Rename
            </button>
            {visible && (
                <CommandDialog<RenameProject>
                    command={RenameProject}
                    title='Rename project'
                    initialValues={{ projectId, name }}
                    onSuccess={() => setVisible(false)}
                    onCancel={() => setVisible(false)}
                >
                    <InputTextField<RenameProject> value={(c) => c.name} title='Name' />
                </CommandDialog>
            )}
        </>
    );
};
```

Rendering the dialog only while it is open gives the user a fresh form each time. If you keep it mounted and toggle `visible` instead, the command form stays mounted while hidden, so values typed before a cancel are still there when it opens again. `useDialog` unmounts the dialog when it closes.

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
import { CommandDialog } from '@cratis/components/CommandDialog';
import { DialogInitialFocus } from '@cratis/components/Dialogs';
import { Guid } from '@cratis/fundamentals';
import { DeletePersonalData } from './DeletePersonalData';

export const DeletePersonalDataDialog = ({ personId }: { personId: Guid }) => (
    <CommandDialog<DeletePersonalData>
        command={DeletePersonalData}
        title='Delete personal data?'
        okLabel='Delete'
        initialValues={{ personId }}
        initialFocus={DialogInitialFocus.Cancel}
    >
        This cannot be undone.
    </CommandDialog>
);
```

Pressing `Enter` inside a text field does not submit the command. The footer buttons are plain `type="button"` buttons, so the user confirms by activating the confirm button.

## Busy State

`CommandDialog` automatically manages a busy state from the start of `onBeforeExecute` until command execution settles:

- All buttons, including header close, are disabled and the primary button shows a loading spinner.
- The form fields are disabled and inert, so values cannot change while the command runs.
- Escape and backdrop dismissal are ignored while work is in flight.
- Once execution completes (success or failure), the buttons return to their normal state.
- This prevents duplicate submissions and accidental dismissal while giving users clear visual feedback.

## Context

`CommandDialog` is built on top of `CommandForm` and `Dialog`, and uses command form context internally for values, validation, and execution state.

Field children are bound to the dialog's own command instance. Do not nest another `CommandForm` or an [`AutoCommandForm`](../CommandForm/auto-command-form.md) inside a `CommandDialog`: the inner form has its own command instance, so its fields never reach the command the dialog executes.

## Integration

CommandDialog integrates with:

- `@cratis/arc/commands` for command execution
- `@cratis/arc.react/commands` for form handling
- `@cratis/arc.react/dialogs` for `useDialog`, `useDialogContext`, `DialogResult`, and `DialogButtons`
- React Aria modal/focus behavior behind Cratis-owned markup

## See Also

- [Advanced Features](advanced-features.md) - Field validation, transformation, and change tracking
- [CommandForm](../CommandForm/index.md) - The field components you place inside the dialog
- [StepperCommandDialog](../StepperCommandDialog/index.md) - Split one command across several steps
- [Dialog](../Dialogs/dialog.md) - The underlying dialog and its close semantics
