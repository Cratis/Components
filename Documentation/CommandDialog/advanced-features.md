# CommandDialog - Advanced Features

## Field Validation

Provide custom validation logic for individual fields:

```typescript
const validateField = (command, fieldName, oldValue, newValue) => {
    if (fieldName === 'email' && !newValue.includes('@')) {
        return 'Invalid email address';
    }
    return undefined;
};

<CommandDialog
    onFieldValidate={validateField}
    // ... other props
/>
```

## Pre-execution Transformation

Transform command values before execution:

```typescript
const transformBeforeExecute = (values) => {
    return {
        ...values,
        timestamp: new Date()
    };
};

<CommandDialog
    onBeforeExecute={transformBeforeExecute}
    // ... other props
/>
```

## Field Change Tracking

React to field value changes:

```typescript
const handleFieldChange = (command, fieldName, oldValue, newValue) => {
    console.log(`${fieldName} changed from ${oldValue} to ${newValue}`);
};

<CommandDialog
    onFieldChange={handleFieldChange}
    // ... other props
/>
```

## Complex Validation Example

Combining multiple validation patterns:

```typescript
const validateField = (command, fieldName, oldValue, newValue) => {
    switch (fieldName) {
        case 'email':
            if (!newValue || !newValue.includes('@')) {
                return 'Valid email address is required';
            }
            break;
        
        case 'age':
            if (newValue < 18) {
                return 'Must be at least 18 years old';
            }
            if (newValue > 120) {
                return 'Please enter a valid age';
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

## Cross-field Validation

Validate fields based on other field values:

```typescript
const validateField = (command, fieldName, oldValue, newValue) => {
    if (fieldName === 'confirmPassword') {
        if (newValue !== command.password) {
            return 'Passwords do not match';
        }
    }
    
    if (fieldName === 'endDate') {
        if (newValue < command.startDate) {
            return 'End date must be after start date';
        }
    }
    
    return undefined;
};
```

## Dynamic Field Updates

Update other fields when one field changes:

```typescript
const handleFieldChange = (command, fieldName, oldValue, newValue) => {
    if (fieldName === 'country' && newValue === 'USA') {
        // Could trigger state updates or side effects
        console.log('Country changed to USA, update state list');
    }
    
    if (fieldName === 'quantity') {
        // Calculate derived values
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

Common transformation scenarios:

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
        dateOfBirth: new Date(values.dateOfBirth),
        
        // Remove UI-only fields
        confirmPassword: undefined,
        
        // Calculate derived values
        totalPrice: values.quantity * values.pricePerUnit
    };
};
```
