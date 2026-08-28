---
title: Notifications
description: App-wide notifications with documented region and dismissal labels through the Cratis-owned toast queue.
---

Mount one toaster, then dispatch notifications from React components or ordinary modules.

```tsx
<CratisComponentsProvider toaster>
    <Application />
</CratisComponentsProvider>
```

```ts
import { toast } from '@cratis/components/Notifications';

toast.success({
    title: 'Saved',
    description: 'Your changes were saved.',
});
```

## Imperative API

- `toast(options)`
- `toast.success(options)`
- `toast.info(options)`
- `toast.warn(options)`
- `toast.error(options)`
- `toast.secondary(options)`
- `toast.contrast(options)`
- `toast.update(id, updates)`
- `toast.dismiss(id?)`
- `toast.promise(promise, states)`

The queue is shared across loaded Components copies. `setToastDispatch()` installs an application-owned dispatch and returns a scoped restore callback.

## Building a custom rendering surface

The default `Toaster` is optional. An application that wants full control over how
notifications render — a different animation library, a non-portal placement, or
integration with an existing app-wide notification center — can build its own surface
on the same primitives `Toaster` itself uses:

- `subscribeToToasts(listener)` subscribes to the shared queue and returns an
  unsubscribe callback. Call it inside a `useSyncExternalStore`/`useEffect` binding.
- `getToastSnapshot()` returns the current, immutable array of queued `ToastRecord`
  values — the snapshot to read whenever the subscription notifies of a change.
- `ToastRecord` is `ToastOptions & { id: ToastId }`, the exact shape stored in the
  queue; render each record's `title`/`description`/`render`, honor `dismissible`,
  and call the imperative `toast` API (or a custom `ToastDispatch`) to dismiss it.
- `ToastDispatch` is the interface implemented by whatever `setToastDispatch()`
  installs — implement it to redirect every `toast(...)` call to a different
  in-app system (or to a test double) instead of the built-in queue.

A minimal custom subscriber:

```tsx
import { useSyncExternalStore } from 'react';
import { subscribeToToasts, getToastSnapshot } from '@cratis/components/Notifications';

const CustomToastRegion = () => {
    const toasts = useSyncExternalStore(subscribeToToasts, getToastSnapshot);
    return (
        <div role='region' aria-label='Notifications'>
            {toasts.map((toast) => (
                <CustomToastFrame key={toast.id} toast={toast} />
            ))}
        </div>
    );
};
```

## Accessible behavior

- Error frames use `role="alert"`; other frames use `role="status"`.
- The notification region is labeled and polite.
- Every dismissible frame retains a localized close control, including custom bodies.
- Auto-dismiss pauses while the frame is hovered or contains keyboard focus.
- Timeouts have a five-second accessibility floor.

## Custom body

```tsx
toast.error({
    render: <FailureDetails />,
    dismissible: true,
});
```

Custom content replaces only the body. The frame, severity indicator, timeout, and dismiss control remain owned by Components.

## Toaster props

| Prop               | Purpose                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `position`         | One of the six viewport edges/corners.                                                            |
| `limit`            | Maximum visible frames.                                                                           |
| `timeout`          | Default timeout in milliseconds.                                                                  |
| `dismissAriaLabel` | Accessible name for close controls. Falls back to the [`CratisComponentsProvider`](../Common/cratis-components-provider.md)'s `messages.notifications.dismiss`, then `'Dismiss'`. |
| `regionAriaLabel`  | Accessible name for the notification region. Falls back to the provider's `messages.notifications.region`, then `'Notifications'`. |
| `pt`               | Stable `region`, `toast`, `icon`, `content`, `title`, `description`, `action`, and `close` parts. |

Configure `dismissAriaLabel` / `regionAriaLabel` once for the whole application through
`CratisComponentsProvider`'s `messages.notifications`, or override either per `<Toaster>` instance.
