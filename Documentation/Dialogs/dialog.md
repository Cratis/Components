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
- `buttons`: Predefined `DialogButtons` or custom footer content
- `width`: Dialog width
- `style`: Custom dialog style forwarded to PrimeReact `Dialog`
- `contentStyle`: Custom content area style forwarded to PrimeReact `Dialog`
- `resizable`: Enables resize
- `isValid`: Enables or disables confirm actions
- `isBusy`: When `true`, disables all buttons and shows a loading spinner on the primary action button
- `okLabel`, `cancelLabel`, `yesLabel`, `noLabel`: Button labels

## Notes

- Prefer `onConfirm` and `onCancel` over `onClose` for clear intent.
- `onConfirm` and `onCancel` should return `true` to close when used.
- `onClose` closes unless it returns `false`.
- For typed, awaitable dialogs, let the dialog call `closeDialog(...)` from `useDialogContext<T>()`.
