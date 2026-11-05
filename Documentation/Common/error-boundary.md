---
title: ErrorBoundary for React render recovery
description: Use ErrorBoundary to isolate a section's React render failures, keep diagnostics out of its fallback, and let users retry the protected content.
---

<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

`ErrorBoundary` isolates a section's React render failures by replacing its protected children with a neutral message and a **Try again** button. Wrap a section that can recover independently, such as a panel, so a failure there leaves the surrounding page in place. Error messages and stack traces never appear in the default fallback.

## Basic usage

```tsx
import type { ReactNode } from 'react';
import { ErrorBoundary } from '@cratis/components/Common';

export function ProtectedSection({ children }: { children: ReactNode }) {
    return <ErrorBoundary>{children}</ErrorBoundary>;
}
```

Healthy children render unchanged, without an extra wrapper. When a descendant fails, the default `role="alert"` fallback announces “Something went wrong. Please try again.” Its native button works without a Components provider or an adapter, including when renderer configuration caused the original error.

Choosing **Try again** remounts only the protected children. Their local state is lost, but state outside the boundary is preserved. Place state you need to keep outside that section. Retry does not reload the page or retry a network request by itself; your application must clear any failure cause that survives the remount. If the cause persists, the fallback returns. The boundary never retries automatically.

## Props

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `children` | `ReactNode` | Required | Subtree to protect. |
| `fallback` | `ReactNode \| ((reset: () => void) => ReactNode)` | Neutral message and retry button | Custom recovery UI. A callback receives only the reset action, not diagnostic data. An explicit `null` renders nothing. |
| `onError` | `(error: unknown, errorInfo: ErrorInfo) => void` | Console reporter | Application-controlled reporting of the thrown value and React component stack. |
| `onReset` | `() => void` | None | Synchronous callback before retry, for resetting host-owned failure state. |

`ErrorBoundaryProps` is exported from `@cratis/components/Common`. `ErrorInfo` is React's type. A child can throw a value other than an `Error`, so narrow `error` before reading its properties.

## Customize recovery

Use a fallback callback for translated text, application-specific navigation, or a different recovery action. Here, `clearFailedState` is an application-supplied synchronous function that clears the cause before the children remount:

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

The **Retry section** button calls `reset()`, which runs `onReset` before remounting the children. Keep `onReset` synchronous. If recovery requires asynchronous work, perform it in a custom fallback action and handle failures there, then call `reset()` after it succeeds. Do not call `reset()` while rendering a fallback.

A custom fallback replaces the entire default recovery UI. Your application owns its wording, accessibility, and actions. A static fallback node receives no retry function; use the callback form when the user needs to retry.

## Report diagnostics without displaying them

By default, the boundary reports caught failures through `console.error`. Supply `onError` to replace that reporter with your application's approved logging or telemetry handler. This does not disable React's own error reporting or any reporter configured on the React root.

Treat thrown values and component stacks as potentially sensitive. Sanitize them according to your application's logging policy and never copy them into the fallback. The boundary does not pass diagnostics to the fallback callback or retain them in its fallback state.

Use composition through `onError`, `onReset`, and `fallback` instead of subclassing the boundary. Changing children or other props alone does not reset a failed boundary; retry explicitly, or change its React `key` to create a new boundary.

## Limits

The boundary catches errors in descendant rendering, constructors, and lifecycle methods. It does **not** catch errors in:

- Event handlers: use explicit error handling in the handler.
- Asynchronous work: handle rejected promises and asynchronous callbacks.
- Server-side rendering.
- The boundary's own render path, including a custom fallback. An ancestor boundary can catch render failures in that fallback.

Return to [Common components](index.md) to choose the controls and layout for the protected section.
