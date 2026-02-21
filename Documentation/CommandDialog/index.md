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

## Basic Usage

```typescript
import { CommandDialog } from '@cratis/components';
import { MyCommand } from './commands';

function MyComponent() {
    const [visible, setVisible] = useState(false);

    const handleConfirm = async (result) => {
        if (result.isSuccess) {
            // Handle success
            setVisible(false);
        }
    };

    return (
        <CommandDialog
            command={MyCommand}
            visible={visible}
            header="Execute Command"
            onConfirm={handleConfirm}
            onCancel={() => setVisible(false)}
        >
            {/* Custom form fields go here */}
        </CommandDialog>
    );
}
```

## Props

### Required Props

- `command`: Constructor for the command type
- `visible`: Boolean controlling dialog visibility
- `header`: Dialog title text
- `onConfirm`: Callback function when command succeeds
- `onCancel`: Callback function when dialog is cancelled

### Optional Props

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

The component provides a `CommandDialogContext` accessible via `useCommandDialogContext` hook for child components to access dialog state and callbacks.

## Integration

CommandDialog integrates with:

- `@cratis/arc/commands` for command execution
- `@cratis/arc.react/commands` for form handling
- PrimeReact Dialog component for UI

## See Also

- [Advanced Features](advanced-features.md) - Field validation, transformation, and change tracking
