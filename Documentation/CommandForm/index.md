# CommandForm

The `CommandForm` component provides form field components for building command input forms with automatic type handling and validation.

## Purpose

CommandForm offers a complete set of form field components designed to work seamlessly with Cratis Arc commands. It handles different data types, validation, and integration with command execution.

## Key Features

- Automatic field type detection
- Support for various input types (text, number, date, boolean, etc.)
- Built-in validation
- Integration with CommandDialog
- Type-safe field handling

## Available Field Components

The CommandForm module exports specialized field components for different data types and use cases. These components are designed to be used within CommandDialog or other command execution contexts.

## Integration

CommandForm fields are typically used as children of CommandDialog:

```typescript
import { CommandDialog } from '@cratis/components';
import { TextField, NumberField, BooleanField } from '@cratis/components/CommandForm';

<CommandDialog command={MyCommand} visible={visible} /* ... */>
    <TextField name="title" label="Title" />
    <NumberField name="quantity" label="Quantity" />
    <BooleanField name="active" label="Active" />
</CommandDialog>
```

## Field Types

The CommandForm module includes specialized components for:

- Text input fields
- Numeric input fields
- Boolean checkboxes
- Date and time pickers
- Select dropdowns
- Multi-select components
- Complex object editors

Each field component is designed to handle its specific data type and provide appropriate validation and user experience.
