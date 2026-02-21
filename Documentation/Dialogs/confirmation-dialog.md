# ConfirmationDialog

Dialog for confirming user actions.

## Purpose

ConfirmationDialog prompts users to confirm or cancel an action.

## Key Features

- Confirm and cancel buttons
- Custom labels and icons
- Callback handlers
- Modal behavior

## Basic Usage

```typescript
import { ConfirmationDialog } from '@cratis/components';

function MyComponent() {
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = () => {
        setShowConfirm(true);
    };

    const handleConfirm = () => {
        // Perform the action
        deleteItem();
        setShowConfirm(false);
    };

    return (
        <>
            <button onClick={handleDelete}>Delete</button>
            {showConfirm && (
                <ConfirmationDialog
                    title="Confirm Delete"
                    message="Are you sure you want to delete this item?"
                    confirmLabel="Delete"
                    cancelLabel="Cancel"
                    onConfirm={handleConfirm}
                    onCancel={() => setShowConfirm(false)}
                />
            )}
        </>
    );
}
```

## Props

- `title`: Dialog header text
- `message`: Confirmation message
- `confirmLabel`: Text for confirm button (default: "Yes")
- `cancelLabel`: Text for cancel button (default: "No")
- `confirmIcon`: Icon for confirm button
- `cancelIcon`: Icon for cancel button
- `onConfirm`: Callback when confirmed
- `onCancel`: Callback when cancelled

## Examples

### Delete Confirmation

```typescript
<ConfirmationDialog
    title="Delete Item"
    message="This action cannot be undone. Are you sure?"
    confirmLabel="Delete"
    cancelLabel="Keep"
    onConfirm={handleDelete}
    onCancel={handleCancel}
/>
```

### Save Changes

```typescript
<ConfirmationDialog
    title="Unsaved Changes"
    message="You have unsaved changes. Do you want to save them?"
    confirmLabel="Save"
    cancelLabel="Discard"
    onConfirm={handleSave}
    onCancel={handleDiscard}
/>
```

### Proceed with Action

```typescript
<ConfirmationDialog
    title="Confirm Action"
    message="This will affect all users. Continue?"
    confirmLabel="Continue"
    cancelLabel="Cancel"
    onConfirm={handleProceed}
    onCancel={handleCancel}
/>
```
