---
title: ErrorBoundary
description: Isolate React render failures with a safe fallback, application-controlled reporting, and user-triggered recovery.
---

<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

A failed panel should not expose diagnostic details or take down the rest of your page. `ErrorBoundary` replaces its failed subtree with a neutral message and a **Try again** button. Error messages and stack traces never appear in the default fallback.

## Basic usage

```tsx
import type { ReactNode } from 'react';
import { ErrorBoundary } from '@cratis/components/Common';

export function ProtectedSection({ children }: { children: ReactNode }) {
    return <ErrorBoundary>{children}</ErrorBoundary>;
}
```

Healthy children render unchanged, without an extra wrapper. When a descendant fails, the default `role="alert"` fallback announces “Something went wrong. Please try again.” Its native button works without a Components provider or an adapter, including when renderer configuration caused the original error.

Retry remounts only the protected children. Their local state is lost, but state outside the boundary is preserved. Retry does not reload the page, retry a network request by itself, or guarantee that the cause is fixed. A persistent failure returns to the fallback; the boundary never retries automatically.

## Props

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `children` | `ReactNode` | Required | Subtree to protect. |
| `fallback` | `ReactNode \| ((reset: () => void) => ReactNode)` | Neutral message and retry button | Custom recovery UI. A callback receives only the reset action, not diagnostic data. An explicit `null` renders nothing. |
| `onError` | `(error: unknown, errorInfo: ErrorInfo) => void` | Console reporter | Application-controlled reporting of the thrown value and React component stack. |
| `onReset` | `() => void` | None | Synchronous callback before retry, for resetting host-owned failure state. |

`ErrorBoundaryProps` is exported from `@cratis/components/Common`. `ErrorInfo` is React's type. A child can throw a value other than an `Error`, so narrow `error` before reading its properties.

## Customize recovery

Use a fallback callback for translated text, application-specific navigation, or a different recovery action:

```tsx
import type { ReactNode } from 'react';
import { ErrorBoundary } from '@cratis/components/Common';

export function RecoverableSection({
    children,
    clearFailedState,
}: {
    children: ReactNode;
    clearFailedState: () => void;
}) {
    return (
        <ErrorBoundary
            onReset={clearFailedState}
            fallback={(reset) => (
                <div role='alert'>
                    <p>This section is temporarily unavailable.</p>
                    <button type='button' onClick={reset}>Retry section</button>
                </div>
            )}
        >
            {children}
        </ErrorBoundary>
    );
}
```

`reset()` calls `onReset` before remounting the children. Keep that callback synchronous. If recovery requires asynchronous work, perform and handle it in your custom fallback, then call `reset()` after it succeeds. Custom fallbacks own their wording, accessibility, and actions; a static node does not receive a retry function. Do not call `reset()` while rendering a fallback.

## Report diagnostics without displaying them

By default, the boundary keeps its existing `console.error` reporting. Supply `onError` to replace that reporter with your application's approved logging or telemetry handler. This does not disable React's own error reporting or any reporter configured on the React root.

Treat thrown values and component stacks as potentially sensitive. Sanitize them according to your application's logging policy and never copy them into the fallback. The boundary does not pass diagnostics to the fallback callback or retain them in its fallback state.

Use composition through `onError`, `onReset`, and `fallback` instead of subclassing the boundary. Changing children or other props alone does not reset a failed boundary; retry explicitly, or change its React `key` to create a new boundary.

## Limits

The boundary catches errors in descendant rendering, constructors, and lifecycle methods. It does **not** catch errors in:

- Event handlers: use explicit error handling in the handler.
- Asynchronous work: handle rejected promises and asynchronous callbacks.
- Server-side rendering.
- The boundary's own render path, including a custom fallback. An ancestor boundary can catch render failures in that fallback.

Place boundaries around meaningful, independently recoverable sections. See [Common components](index.md) for other building blocks.
