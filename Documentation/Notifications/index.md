# Notifications

`CommandDialog` shows success and error feedback for you. But when you run a command **programmatically** — `command.execute()` outside a dialog — nothing tells the user what happened. The `Notifications` components fill that gap with app-wide toasts. Import them from `@cratis/components/Notifications`.

## Mount one Toaster

Mount a single `Toaster` near your app root. Every toast — from anywhere in the tree, even outside React — appears here and auto-dismisses.

```tsx
import { Toaster } from '@cratis/components/Notifications';

<Toaster position='top-right' />;
```

Or let the provider mount it for you:

```tsx
<CratisComponentsProvider toaster>
    <App />
</CratisComponentsProvider>
```

| `Toaster` prop     | Type                 | Description                                                                                                                                                                     |
| ------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `position`         | `ToasterPosition`    | Corner/edge the toasts stack from — `'top-left'`, `'top-center'`, `'top-right'`, `'bottom-left'`, `'bottom-center'`, `'bottom-right'` or `'center'`. Defaults to `'top-right'`. |
| `limit`            | `number`             | Maximum toasts shown at once. Defaults to `3`.                                                                                                                                  |
| `timeout`          | `number`             | Auto-dismiss timeout in milliseconds. Defaults to `6000`.                                                                                                                       |
| `dismissAriaLabel` | `string`             | Accessible name for each toast's dismiss button. Override to localize. Defaults to `'Dismiss'`.                                                                                 |
| `pt`               | `ToasterPassThrough` | Pass-through configuration for `region` and every `toast` frame.                                                                                                                |

Use `pt.region` for the app-wide region and `pt.toast` for each toast's root, content, icon, title, description, action and close slots:

```tsx
<Toaster
    pt={{
        region: { root: { className: 'notification-region' } },
        toast: {
            root: { className: 'notification' },
            close: { className: 'notification-close' },
        },
    }}
/>
```

## Surface a command result with `toastCommandResult`

When you execute a command outside a dialog you have to branch on the granular `ICommandResult` flags — authorized? valid? did it throw? `toastCommandResult` does that branching for you and shows the right toast: a success toast, a warning when not authorized, an error listing the per-field validation messages, or a generic error when the handler threw (stack traces are never shown to users).

```tsx
import { toastCommandResult } from '@cratis/components/Notifications';

const result = await command.execute();
if (toastCommandResult(result, { successTitle: 'Author registered' })) {
    refresh();
}
```

It returns `true` on success, so you can gate follow-up work (close a panel, refresh a query) on the same call. The branches are checked in order and the first match wins: success, then not-authorized (a **warning**, not an error), then validation, then exceptions. `result.exceptionMessages` and stack traces are deliberately never shown to the user — the exception toast carries the generic `exceptionTitle` and nothing else.

| `toastCommandResult` option | Type      | Description                                                           |
| --------------------------- | --------- | --------------------------------------------------------------------- |
| `successTitle`              | `string`  | Title for the success toast. Defaults to `'Success'`.                 |
| `successDescription`        | `string`  | Description for the success toast.                                    |
| `unauthorizedTitle`         | `string`  | Title when rejected by authorization. Defaults to `'Not authorized'`. |
| `validationTitle`           | `string`  | Title when validation failed. Defaults to `'Validation failed'`.      |
| `exceptionTitle`            | `string`  | Title when the handler threw. Defaults to `'Something went wrong'`.   |
| `showSuccess`               | `boolean` | When `false`, no toast is shown on success. Defaults to `true`.       |

Every title is overridable — pass translated strings to localize.

## Ad-hoc toasts with `toast`

For notifications unrelated to a command, call the imperative `toast`. Each method takes an **options object**, not a bare string.

```tsx
import { toast } from '@cratis/components/Notifications';

toast.success({ title: 'Saved', description: 'Your changes were saved.' });
toast.info({ title: 'Heads up' });
toast.warn({ title: 'Check your input' });
toast.error({ title: 'Failed', description: 'Please try again.' });
```

### Custom content keeps the toast frame

`render` replaces only the toast's content body. Components retains the severity icon and accessible dismiss control, so you do not need to preallocate a toast ID or render your own close button:

```tsx
toast.error({
    render: (
        <div>
            <strong>Import failed</strong>
            <p>Three rows contain invalid email addresses.</p>
        </div>
    ),
});
```

The same framing applies when `toast.update` or a `toast.promise` success/error callback supplies `render`. `dismissible: false` and loading toasts still follow PrimeReact's normal no-close behavior.

The severity method is `warn`, not `warning`. Alongside the four above, `toast` also offers `secondary` and `contrast`, and calling `toast(...)` directly takes the same options object with an explicit `severity`.

Every call returns a `ToastId` you can hold on to: `toast.dismiss(id?)` closes that toast (or all of them), `toast.update(id, updates)` rewrites one in place, and `toast.promise(promise, options)` tracks a promise through pending/success/error states.
