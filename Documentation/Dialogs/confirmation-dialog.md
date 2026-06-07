# ConfirmationDialog

Dialog for confirming user actions.

## Purpose

ConfirmationDialog prompts users to confirm or cancel an action.

## Key Features

- Built-in confirm and cancel buttons
- Configurable button set (`DialogButtons`)
- Host-rendered — triggered with a hook, awaited as a `Promise<DialogResult>`
- Modal behavior

## Host-rendered

`ConfirmationDialog` is rendered by the dialog host, not instantiated directly. Register it once with `DialogComponents`, then trigger it from anywhere with the `useConfirmationDialog` hook. The request carries the `title`, `message`, and `buttons` — there are no per-instance label/icon/callback props.

## Basic Usage

Register the dialog component near the root of your app:

```typescript
import { ConfirmationDialog } from '@cratis/components/Dialogs';
import { DialogComponents } from '@cratis/arc.react/dialogs';

export const App = () => (
    <DialogComponents confirmation={ConfirmationDialog}>
        <YourApp />
    </DialogComponents>
);
```

Trigger it from a component and await the result:

```typescript
import { useConfirmationDialog, DialogButtons, DialogResult } from '@cratis/arc.react/dialogs';

function MyComponent() {
    const [showConfirm] = useConfirmationDialog(
        'Confirm Delete',
        'Are you sure you want to delete this item?',
        DialogButtons.YesNo
    );

    const handleDelete = async () => {
        const result = await showConfirm();
        if (result === DialogResult.Yes) {
            deleteItem();
        }
    };

    return <button onClick={handleDelete}>Delete</button>;
}
```

## Request

The `ConfirmationDialogRequest` the host threads into the dialog carries:

- `title`: Dialog header text
- `message`: Confirmation message
- `buttons`: A `DialogButtons` value (`Ok`, `OkCancel`, `YesNo`, or `YesNoCancel`)

`useConfirmationDialog(title?, message?, buttons?)` returns `[showConfirm]`, where `showConfirm()` returns a `Promise<DialogResult>` resolving to the button the user picked.

## Examples

### Delete confirmation

```typescript
const [showConfirm] = useConfirmationDialog(
    'Delete Item',
    'This action cannot be undone. Are you sure?',
    DialogButtons.YesNo
);

const onDelete = async () => {
    if (await showConfirm() === DialogResult.Yes) {
        deleteItem();
    }
};
```

### Save changes

```typescript
const [showConfirm] = useConfirmationDialog(
    'Unsaved Changes',
    'You have unsaved changes. Do you want to save them?',
    DialogButtons.YesNoCancel
);

const onLeave = async () => {
    const result = await showConfirm();
    if (result === DialogResult.Yes) {
        await save();
    } else if (result === DialogResult.No) {
        discard();
    }
    // DialogResult.Cancelled keeps the user on the page
};
```

### Proceed with action

```typescript
const [showConfirm] = useConfirmationDialog(
    'Confirm Action',
    'This will affect all users. Continue?',
    DialogButtons.OkCancel
);

const onProceed = async () => {
    if (await showConfirm() === DialogResult.Ok) {
        proceed();
    }
};
```
