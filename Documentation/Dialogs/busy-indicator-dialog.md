# BusyIndicatorDialog

Dialog with a loading spinner for long-running operations.

## Purpose

BusyIndicatorDialog displays a loading indicator while performing asynchronous operations.

## Key Features

- Animated progress spinner
- Customizable message
- Non-dismissible (no close button)
- Centered layout

## Basic Usage

```typescript
import { BusyIndicatorDialog } from '@cratis/components';

function MyComponent() {
    const [processing, setProcessing] = useState(false);

    const handleAsyncOperation = async () => {
        setProcessing(true);
        try {
            await performOperation();
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <button onClick={handleAsyncOperation}>Start Operation</button>
            {processing && (
                <BusyIndicatorDialog
                    title="Processing"
                    message="Please wait while we process your request..."
                />
            )}
        </>
    );
}
```

## Props

- `title`: Dialog header text
- `message`: Message to display below the spinner

## Use Cases

- File uploads
- API calls
- Data processing
- Report generation
- Batch operations

## Integration

Uses PrimeReact ProgressSpinner for the loading animation.
