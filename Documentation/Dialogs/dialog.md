# Dialog

Base dialog component for creating typed dialogs that can be awaited.

## Recommended Pattern

Use `useDialog<T>()` at the call site and `useDialogContext<T>()` inside the dialog component.

- The caller opens the dialog with `await` and receives `[dialogResult, value]`
- The dialog closes itself through `closeDialog(...)`
- The generic `T` is the value returned from the dialog

This pattern gives strongly typed dialog results and a simple async flow.

## Example

```typescript
import { useState } from 'react';
import { DialogResult, useDialog, useDialogContext } from '@cratis/arc.react/dialogs';
import { Dialog } from '@cratis/components/Dialogs';

type Project = {
    id: string;
    name: string;
};

const AddProjectDialog = () => {
    const { closeDialog } = useDialogContext<Project>();
    const [name, setName] = useState('');

    return (
        <Dialog
            title='Add project'
            isValid={name.trim().length > 0}
            onConfirm={() => closeDialog(DialogResult.Ok, { id: crypto.randomUUID(), name })}
            onCancel={() => closeDialog(DialogResult.Cancelled)}
        >
            {/* Dialog content */}
        </Dialog>
    );
};

const MyComponent = () => {
    const [AddProjectDialogWrapper, showAddProjectDialog] = useDialog<Project>(AddProjectDialog);

    const handleAddProject = async () => {
        const [result, project] = await showAddProjectDialog();
        if (result === DialogResult.Ok && project) {
            // Use the typed result
        }
    };

    return (
        <>
            <button onClick={handleAddProject}>Add project</button>
            <AddProjectDialogWrapper />
        </>
    );
};
```

## Props

- `title`: Dialog header text
- `visible`: Controls visibility (defaults to `true`)
- `onConfirm`: Callback for confirm actions
- `onCancel`: Callback for cancel actions
- `onClose`: Fallback close callback
- `buttons`: Predefined `DialogButtons` or custom footer content. A custom
  footer also removes the close (X), stops `Escape` closing the dialog, and
  leaves `onConfirm` / `onCancel` / `onClose` uncalled — the dialog cannot tell
  which of your buttons means what, so a custom footer must close the dialog
  itself through `useDialogContext().closeDialog(...)`
- `width`: Dialog width
- `style`: Custom dialog style forwarded to PrimeReact `Dialog`
- `contentStyle`: Custom content area style forwarded to PrimeReact `Dialog`
- `resizable`: Enables resize
- `isValid`: Enables or disables confirm actions
- `isBusy`: When `true`, disables all buttons and shows a loading spinner on the primary action button
- `initialFocus`: Where keyboard focus lands when the dialog opens (see below)
- `okLabel`, `cancelLabel`, `yesLabel`, `noLabel`: Button labels

## Initial focus

By default the confirm button is focused when a dialog opens, which makes the
common "read it, press Enter" flow cost one keystroke. That default also *arms*
the confirm button: browsers fire `click` from the `keydown` of `Enter`, so a
key still held down from the control that opened the dialog — or the ordinary
habit of pressing `Enter` twice — confirms it immediately.

A dialog with input is protected from this for free, because `isValid` keeps
confirm disabled until the form is complete. A dialog that needs **no** input
is not, which is exactly backwards when the action is destructive. Say where
focus should go with `initialFocus`:

| `DialogInitialFocus` | Focuses |
|---|---|
| `Confirm` (default) | The `Ok` / `Yes` button |
| `Cancel` | The dismissing button — `Cancel`, or `No` when the set has no `Cancel` |
| `Content` | The dialog's own title, so nothing is armed |

```typescript
import { Dialog, DialogInitialFocus } from '@cratis/components/Dialogs';
import { DialogButtons, DialogResult, useDialogContext } from '@cratis/arc.react/dialogs';

const DeletePersonalDataDialog = () => {
    const { closeDialog } = useDialogContext();

    return (
        <Dialog
            title='Delete personal data?'
            buttons={DialogButtons.YesNo}
            initialFocus={DialogInitialFocus.Cancel}
            onConfirm={() => closeDialog(DialogResult.Yes)}
            onCancel={() => closeDialog(DialogResult.No)}
        >
            This permanently removes the person and every record about them.
        </Dialog>
    );
};
```

`Cancel` falls back to `Content` when the button set has nothing to dismiss
with (`DialogButtons.Ok`, a custom footer, or no footer). Focus never stays on
`document.body`: a modal that does not move focus into itself leaves keyboard
and screen-reader users stranded outside the content that just interrupted
them.

`initialFocus` is forwarded by `CommandDialog`, and it changes **only** focus —
the footer, the close (X), `Escape`, and every callback keep working. That is
the difference from the older workaround of replacing `buttons` with a custom
node, which silently gives all of those up.

## Notes

- Prefer `onConfirm` and `onCancel` over `onClose` for clear intent.
- `onConfirm` and `onCancel` should return `true` to close when used.
- `onClose` closes unless it returns `false`.
- For typed, awaitable dialogs, let the dialog call `closeDialog(...)` from `useDialogContext<T>()`.
