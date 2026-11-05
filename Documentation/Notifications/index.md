---
title: Cratis Components notifications for app-wide feedback
description: Mount one Cratis Components toaster to show app-wide feedback, handle Arc command results, and give notifications accessible dismissal controls.
---

Cratis Components notifications show app-wide feedback from React components or ordinary modules through a shared queue. Mount one toaster, the component that displays queued messages, then call `toast` when an operation finishes. For Cratis Arc commands, `toastCommandResult` chooses the notification from the result and tells you whether to continue.

## Mount one toaster

Add `toaster` to your application's root `CratisComponentsProvider`. The example assumes `Application` is your application component; see [provider setup](../Common/cratis-components-provider.md#basic-setup) if you have not added the provider yet.

```tsx
import { CratisComponentsProvider } from '@cratis/components';

<CratisComponentsProvider toaster>
    <Application />
</CratisComponentsProvider>
```

The provider mounts a `Toaster` with default settings. You can instead mount `<Toaster />` from `@cratis/components/Notifications` yourself, but do not use both: every toaster displays the same queue, so two toasters show each notification twice.

## Dispatch a notification

Call `toast.success` after the operation succeeds. You do not need a React hook to send a notification:

```ts
import { toast } from '@cratis/components/Notifications';

toast.success({
    title: 'Saved',
    description: 'Your changes were saved.',
});
```

With the toaster mounted, this displays a success notification titled “Saved” with a close button. If nothing appears, check that the provider has its `toaster` prop enabled or that you mounted a `Toaster` yourself.

## Toast a command result

When executing a Cratis Arc command outside a command dialog, pass its result to `toastCommandResult(result, options?)`. The helper returns `true` only when `result.isSuccess` is true, so you can keep a panel open after a failure. This excerpt assumes `command` is your command instance and `close` closes your panel:

```tsx
import { toastCommandResult } from '@cratis/components/Notifications';

const result = await command.execute();
if (toastCommandResult(result, { successTitle: 'Author registered' })) {
    close();
}
```

| Result | Toast |
| --- | --- |
| Success | Success toast titled `successTitle` (default `'Success'`) with optional `successDescription`; skipped when `showSuccess: false` |
| Not authorized | Warning toast titled `unauthorizedTitle` (default `'Not authorized'`) |
| Invalid | Error toast titled `validationTitle` (default `'Validation failed'`) listing the validation messages |
| Exceptions | Error toast titled `exceptionTitle` (default `'Something went wrong'`); exception messages and stack traces are not shown |

In this example, the panel closes only after success. Setting `showSuccess: false` suppresses the success notification without changing the return value. The helper checks success, authorization, validation, and exceptions in that order; it returns `false` without a toast if none of those branches matches.

It needs a mounted toaster like any other toast. Exception details stay out of the notification; log `result.exceptionMessages` yourself if you need them.

## Accessible behavior

The built-in toaster labels its notification region and sets `aria-live="polite"` for announcements. Error frames use `role="alert"`; other frames use `role="status"`. Each dismissible frame has a close button with an accessible name, including when you supply a custom body.

Keep dismissal enabled when readers may need to close a notification themselves. Configure the close button and region names through the provider's `messages.notifications`, or use the `dismissAriaLabel` and `regionAriaLabel` props listed below. Setting `dismissible: false` removes the close button.

Auto-dismiss pauses while a frame is hovered or contains keyboard focus. Timed notifications stay for at least five seconds; `duration: 0` and loading toasts do not auto-dismiss. If you disable both timeout and dismissal, provide another way to remove the notification, such as `toast.dismiss(id)` after the operation finishes.

After mounting the toaster, check a notification in your application: move keyboard focus to its close button, confirm its accessible name, and activate it to dismiss the message. Repeat with a custom body if you use one.

## Custom body

Use `render` when a notification needs more than a title and description. This excerpt assumes `FailureDetails` is your component for the notification body:

```tsx
toast.error({
    render: <FailureDetails />,
    dismissible: true,
});
```

