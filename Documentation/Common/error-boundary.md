# ErrorBoundary

React error boundary component for graceful error handling.

## Purpose

ErrorBoundary catches JavaScript errors in component trees and displays a fallback UI instead of crashing the application.

## Key Features

- Catches rendering errors
- Displays user-friendly error message
- Prevents application crash
- Can be nested at different levels
- Optional custom fallback UI

## Basic Usage

```typescript
import { ErrorBoundary } from '@cratis/components';

function App() {
    return (
        <ErrorBoundary>
            <MyComponent />
        </ErrorBoundary>
    );
}
```

## With Custom Fallback

```typescript
const CustomError = ({ error }) => (
    <div className="error-container">
        <h2>Oops! Something went wrong.</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
    </div>
);

<ErrorBoundary fallback={CustomError}>
    <MyComponent />
</ErrorBoundary>
```

## Props

- `children`: Components to protect with error boundary
- `fallback`: Custom error display component (optional)

## Error Information

When an error is caught, ErrorBoundary receives:

- `error`: The error object
- `errorInfo`: React component stack trace

## Usage Patterns

### Route Level

```typescript
<Router>
    <Route 
        path="/dashboard" 
        element={
            <ErrorBoundary>
                <Dashboard />
            </ErrorBoundary>
        } 
    />
</Router>
```

### Feature Level

```typescript
function Dashboard() {
    return (
        <div>
            <ErrorBoundary>
                <UserStats />
            </ErrorBoundary>
            
            <ErrorBoundary>
                <OrderList />
            </ErrorBoundary>
            
            <ErrorBoundary>
                <RecentActivity />
            </ErrorBoundary>
        </div>
    );
}
```

### Component Level

```typescript
function DataTable() {
    return (
        <ErrorBoundary fallback={TableError}>
            <ComplexTable data={data} />
        </ErrorBoundary>
    );
}
```

## Advanced Example

```typescript
const ErrorFallback = ({ error, errorInfo, reset }) => (
    <div className="error-boundary-fallback">
        <div className="error-icon">
            <i className="pi pi-exclamation-triangle" />
        </div>
        
        <h2>Something went wrong</h2>
        
        <details className="error-details">
            <summary>Error Details</summary>
            <pre>{error.message}</pre>
            <pre>{errorInfo.componentStack}</pre>
        </details>
        
        <div className="error-actions">
            <button onClick={reset}>Try Again</button>
            <button onClick={() => window.location.href = '/'}>Go Home</button>
        </div>
    </div>
);

<ErrorBoundary fallback={ErrorFallback}>
    <App />
</ErrorBoundary>
```

## Error Logging

Integrate with logging services:

```typescript
class LoggingErrorBoundary extends ErrorBoundary {
    componentDidCatch(error, errorInfo) {
        // Log to service
        logErrorToService(error, errorInfo);
        
        super.componentDidCatch(error, errorInfo);
    }
}
```

## Best Practices

1. **Place strategically**: Use at route or feature level, not everywhere
2. **Don't overuse**: One boundary per major section is usually sufficient
3. **Log errors**: Send errors to monitoring service in production
4. **Provide actions**: Give users a way to recover (reload, go home)
5. **Be informative**: Show helpful messages, not technical details to end users
6. **Test error states**: Verify error boundaries work as expected
7. **Consider granularity**: Balance between too few (whole app crashes) and too many (verbose code)

## Recovery Mechanisms

### Auto-Retry

```typescript
function RetryErrorBoundary({ children }) {
    const [retryCount, setRetryCount] = useState(0);
    
    const handleRetry = () => {
        setRetryCount(count => count + 1);
    };
    
    return (
        <ErrorBoundary 
            key={retryCount}
            fallback={({ error }) => (
                <div>
                    <p>Error: {error.message}</p>
                    <button onClick={handleRetry}>Retry</button>
                </div>
            )}
        >
            {children}
        </ErrorBoundary>
    );
}
```

### Fallback Content

```typescript
<ErrorBoundary 
    fallback={() => (
        <div className="fallback-content">
            <h3>This section is temporarily unavailable</h3>
            <p>Please try refreshing the page or check back later.</p>
        </div>
    )}
>
    <OptionalFeature />
</ErrorBoundary>
```

## What Errors Are Caught

ErrorBoundary catches:
- Rendering errors
- Lifecycle method errors
- Constructor errors

ErrorBoundary does NOT catch:
- Event handler errors (use try-catch)
- Asynchronous errors (use try-catch or .catch())
- Server-side rendering errors
- Errors in error boundary itself
