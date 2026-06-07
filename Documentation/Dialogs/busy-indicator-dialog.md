# BusyIndicatorDialog

Dialog with a loading spinner for long-running operations.

## Purpose

BusyIndicatorDialog displays a loading indicator while performing asynchronous operations.

## Key Features

- Animated progress spinner
- Customizable message
- Non-dismissible (no close button)
- Centered layout

## Host-rendered

`BusyIndicatorDialog` is rendered by the dialog host, not instantiated directly. Register it once with `DialogComponents`, then show and hide it with the `useBusyIndicator` hook. The host threads the `title` and `message` from your request into the rendered modal.

## Basic Usage

Register the dialog component near the root of your app:

```typescript
import { BusyIndicatorDialog } from '@cratis/components/Dialogs';
import { DialogComponents } from '@cratis/arc.react/dialogs';

export const App = () => (
    <DialogComponents busyIndicator={BusyIndicatorDialog}>
        <YourApp />
    </DialogComponents>
);
```

Show the indicator around a long-running operation and close it when done:

```typescript
import { useBusyIndicator } from '@cratis/arc.react/dialogs';

function MyComponent() {
    const [showBusy, closeBusy] = useBusyIndicator(
        'Processing',
        'Please wait while we process your request...'
    );

    const handleAsyncOperation = async () => {
        showBusy();
        try {
            await performOperation();
        } finally {
            closeBusy();
        }
    };

    return <button onClick={handleAsyncOperation}>Start Operation</button>;
}
```

## Request

The `BusyIndicatorDialogRequest` the host threads into the dialog carries:

- `title`: Dialog header text
- `message`: Message to display below the spinner

`useBusyIndicator(title?, message?)` returns `[showBusy, closeBusy]` — call `showBusy()` to display the indicator and `closeBusy()` to dismiss it.

## Use Cases

- File uploads
- API calls
- Data processing
- Report generation
- Batch operations

## Integration

Uses PrimeReact ProgressSpinner for the loading animation.
