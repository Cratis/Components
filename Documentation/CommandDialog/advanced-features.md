---
title: CommandDialog advanced features
description: Handle typed responses and failures, validate and track fields, and transform values before a CommandDialog executes its command.
---

Once the dialog has the values it needs, choose how to validate edits, transform the submitted values, and use the command's response. The snippets on this page are excerpts. They assume generated command proxies such as `CreateUser`, and app helpers such as `showNotification` and `navigate`. For the dialog lifecycle and how to open and close the dialog, start with [CommandDialog](index.md).

## Response Type Handling

The second type parameter describes the command's response. Here `onSuccess` uses the new user's id for navigation and the response message for a notification; the failure callbacks handle unsuccessful command results instead:

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

The `CreateUser` command has already succeeded when `onSuccess` receives this response. The notification and navigation are client work that follows creation, not part of the command's outcome. In this excerpt those helpers are called without awaiting a result. If your helpers return promises and later work depends on them, await or return those promises from the callback.

### Callback Execution Order

The busy state ends before result callbacks run, and each callback is awaited before the next begins. Success takes the `onSuccess` path; failure takes `onFailed` followed by each matching specialized callback in this order:

1. **onSuccess**: Only fires when `commandResult.isSuccess` is `true`
2. **onFailed**: Fires for any failure (validation, exception, unauthorized, etc.)
3. **onException**: Fires specifically when an exception occurs
4. **onUnauthorized**: Fires specifically when authorization fails
5. **onValidationFailure**: Fires specifically when validation fails

For example, a validation failure reaches `onFailed` before `onValidationFailure`. After the failure callbacks complete, the result is applied to the form so server validation messages appear on the matching fields; the dialog stays open. On success, `onSuccess` completes before `onConfirm` or the `onClose` fallback and the subsequent automatic close.

There is no catch around these result callbacks. If `onFailed` rejects, the remaining failure callbacks and the form's result update are skipped. If `onSuccess` rejects, the subsequent automatic close path is skipped; a dialog explicitly closed inside the callback is already closed. The command's success or failure does not change because a callback failed.

Catch notification or navigation errors where you handle that client work, and decide how to report or recover the failed client action. Do not retry an already successful `CreateUser` command just because its notification failed. Awaiting client work controls callback order and automatic closure, but does not keep the dialog busy or the fields disabled; confirm still follows the dialog's validity and busy checks.

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

Use `onFieldValidate` for a rule tied to a field edit. It runs synchronously each time a field value changes and returns the message to show, or `undefined` to clear that field's custom error. In this example an email edit without `@` produces a message; a later edit that includes `@` clears it:

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

:::caution[Custom field errors block confirm in Arc React 22.153.1]
With `@cratis/arc.react` 22.153.1, an `onFieldValidate` error makes the form invalid and disables confirm until the custom error is cleared. Older versions can show the message without disabling confirm. When using an older version, check this behavior before relying on it to block submission; use a command validator, `autoServerValidate`, or an external `isValid` gate if needed.

Choose command validators for rules that belong to the command, and enable `autoServerValidate` when the server's validation verdict should count before submit. `isValid={false}` can add a separate submission gate, but `isValid={true}` cannot override an invalid form. Keep validation and authorization on the server too: custom client errors are not a security boundary.
:::

## Pre-execution Transformation

Use `onBeforeExecute` for final normalization, such as trimming an email address before sending it. It receives the current command values and must return the values to run with. It may be async, and it runs inside the busy state:

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

The password branch reports the first rule that fails, so fixing the length can reveal the uppercase or number requirement on the next edit. Returning `undefined` clears the changed field's custom error; it does not clear errors on other fields.

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

A cross-field message is attached to the field that changed. Editing `password` afterwards does not re-run the check for `confirmPassword`, so the confirmation message can remain out of date until that field is edited again. Put rules that must hold across the whole command in a command validator rather than relying only on the last field edit.

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

The same pre-execution hook can normalize more than one property. This example trims and lowercases the email address and converts the date value before returning the values to execute:

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
