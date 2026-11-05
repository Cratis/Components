---
title: CommandDialog responses and field validation
description: Handle CommandDialog responses and failures, block confirmation with field validation, and transform command values before execution.
---

Use `CommandDialog` callbacks to act on a Cratis Arc command's response, explain a failure, or check a field as the user edits it. Keep values needed for validation in the form before confirmation; use `onBeforeExecute` for final transformations, not to supply missing required input.

The snippets assume generated command proxies such as `CreateUser`, and app helpers such as `showNotification` and `navigate`. If you still need to open the dialog and return its result to the calling page, start with the basic example on [CommandDialog](index.md).

## Response Type Handling

Pass the backend response type as the second type argument when you need values from a successful command. In this example, `onSuccess` uses the new user's id to navigate to their page. `onFailed` receives the full failure result; the other callbacks let the app react to specific failure conditions.

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

Success and failure take separate paths. On success, the dialog awaits `onSuccess(response)` and then `onConfirm()`, or `onClose(DialogResult.Ok)` if `onConfirm` is absent, to decide whether to close. To return the response to the calling page, call `closeDialog(DialogResult.Ok, response)` from `onSuccess`; the automatic close does not pass a value.

On failure, the dialog awaits callbacks in this order, skipping any that do not match the result:

1. `onFailed(commandResult)` for every unsuccessful result.
2. `onException(messages, stackTrace)` when `commandResult.hasExceptions` is `true`.
3. `onUnauthorized()` when `commandResult.isAuthorized` is `false`.
4. `onValidationFailure(validationResults)` when `commandResult.isValid` is `false`.

A validation failure therefore calls `onFailed` before `onValidationFailure`, not `onSuccess`. After the failure callbacks finish, the dialog applies the result to the form so matching fields show the server's validation messages. It does not automatically close on failure. See [Dialog Callbacks](index.md#dialog-callbacks) for the close decision and [Confirm before executing](index.md#confirm-before-executing) for guard failures before a command runs.

### Response Type Inference

The response type parameter defaults to `object` when omitted; specify it explicitly to use response properties in `onSuccess`:

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

Use `onFieldValidate` for immediate feedback on an edited field. It runs synchronously each time the field value changes, after the command receives the new value. Return an error message to show on that field and disable confirm, or `undefined` to clear that field's custom error:

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

:::caution[Field callbacks validate edits, not initial values]
`onFieldValidate` does not run on mount or when values arrive through `currentValues`. Put rules that must check those values on the command itself. A custom field error disables confirm until it is cleared, even if the command's own validation passes; `isValid={true}` cannot override it.
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

Use `onFieldChange` to react after an edited value has been written to the command and `onFieldValidate` has run:

```tsx
<CommandDialog<CreateUser>
    command={CreateUser}
    title="Create User"
    onFieldChange={(command, fieldName, oldValue, newValue) => {
        console.log(`${fieldName} changed from ${oldValue} to ${newValue}`);
    }}
/>
```

`onFieldChange` also receives a fifth argument, `{ isValid, errors }`, derived from the form's previous command result. The new value's client validation finishes afterwards, so do not treat that argument as a fresh validation result for the edit.

## Complex Validation Example

When several fields need edit-time checks, branch on `fieldName` in one `onFieldValidate` callback. Each returned message blocks confirm until that field's custom error is cleared:

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

A cross-field message is attached to the field that changed. Editing `password` afterwards does not re-run the check for `confirmPassword` or clear its error, so confirm can remain disabled until the user edits `confirmPassword` again. Use a command validator for a rule that must be rechecked whenever either value changes.

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

Normalize values in `onBeforeExecute` when the command needs a different representation from the one the user entered. Return the values after changing them:

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
