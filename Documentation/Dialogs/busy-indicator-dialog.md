---
title: BusyIndicatorDialog
description: Block the screen with a host-rendered spinner dialog while a long-running operation completes.
---

Dialog with a loading spinner for long-running operations.

## Purpose

BusyIndicatorDialog displays a loading indicator while performing asynchronous operations.

## Key Features

- Animated progress spinner
- Customizable message
- Non-dismissible: no buttons, no close (X), and `Escape` or a backdrop click does nothing
- Centered layout

## Host-rendered

`BusyIndicatorDialog` is rendered by the dialog host, not instantiated directly. Register it once with `DialogComponents`, then show and hide it with the `useBusyIndicator` hook. The host threads the `title` and `message` from your request into the rendered modal.

## Basic Usage

Register the dialog component near the root of your app:

```tsx
import { BusyIndicatorDialog } from '@cratis/components/Dialogs';
import { DialogComponents } from '@cratis/arc.react/dialogs';

export const App = () => (
    <DialogComponents busyIndicator={BusyIndicatorDialog}>
        <YourApp />
    </DialogComponents>
);
```

Show the indicator around a long-running operation and close it when done:

```tsx
import { useBusyIndicator } from '@cratis/arc.react/dialogs';

function MyComponent() {
    const [showBusy, closeBusy] = useBusyIndicator(
        'Processing',
        'Please wait while we process your request...'
    );

    const handleAsyncOperation = async () => {
        void showBusy();
        try {
            await performOperation();
        } finally {
            closeBusy();
        }
    };

    return <button type='button' onClick={handleAsyncOperation}>Start Operation</button>;
}
```

## Request

The `BusyIndicatorDialogRequest` the host threads into the dialog carries:

- `title`: Dialog header text
- `message`: Message to display below the spinner

`useBusyIndicator(title?, message?)` returns `[showBusy, closeBusy]` — call `showBusy()` to display the indicator and `closeBusy()` to dismiss it. `showBusy(title?, message?)` accepts per-call overrides.

`showBusy()` returns a promise that resolves only when `closeBusy()` runs, so do not `await` it before your operation; start it, run the work, and close it in `finally` as shown above. Always close it: the user has no way to dismiss it.

## Accessibility

- Focus moves to the dialog title when it opens, so screen readers announce the title and keyboard users are not left behind the modal.
- The spinner is exposed as a progress indicator whose accessible name is the `message`, or the `title` when there is no message. Keep the message meaningful and localized.

## Use Cases

- File uploads
- API calls
- Data processing
- Report generation
- Batch operations

## Integration

Uses the Cratis-owned progress spinner for the loading animation.