Custom content replaces only the body. Components still supplies the frame, severity indicator, timeout behavior, and dismiss control. You do not need to add a close button to `FailureDetails`.

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

Creating a toast returns its id; `toast.update(id, updates)` returns that same id. Keep the id to update or dismiss that notification later. `toast.dismiss(id)` removes one toast, while `toast.dismiss()` removes every toast; neither returns an id.

`toast.promise` shows a loading toast and updates it when the promise settles, using the supplied `loading`, `success`, and `error` states. It returns a promise for the operation's result, not a toast id, and propagates rejection to the caller. If a success or error state is omitted, the toast is dismissed for that outcome.

Useful `ToastOptions` beyond `title` and `description`:

| Option | Purpose |
| --- | --- |
| `severity` | `'normal'` (default), `'success'`, `'info'`, `'warn'`, `'error'`, `'secondary'`, or `'contrast'`; the shorthand methods set it for you |
| `duration` | Milliseconds before auto-dismiss, overriding the toaster's `timeout`. `0` keeps the toast until it is dismissed. |
| `dismissible` | The close control is shown unless this is `false` |
| `loading` | Marks the toast as in progress; a loading toast does not auto-dismiss. `toast.promise` sets it on the pending toast. |
| `action` | Button attributes for one action button in the toast |
| `render` | Custom body; see [Custom body](#custom-body) |
| `id` | Your own id; showing a toast with an existing id replaces that toast |
| `onDismiss` / `onTimeout` | Called when the toast is dismissed or times out |

The queue is shared across loaded Components copies. `setToastDispatch()` installs an application-owned dispatch and returns a scoped restore callback.

## Toaster props

| Prop               | Purpose                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `position`         | `'top-left'`, `'top-center'`, `'top-right'` (default), `'bottom-left'`, `'bottom-center'`, or `'bottom-right'`. |
| `limit`            | Maximum visible frames; the newest are shown. Defaults to `3`.                                    |
| `timeout`          | Default timeout in milliseconds. Defaults to `6000`; values below `5000` are raised to `5000`.    |
| `dismissAriaLabel` | Accessible name for close controls. Falls back to the [`CratisComponentsProvider`](../Common/cratis-components-provider.md)'s `messages.notifications.dismiss`, then `'Dismiss'`. |
| `regionAriaLabel`  | Accessible name for the notification region. Falls back to the provider's `messages.notifications.region`, then `'Notifications'`. |
| `pt`               | Stable `region`, `toast`, `icon`, `content`, `title`, `description`, `action`, and `close` parts. |

Configure `dismissAriaLabel` / `regionAriaLabel` once for the whole application through
`CratisComponentsProvider`'s `messages.notifications`, or override either per `<Toaster>` instance.

To pass these props through the provider, give `toaster` an object instead of `true`, for example `<CratisComponentsProvider toaster={{ position: 'bottom-right', limit: 5 }}>`.

For application-wide labels and styling setup, continue with [CratisComponentsProvider](../Common/cratis-components-provider.md).

## Building a custom rendering surface

Use the built-in `Toaster` unless you need to control the rendering surface, such as displaying notifications inside an existing notification center. A custom surface can read the same queue, but it owns accessible announcements, dismissal controls, and any timeout behavior.

- `subscribeToToasts(listener)` subscribes to the shared queue and returns an unsubscribe callback. React's `useSyncExternalStore` manages that subscription for you.
- `getToastSnapshot()` returns the current array of queued `ToastRecord` values. Treat it as immutable.
- `ToastRecord` is `ToastOptions & { id: ToastId }`, the shape stored in the queue. Render each record's `title`/`description`/`render`, honor `dismissible`, and call `toast.dismiss(id)` to remove it.
- `ToastDispatch` is the interface accepted by `setToastDispatch()`. Implement it to redirect toast calls to another in-app system instead of the built-in queue.

This subscriber excerpt assumes you supply `CustomToastFrame` to render each record and implement the frame behavior:

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

The subscription makes queue changes available to your component; it does not add the built-in toaster's frame behavior. Follow the [accessible behavior](#accessible-behavior) above when implementing your own surface.
