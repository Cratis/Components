---
title: StepperCommandDialog advanced features
description: Handle typed responses and failures, validate fields across steps, and transform values before a StepperCommandDialog executes its command.
---

All advanced features described here apply to every step in the wizard, because all steps share a single underlying command instance.

The snippets are excerpts. They assume a generated command proxy such as `CreateProject`, field imports from `@cratis/components/CommandForm`, and app helpers such as `showNotification` and `navigate`. For opening and closing the dialog, start with [StepperCommandDialog](index.md).

## Response Type Handling

`StepperCommandDialog` supports typed command responses and provides callbacks for different execution outcomes:

```tsx
import { StepperCommandDialog, StepperPanel } from '@cratis/components/CommandDialog';
import { InputTextField, TextAreaField } from '@cratis/components/CommandForm';

type CreateProjectResponse = {
    projectId: string;
    message: string;
};

<StepperCommandDialog<CreateProject, CreateProjectResponse>
    command={CreateProject}
    title="Create Project"
    onSuccess={(response) => {
        // Handle successful creation - response is fully typed
        console.log(`Project created with ID: ${response.projectId}`);
        showNotification(response.message);
        navigate(`/projects/${response.projectId}`);
    }}
    onFailed={(commandResult) => {
        // Handle any failure - includes all failure details
        console.error('Command failed:', commandResult);
    }}
    onException={(messages, stackTrace) => {
        // Handle exceptions specifically
        console.error('Exception occurred:', messages.join(', '));
    }}
    onUnauthorized={() => {
        // Handle authorization failures
        showNotification('You are not authorized to perform this action');
    }}
    onValidationFailure={(validationResults) => {
        // Handle validation failures
        const errors = validationResults.map(r => r.message).join(', ');
        showNotification(`Validation failed: ${errors}`);
    }}
>
    <StepperPanel header="Basic Info">
        <InputTextField<CreateProject> value={c => c.name} title="Name" />
    </StepperPanel>
    <StepperPanel header="Details">
        <TextAreaField<CreateProject> value={c => c.description} title="Description" />
    </StepperPanel>
</StepperCommandDialog>
```

### Callback Execution Order

Multiple callbacks may fire for the same command execution:

1. **onSuccess**: Only fires when `commandResult.isSuccess` is `true`
2. **onFailed**: Fires for any failure (validation, exception, unauthorized, etc.)
3. **onException**: Fires specifically when an exception occurs
4. **onUnauthorized**: Fires specifically when authorization fails
5. **onValidationFailure**: Fires specifically when validation fails

For example, a validation failure will trigger both `onFailed` and `onValidationFailure`. On failure the dialog stays open, server validation messages appear on their fields, and the steps holding those fields turn red.

### Response Type Inference

The response type parameter is optional and defaults to `object`:

```tsx
// Explicit response type
<StepperCommandDialog<CreateProject, CreateProjectResponse>
    command={CreateProject}
    title="Create Project"
    onSuccess={(response) => {
        // response is CreateProjectResponse
    }}
>
    <StepperPanel header="Basic Info">
        <InputTextField<CreateProject> value={c => c.name} title="Name" />
    </StepperPanel>
</StepperCommandDialog>

// Default object response type
<StepperCommandDialog<CreateProject>
    command={CreateProject}
    title="Create Project"
    onSuccess={(response) => {
        // response is object
    }}
>
    <StepperPanel header="Basic Info">
        <InputTextField<CreateProject> value={c => c.name} title="Name" />
    </StepperPanel>
</StepperCommandDialog>
```

## Field Validation

Provide custom validation logic for individual fields. `onFieldValidate` runs synchronously each time a field value changes and returns the message to show, or `undefined`:

```tsx
<StepperCommandDialog<CreateProject>
    command={CreateProject}
    title="Create Project"
    onFieldValidate={(command, fieldName, oldValue, newValue) => {
        if (fieldName === 'email' && !String(newValue ?? '').includes('@')) {
            return 'Invalid email address';
        }
        return undefined;
    }}
>
    <StepperPanel header="Contact">
        <InputTextField<CreateProject> value={c => c.email} title="Email" />
    </StepperPanel>
</StepperCommandDialog>
```

A message from `onFieldValidate` shows on the field, turns its step red, and disables Next on that step. It does not hide Submit, which follows the command's own validation. Express rules that must block submission as a validator on the command, enable `autoServerValidate`, or pass `isValid={false}` while the rule fails.

## Pre-execution Transformation

Transform command values before execution. The transformation runs after Submit is clicked on the last step, inside the busy state, and immediately before the command executes. It must return the values to run with and may be async:

```tsx
<StepperCommandDialog<CreateProject>
    command={CreateProject}
    title="Create Project"
    onBeforeExecute={(values) => {
        values.email = values.email.trim().toLowerCase();
        return values;
    }}
>
    <StepperPanel header="Contact">
        <InputTextField<CreateProject> value={c => c.email} title="Email" />
    </StepperPanel>
</StepperCommandDialog>
```

