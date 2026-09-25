---
title: CommandDialog advanced features
description: Handle typed responses and failures, validate and track fields, and transform values before a CommandDialog executes its command.
---

The snippets on this page are excerpts. They assume generated command proxies such as `CreateUser`, and app helpers such as `showNotification` and `navigate`. For the dialog lifecycle and how to open and close the dialog, start with [CommandDialog](index.md).

## Response Type Handling

`CommandDialog` supports typed command responses and provides callbacks for different execution outcomes:

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';

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
>
    <InputTextField<CreateUser> value={(c) => c.username} title="Username" />
</CommandDialog>
```

### Callback Execution Order

Multiple callbacks may fire for the same command execution:

1. **onSuccess**: Only fires when `commandResult.isSuccess` is `true`
2. **onFailed**: Fires for any failure (validation, exception, unauthorized, etc.)
3. **onException**: Fires specifically when an exception occurs
4. **onUnauthorized**: Fires specifically when authorization fails
5. **onValidationFailure**: Fires specifically when validation fails

For example, a validation failure will trigger both `onFailed` and `onValidationFailure`. On failure the dialog stays open and server validation messages appear on the matching fields.

### Response Type Inference

The response type parameter is optional and defaults to `object`:

```tsx
// Explicit response type
<CommandDialog<CreateUser, CreateUserResponse>
    command={CreateUser}
    title="Create User"
    onSuccess={(response) => {
        // response is CreateUserResponse
    }}
/>

// Default object response type
<CommandDialog<CreateUser>
    command={CreateUser}
    title="Create User"
    onSuccess={(response) => {
        // response is object
    }}
/>
```

## Field Validation

Provide custom validation logic for individual fields. `onFieldValidate` runs synchronously each time a field value changes and returns the message to show, or `undefined`:

```tsx
<CommandDialog<CreateUser>
    command={CreateUser}
    title="Create User"
    onFieldValidate={(command, fieldName, oldValue, newValue) => {
        if (fieldName === 'email' && !String(newValue ?? '').includes('@')) {
            return 'Invalid email address';
        }
        return undefined;
    }}
>
    <InputTextField<CreateUser> value={(c) => c.email} title="Email" type="email" />
</CommandDialog>
```

:::caution[onFieldValidate does not disable confirm]
The message appears on the field, but the confirm button follows the command's own validation. To block submission, express the rule as a validator on the command, enable `autoServerValidate` so the server's verdict counts before submit, or pass `isValid={false}` while the rule fails.
:::

## Pre-execution Transformation

Transform command values before execution. `onBeforeExecute` receives the current command values and must return the values to run with. It may be async, and it runs inside the busy state:

```tsx
<CommandDialog<CreateUser>
    command={CreateUser}
    title="Create User"
    onBeforeExecute={(values) => {
        values.email = values.email.trim().toLowerCase();
        return values;
    }}
/>
```

It runs only after the user clicks confirm, so it cannot make an invalid form valid. Seed required values through `initialValues`, as described in [Initialize command values](index.md#initialize-command-values). If the callback returns nothing, `CommandDialog` keeps the current values and logs a warning.

## Custom Inputs

When dialog content is not built from `CommandForm` fields, keep the command instance synchronized with the custom input values. `CommandDialog` still uses command-form validity as the source of truth, and `isValid` is only an additional external gate.

Prefer `currentValues` for externally managed values so client validation sees the same command values that will be submitted. `onBeforeExecute` can still perform final transformations, but values populated only in `onBeforeExecute` are not visible to client validation before the confirm button is clicked:

```tsx
<CommandDialog<UpdateProject>
    command={UpdateProject}
    title="Update project"
    currentValues={projectDraft}
    isValid={projectDraft.name.trim().length > 0}
/>
```

## Field Change Tracking

React to field value changes:

```tsx
<CommandDialog<CreateUser>
    command={CreateUser}
    title="Create User"
    onFieldChange={(command, fieldName, oldValue, newValue) => {
        console.log(`${fieldName} changed from ${oldValue} to ${newValue}`);
    }}
/>
```

`onFieldChange` also receives a fifth argument with the field's current validation state (`{ isValid, errors }`).

## Complex Validation Example

Combining multiple validation patterns in one `onFieldValidate` callback:

```typescript
const validateField = (command: CreateUser, fieldName: string, oldValue: unknown, newValue: unknown) => {
    switch (fieldName) {
        case 'email':
            if (!newValue || !String(newValue).includes('@')) {
                return 'Valid email address is required';
            }
            break;

        case 'age':
            if (Number(newValue) < 18) {
                return 'Must be at least 18 years old';
            }
            if (Number(newValue) > 120) {
                return 'Please enter a valid age';
            }
            break;

        case 'password': {
            const password = String(newValue ?? '');
            if (password.length < 8) {
                return 'Password must be at least 8 characters';
            }
            if (!/[A-Z]/.test(password)) {
                return 'Password must contain an uppercase letter';
            }
            if (!/[0-9]/.test(password)) {
                return 'Password must contain a number';
            }
            break;
        }
    }
    return undefined;
};
```

## Cross-field Validation

Validate fields based on other field values. The `command` argument already holds the new value:

```typescript
const validateField = (command: CreateUser, fieldName: string, oldValue: unknown, newValue: unknown) => {
    if (fieldName === 'confirmPassword' && newValue !== command.password) {
        return 'Passwords do not match';
    }

    if (fieldName === 'endDate' && (newValue as Date) < command.startDate) {
        return 'End date must be after start date';
    }

    return undefined;
};
```

A cross-field message is attached to the field that changed. Editing `password` afterwards does not re-run the check for `confirmPassword`.

## Dynamic Field Updates

React to one field changing, for example to update component state:

```typescript
const handleFieldChange = (command: CreateOrder, fieldName: string, oldValue: unknown, newValue: unknown) => {
    if (fieldName === 'country' && newValue === 'USA') {
        // Could trigger state updates or side effects
        console.log('Country changed to USA, update state list');
    }

    if (fieldName === 'quantity') {
        // Calculate derived values
        const total = Number(newValue) * command.pricePerUnit;
        console.log('New total:', total);
    }
};
```

To change another command property as a result, keep the value in component state and pass it through `currentValues`, so the form re-validates with it.

## Async Validation

`onFieldValidate` is synchronous: a returned promise is not awaited. For a rule that needs the server, such as checking that a username is available, write it as a validator on the backend command and turn on server validation while the user edits:

```tsx
<CommandDialog<CreateUser>
    command={CreateUser}
    title="Create User"
    autoServerValidate
    autoServerValidateThrottle={500}
>
    <InputTextField<CreateUser> value={(c) => c.username} title="Username" />
</CommandDialog>
```

Once client validation passes, the form calls the command's validate endpoint, waiting `autoServerValidateThrottle` milliseconds (500 by default) after the last change. The server result is shown on the fields and also enables or disables confirm.

## Pre-execution Data Transformation

Common transformation scenarios:

```typescript
const transformBeforeExecute = (values: CreateUser): CreateUser => {
    // Normalize data
    values.email = values.email.toLowerCase().trim();

    // Convert formats
    values.dateOfBirth = new Date(values.dateOfBirth);

    return values;
};
```

The returned values are copied onto the command by property name, and only properties the command declares are sent. Adding a key the command does not have, such as a `timestamp` or a derived total, has no effect; add it to the backend command if the server needs it. Do not set a required property to `undefined` to "remove" a UI-only field: the command's own validation runs again before the request and rejects it.
