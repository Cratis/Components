---
title: Dialogs
description: Choose between a custom dialog, a confirmation prompt, and a busy indicator from @cratis/components/Dialogs.
---

The Dialogs subpath covers modal interruptions that do not run a command. Import from `@cratis/components/Dialogs`:

```tsx
import { BusyIndicatorDialog, ConfirmationDialog, Dialog } from '@cratis/components/Dialogs';
```

## Which dialog to use

| You want to… | Use | Reference |
| --- | --- | --- |
| Ask the user to confirm or cancel an action and await the button they chose | `ConfirmationDialog`, triggered with `useConfirmationDialog` | [ConfirmationDialog](confirmation-dialog.md) |
| Block the screen with a spinner while a long-running operation completes | `BusyIndicatorDialog`, shown with `useBusyIndicator` | [BusyIndicatorDialog](busy-indicator-dialog.md) |
| Show your own content, collect values, and return a typed result to the caller | `Dialog` with `useDialog` / `useDialogContext` | [Dialog](dialog.md) |
| Show a detail pane against the side of the viewport | `Dialog` with `placement='start'` or `'end'` | [Dialog placement](dialog.md#placement) |

`ConfirmationDialog` and `BusyIndicatorDialog` are rendered by the Arc dialog host: register them once with `DialogComponents` and trigger them through the hooks from `@cratis/arc.react/dialogs`. They take their title, message, and buttons from the request, so reach for `Dialog` as soon as you need content of your own.

## When not to use a dialog from this subpath

- **Confirming runs an Arc command.** Use [`CommandDialog`](../CommandDialog/index.md), or [`StepperCommandDialog`](../StepperCommandDialog/index.md) for several steps. They validate and execute the command and manage the footer state for you.
- **The input belongs on the page.** Use [`CommandForm`](../CommandForm/index.md) or the controls in [Common](../Common/index.md) instead of a modal.
- **The message is transient and needs no answer.** Use a toast from [Notifications](../Notifications/index.md).

For the wider decision across subpaths, see [Choosing a component](../choosing-a-component.md).
