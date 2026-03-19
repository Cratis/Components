# CommandDialog - Advanced Features

## Response Type Handling

`CommandDialog` supports typed command responses and provides callbacks for different execution outcomes:

```typescript
import { CommandDialog } from '@cratis/components/CommandDialog';
import { ValidationResult } from '@cratis/arc/validation';

type CreateUserResponse = {
    userId: string;
    username: string;
    message: string;
};

<CommandDialog<CreateUser, CreateUserResponse>
    command={CreateUser}
    title="Create User"
    onSuccess={(response) => {
        // Handle successful creation - response is fully typed
        console.log(`User created with ID: ${response.userId}`);
        showNotification(response.message);
        navigate(`/users/${response.userId}`);
    }}
    onFailed={(commandResult) => {
        // Handle any failure - includes all failure details
        console.error('Command failed:', commandResult);
    }}
    onException={(messages, stackTrace) => {
        // Handle exceptions specifically
        console.error('Exception occurred:', messages.join(', '));
        console.error('Stack trace:', stackTrace);
    }}
    onUnauthorized={() => {
        // Handle authorization failures
        showNotification('You are not authorized to perform this action');
        navigate('/login');
    }}
    onValidationFailure={(validationResults) => {
        // Handle validation failures
        const errors = validationResults.map(r => r.message).join(', ');
        showNotification(`Validation failed: ${errors}`);
    }}
/>
```

### Callback Execution Order

Multiple callbacks may fire for the same command execution:

1. **onSuccess**: Only fires when `commandResult.isSuccess` is `true`
2. **onFailed**: Fires for any failure (validation, exception, unauthorized, etc.)
3. **onException**: Fires specifically when an exception occurs
4. **onUnauthorized**: Fires specifically when authorization fails
5. **onValidationFailure**: Fires specifically when validation fails

For example, a validation failure will trigger both `onFailed` and `onValidationFailure`.

### Response Type Inference

The response type parameter is optional and defaults to `object`:

```typescript
// Explicit response type
<CommandDialog<CreateUser, CreateUserResponse>
    command={CreateUser}
    onSuccess={(response) => {
        // response is CreateUserResponse
    }}
/>

// Default object response type
<CommandDialog<CreateUser>
    command={CreateUser}
    onSuccess={(response) => {
        // response is object
    }}
/>
```

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