Because it runs after validation, it cannot make Submit appear. Seed required values through `initialValues`.

## Custom Inputs

When steps contain custom controls instead of `CommandForm` fields, keep the command instance synchronized with the custom input values. `StepperCommandDialog` still uses command-form validity as the source of truth, and `isValid` is only an additional external gate.

Prefer `currentValues` for externally managed values so client validation sees the same command values that will be submitted. `onBeforeExecute` can still perform final transformations, but values populated only in `onBeforeExecute` are not visible to client validation before the final Submit button is clicked:

```tsx
<StepperCommandDialog<UpdateProject>
    command={UpdateProject}
    title="Update project"
    currentValues={projectDraft}
    isValid={projectDraft.stepsComplete}
>
    <StepperPanel header="Review">
        <ProjectDraftSummary draft={projectDraft} />
    </StepperPanel>
</StepperCommandDialog>
```

## Field Change Tracking

React to field value changes across any step:

```tsx
<StepperCommandDialog<CreateProject>
    command={CreateProject}
    title="Create Project"
    onFieldChange={(command, fieldName, oldValue, newValue) => {
        console.log(`${fieldName} changed from ${oldValue} to ${newValue}`);
    }}
>
    <StepperPanel header="Basic Info">
        <InputTextField<CreateProject> value={c => c.name} title="Name" />
    </StepperPanel>
</StepperCommandDialog>
```

## Complex Validation Example

Combining multiple validation patterns across fields:

```typescript
const validateField = (command: CreateProject, fieldName: string, oldValue: unknown, newValue: unknown) => {
    switch (fieldName) {
        case 'email':
            if (!newValue || !String(newValue).includes('@')) {
                return 'Valid email address is required';
            }
            break;

        case 'budget':
            if (Number(newValue) <= 0) {
                return 'Budget must be greater than zero';
            }
            if (Number(newValue) > 10_000_000) {
                return 'Budget exceeds the maximum allowed value';
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

## Cross-step Validation

Because all steps share the same command instance, you can validate a field on one step against a value entered on a different step:

```typescript
const validateField = (command: CreateProject, fieldName: string, oldValue: unknown, newValue: unknown) => {
    // endDate is on step 3, startDate was entered on step 1 — command has both
    if (fieldName === 'endDate' && (newValue as Date) < command.startDate) {
        return 'End date must be after start date';
    }

    if (fieldName === 'confirmPassword' && newValue !== command.password) {
        return 'Passwords do not match';
    }

    return undefined;
};
```

The message is attached to the field that changed, and it stays until that field changes again. Going back and editing `startDate` does not re-check `endDate`.

:::note
The step indicator circles reflect per-step validation state, so errors in step 1 remain visible (red circle) even after the user navigates to step 3.
:::

## Dynamic Field Updates

React to one field changing, regardless of which step it is on:

```typescript
const handleFieldChange = (command: CreateOrder, fieldName: string, oldValue: unknown, newValue: unknown) => {
    if (fieldName === 'country' && newValue === 'USA') {
        // Could trigger state updates or side effects
        console.log('Country changed to USA, update state list');
    }

    if (fieldName === 'quantity') {
        // Calculate derived values from fields on other steps
        const total = Number(newValue) * command.pricePerUnit;
        console.log('New total:', total);
    }
};
```

To change another command property as a result, keep the value in component state and pass it through `currentValues`.

## Async Validation

`onFieldValidate` is synchronous: a returned promise is not awaited. For a rule that needs the server, such as checking that a project name is still free, write it as a validator on the backend command and enable server validation while the user edits:

```tsx
<StepperCommandDialog<CreateProject>
    command={CreateProject}
    title="Create Project"
    autoServerValidate
    autoServerValidateThrottle={500}
>
    <StepperPanel header="Basic Info">
        <InputTextField<CreateProject> value={c => c.name} title="Name" />
    </StepperPanel>
</StepperCommandDialog>
```

Once client validation passes, the form calls the command's validate endpoint `autoServerValidateThrottle` milliseconds (500 by default) after the last change. The server result is shown on the fields and also decides whether Submit appears.

## Pre-execution Data Transformation

Common transformation scenarios run just before the command executes:

```typescript
const transformBeforeExecute = (values: CreateProject): CreateProject => {
    // Normalize data
    values.email = values.email.toLowerCase().trim();

    // Convert formats
    values.startDate = new Date(values.startDate);

    return values;
};
```

The returned values are copied onto the command by property name, and only properties the command declares are sent. A key the command does not have, such as a `timestamp` or a total derived from several steps, has no effect; add it to the backend command if the server needs it. Do not set a required property to `undefined` to drop a UI-only field: the command validates again before the request and rejects it.
