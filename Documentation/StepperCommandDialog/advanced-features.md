# StepperCommandDialog - Advanced Features

All advanced features described here apply to every step in the wizard, because all steps share a single underlying command instance.

## Field Validation

Provide custom validation logic for individual fields:

```typescript
const validateField = (command, fieldName, oldValue, newValue) => {
    if (fieldName === 'email' && !newValue.includes('@')) {
        return 'Invalid email address';
    }
    return undefined;
};

<StepperCommandDialog
    onFieldValidate={validateField}
    // ... other props
>
    <StepperPanel header="Contact">
        <InputTextField<CreateProject> value={c => c.email} title="Email" />
    </StepperPanel>
</StepperCommandDialog>
```

## Pre-execution Transformation

Transform command values before execution. The transformation runs just before Submit is clicked on the last step:

```typescript
const transformBeforeExecute = (values) => {
    return {
        ...values,
        timestamp: new Date()
    };
};

<StepperCommandDialog
    onBeforeExecute={transformBeforeExecute}
    // ... other props
>
```

## Field Change Tracking

React to field value changes across any step:

```typescript
const handleFieldChange = (command, fieldName, oldValue, newValue) => {
    console.log(`${fieldName} changed from ${oldValue} to ${newValue}`);
};

<StepperCommandDialog
    onFieldChange={handleFieldChange}
    // ... other props
>
```

## Complex Validation Example

Combining multiple validation patterns across fields:

```typescript
const validateField = (command, fieldName, oldValue, newValue) => {
    switch (fieldName) {
        case 'email':
            if (!newValue || !newValue.includes('@')) {
                return 'Valid email address is required';
            }
            break;

        case 'budget':
            if (newValue <= 0) {
                return 'Budget must be greater than zero';
            }
            if (newValue > 10_000_000) {
                return 'Budget exceeds the maximum allowed value';
            }
            break;

        case 'password':
            if (newValue.length < 8) {
                return 'Password must be at least 8 characters';
            }
            if (!/[A-Z]/.test(newValue)) {
                return 'Password must contain an uppercase letter';
            }
            if (!/[0-9]/.test(newValue)) {
                return 'Password must contain a number';
            }
            break;
    }
    return undefined;
};
```

## Cross-step Validation

Because all steps share the same command instance, you can validate a field on one step against a value entered on a different step:

```typescript
const validateField = (command, fieldName, oldValue, newValue) => {
    // endDate is on step 3, startDate was entered on step 1 — command has both
    if (fieldName === 'endDate') {
        if (newValue < command.startDate) {
            return 'End date must be after start date';
        }
    }

    if (fieldName === 'confirmPassword') {
        if (newValue !== command.password) {
            return 'Passwords do not match';
        }
    }

    return undefined;
};
```

> The step indicator circles reflect per-step validation state, so errors in step 1 remain visible (red circle) even after the user navigates to step 3.

## Dynamic Field Updates

Update other fields when one field changes, regardless of which step they are on:

```typescript
const handleFieldChange = (command, fieldName, oldValue, newValue) => {
    if (fieldName === 'country' && newValue === 'USA') {
        // Could trigger state updates or side effects
        console.log('Country changed to USA, update state list');
    }

    if (fieldName === 'quantity') {
        // Calculate derived values from fields on other steps
        const total = newValue * command.pricePerUnit;
        console.log('New total:', total);
    }
};
```

## Async Validation

For validation that requires API calls:

```typescript
const validateField = async (command, fieldName, oldValue, newValue) => {
    if (fieldName === 'username') {
        const isAvailable = await checkUsernameAvailability(newValue);
        if (!isAvailable) {
            return 'Username is already taken';
        }
    }
    return undefined;
};
```

## Pre-execution Data Transformation

Common transformation scenarios run just before Submit:

```typescript
const transformBeforeExecute = (values) => {
    return {
        ...values,
        // Add metadata
        timestamp: new Date(),
        userId: getCurrentUserId(),

        // Normalize data
        email: values.email.toLowerCase().trim(),

        // Convert formats
        startDate: new Date(values.startDate),

        // Remove UI-only fields
        confirmPassword: undefined,

        // Calculate derived values gathered across steps
        totalPrice: values.quantity * values.pricePerUnit
    };
};
```
