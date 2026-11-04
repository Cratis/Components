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

`ConfirmationDialog` and `BusyIndicatorDialog` are rendered by the Arc dialog host: register them once with `DialogComponents` and trigger them through the hooks from `@cratis/arc.react/dialogs`. `ConfirmationDialog` takes its title, message, and buttons from the request, and `BusyIndicatorDialog` takes its title and message, so reach for `Dialog` as soon as you need content of your own.

## Follow the caller/result boundary

With Arc's `useDialog`, the caller renders the wrapper returned by the hook and invokes its show function. A custom `Dialog` returns a result through the dialog context; the caller decides what that result means. A confirmation result is not evidence that an application operation has succeeded.

For a generated command, use `CommandDialog` instead: it binds the command, validates before execution, becomes busy while executing, and closes on success. The [form recipe](../building-a-form.md) shows the complete wrapper and command flow. Both paths need the runtime/provider setup in [Getting started](../getting-started.mdx); a Components provider alone is not an Arc dialog host.

## Choose focus and verify cancellation

Give the dialog a meaningful `title` and keep labels understandable without relying on icons. For a destructive operation, consider `DialogInitialFocus.Cancel` so an unintended Enter does not activate confirm; see the [initial-focus contract](dialog.md#initial-focus). Test the application's actual keyboard path: open, move through controls, cancel or confirm, and check where focus returns.

Also distinguish explicit **Cancel**, close-button, and Escape behavior from successful completion. An application-owned controlled dialog must update its own visibility; a `useDialog` wrapper uses its context. These checks do not establish application-wide accessibility conformance.

## When not to use a dialog from this subpath

- **Confirming runs an Arc command.** Use [`CommandDialog`](../CommandDialog/index.md), or [`StepperCommandDialog`](../StepperCommandDialog/index.md) for several steps. They validate and execute the command and manage the footer state for you.
- **The input belongs on the page.** Use [`CommandForm`](../CommandForm/index.md) or the controls in [Common](../Common/index.md) instead of a modal.
- **The message is transient and needs no answer.** Use a toast from [Notifications](../Notifications/index.md).

For the wider decision across subpaths, see [Choosing a component](../choosing-a-component.md).
