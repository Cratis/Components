# Dialog

Base dialog component for creating custom dialogs.

## Purpose

The Dialog component provides a customizable modal dialog foundation for building various types of dialogs.

## Key Features

- Customizable header and footer
- Flexible button configuration
- Modal and non-modal modes
- Responsive sizing
- Integration with PrimeReact Dialog

## Basic Usage

```typescript
import { Dialog } from '@cratis/components';

function MyComponent() {
    const [visible, setVisible] = useState(false);

    return (
        <Dialog
            title="My Dialog"
            visible={visible}
            onCancel={() => setVisible(false)}
            buttons={null}
        >
            <p>Dialog content goes here</p>
        </Dialog>
    );
}
```

## Props

- `title`: Dialog header text
- `visible`: Controls visibility
- `onCancel`: Callback when dialog is closed
- `buttons`: Button configuration (or null for no buttons)
- `width`: Dialog width
- `style`: Custom CSS styles

## With Custom Buttons

```typescript
const buttons = [
    {
        label: 'Save',
        icon: 'pi pi-check',
        onClick: handleSave
    },
    {
        label: 'Cancel',
        icon: 'pi pi-times',
        onClick: () => setVisible(false)
    }
];

<Dialog
    title="Edit Item"
    visible={visible}
    onCancel={() => setVisible(false)}
    buttons={buttons}
>
    {/* Content */}
</Dialog>
```

## Integration

Integrates with PrimeReact Dialog component for consistent styling and behavior.
