---
title: Notifications
description: App-wide accessible notifications through the Cratis-owned toast queue.
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

| Prop | Purpose |
|---|---|
| `position` | One of the six viewport edges/corners. |
| `limit` | Maximum visible frames. |
| `timeout` | Default timeout in milliseconds. |
| `dismissAriaLabel` | Accessible name for close controls. |
| `regionAriaLabel` | Accessible name for the notification region. |
| `pt` | Stable `region`, `toast`, `icon`, `content`, `title`, `description`, `action`, and `close` parts. |
