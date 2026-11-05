---
title: StepperCommandDialog validation and callbacks
description: StepperCommandDialog shares command values across steps so you can compare fields, handle typed responses, and transform values before submission.
---

`StepperCommandDialog` in Cratis Components shares one Cratis Arc command instance across all steps, so a field can be checked against a value entered earlier in the workflow. Use its callbacks to handle the final result, apply field rules, or transform values before execution without managing a separate command for each step.

Start with [the multi-step dialog example](index.md#basic-usage) if you have not yet connected the dialog to its caller. The excerpts here assume a generated command proxy such as `CreateProject`, field imports from `@cratis/components/CommandForm`, and application helpers such as `showNotification` and `navigate`.

## Response Type Handling

Pass the command's response type as the second type parameter when the next action needs data returned by the server. Here, `CreateProjectResponse` gives `onSuccess` a typed `projectId` and message; a failed result follows the failure callbacks instead.

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

A successful result calls `onSuccess(response)`, then follows the dialog's [close callbacks](index.md#dialog-callbacks). The dialog waits for `onSuccess` to finish before attempting that close.

An unsuccessful result leaves the dialog open and calls callbacks in this order:

1. `onFailed(commandResult)` for every unsuccessful result.
2. `onException(messages, stackTrace)` if the result contains exceptions.
3. `onUnauthorized()` if the result is not authorized.
4. `onValidationFailure(validationResults)` if the result is invalid.

Only applicable callbacks run. A validation failure therefore calls both `onFailed` and `onValidationFailure`; messages that identify command fields appear on those fields and mark their steps red. A rejected `confirmBeforeExecute` guard takes a different path: it calls `onException`, or logs the error if that callback is absent, without calling `onFailed`.

### Response Type Inference

The response type parameter defaults to `object`; it is not inferred from the command type. Supply it explicitly when `onSuccess` needs to access response properties:

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

Use `onFieldValidate` for immediate feedback on an edited field. It runs synchronously each time that field's value changes, receiving the shared command, field name, old value, and new value. Return an error message to show on the field, or `undefined` to clear its custom error:

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

A message from `onFieldValidate` shows on the field, marks its step red, disables Next on that step, and prevents Submit from appearing while the custom error remains. This callback runs on field changes, not when the dialog first opens. Keep required and business rules on the command so they are checked even when a user never edits the field.

## Pre-execution Transformation

Use `onBeforeExecute` for a final adjustment, such as trimming an email address. It runs after Submit is clicked on the valid last step, while the dialog is busy, and before any `confirmBeforeExecute` guard. Return the values to execute; the transformer may be asynchronous:

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

The email must already pass validation for Submit to appear, so this transform cannot repair a value that keeps the button hidden. Seed required values through `initialValues`, or use `currentValues` when they arrive after the dialog opens.

## Custom Inputs

If a step uses custom controls instead of `CommandForm` fields, send their values to the command before submission so validation can see them. `isValid` adds a gate to command-form validity; setting it to `true` cannot make an invalid command submittable.

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

Use `onFieldChange` to react to edits in any panel. The callback receives the shared command alongside the field name and its old and new values, so it can read values from other steps:

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

With `validateOn='blur'` or `'both'`, `onFieldChange` also runs after blur validation, even if the value did not change. Check the old and new values before treating a call as a new edit.

## Complex Validation Example

Keep several custom field rules in one function when the dialog needs them. Pass this function as `onFieldValidate`; its switch selects the rule for the field being edited and returns the first message for that field:

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

A later field can read an earlier step's value from the shared command. Pass the following function as `onFieldValidate` to compare `endDate` with `startDate`, or `confirmPassword` with `password`:

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

The custom error belongs to the field that changed and remains until that field is edited again. Going back and changing `startDate` does not rerun the `endDate` callback. It can leave a stale message, or leave a now-invalid date range without a custom error.

Put relationships that must remain valid on the command validator. To refresh displayed command validation errors across fields as users type, set `validateOn='change'` and `validateAllFieldsOnChange`. That refresh does not rerun `onFieldValidate` for other fields.

Step indicators help users find errors in earlier panels: a displayed field error keeps its step red even while another panel is active.

## Dynamic Field Updates

An `onFieldChange` handler can read another step's values when calculating a result or choosing which data to load. This handler logs a possible country lookup and calculates a total; it does not update another command property:

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

To write a derived value back to the command, keep it in component state and pass it through `currentValues`. The destination must be a declared command property. If that value controls which panels apply, use the [conditional-step pattern](index.md#conditional-steps); hiding a panel does not clear its values or waive command rules.

## Async Validation

`onFieldValidate` cannot await a server check. Put a rule such as project-name uniqueness on the backend command and enable `autoServerValidate` to surface it before submission:

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

Once client validation passes, the form schedules a call to the command's validate endpoint after `autoServerValidateThrottle` milliseconds (500 by default). A later edit restarts that delay. The returned validity affects Submit, and messages identifying fields appear beside them. Client-side validation remains the default while editing; command execution still performs server-side validation without this option.

## Pre-execution Data Transformation

For several final adjustments, pass a named transformer as `onBeforeExecute`. This example normalizes email casing and whitespace, converts the start date, and returns the command values. It has the same timing limits as the earlier email transform:

```typescript
const transformBeforeExecute = (values: CreateProject): CreateProject => {
    // Normalize data
    values.email = values.email.toLowerCase().trim();

    // Convert formats
    values.startDate = new Date(values.startDate);

    return values;
};
```

The returned values are copied onto declared command properties by name; an extra key does not become part of the request. Add a property to the backend command if the server needs it. Do not set a required property to `undefined` to drop a UI-only field: the command validates again before the request and rejects the missing value.

For the next part of the workflow, use [dialog close callbacks](index.md#dialog-callbacks) to decide when the caller resumes, or [confirm before submitting](index.md#confirm-before-submitting) to ask for approval after transformation.
