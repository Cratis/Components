---
title: 'Cratis Components dialogs: choose an interaction'
description: Use Cratis Components dialogs to collect a typed result, ask for confirmation, or show progress; use command dialogs to validate and execute commands.
---

Cratis Components dialogs let you ask for a decision or collect values while the caller controls what happens next. Use a custom `Dialog` when the caller needs a typed result, `ConfirmationDialog` for a prompt, or `BusyIndicatorDialog` while an operation completes. Import them from `@cratis/components/Dialogs`:

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

Register `ConfirmationDialog` and `BusyIndicatorDialog` once with Cratis Arc's `DialogComponents`, then open them through the hooks from `@cratis/arc.react/dialogs`. These built-in dialogs display the title and message supplied in the request; the confirmation request also selects the buttons. Choose `Dialog` when you need your own content. The [Getting started setup](../getting-started.mdx) supplies the runtime and providers; `CratisComponentsProvider` alone does not register the Arc dialog host.

## Follow the caller/result boundary

For a custom dialog, render the wrapper returned by `useDialog` and await its show function. The dialog calls `closeDialog(result, value?)` through `useDialogContext`; the caller receives `[DialogResult, value?]`. Check the result and optional value before using them. `DialogResult.Cancelled` means the interaction ended without confirmation, not that an application operation succeeded or failed. Follow the [typed Dialog example](dialog.md#example) to wire both sides.

When confirming should validate and execute a generated Arc command, choose `CommandDialog` instead. It binds the command and manages validation and busy state during submission. A successful command normally closes the dialog; a failed command leaves it open. The [form recipe](../building-a-form.md) walks through that command flow. A plain `Dialog` only reports the user's choice unless you supply the operation yourself.

## Choose focus and verify cancellation

Give the dialog a meaningful `title` and labels that make sense without icons. For a destructive choice, use `DialogInitialFocus.Cancel` to focus Cancel or No rather than confirm. Use `Content` to focus the title without selecting an action. The [initial-focus contract](dialog.md#initial-focus) explains the fallbacks for custom footers.

With predefined buttons, the header close button, Escape, and a backdrop click report `DialogResult.Cancelled`. Custom footers and dialogs without a footer disable those dismissal paths by default; configure them explicitly and provide a way out. See [dismissal controls](dialog.md#dismissing). Outside `useDialog`, your callbacks must update `visible` themselves.

Before relying on the interaction, check its keyboard path in your application: open it, move through the controls, cancel or confirm, and check where focus returns. Repeat for each dismissal path you enable. This checks the dialog flow, not application-wide accessibility conformance.

## When not to use a dialog from this subpath

- To validate and execute an Arc command, use [`CommandDialog`](../CommandDialog/index.md), or [`StepperCommandDialog`](../StepperCommandDialog/index.md) for several steps.
- To collect input without interrupting the page, use [`CommandForm`](../CommandForm/index.md) or the controls in [Common](../Common/index.md).
- To show a transient message that needs no answer, use a toast from [Notifications](../Notifications/index.md).

For the wider decision across subpaths, see [Choosing a component](../choosing-a-component.md).
