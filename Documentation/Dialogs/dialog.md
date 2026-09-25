---
title: Dialog
description: Build a modal or side-sheet dialog that the caller can await for a typed result, with controlled dismissal, busy state, and initial focus.
---

Base dialog component for creating typed dialogs that can be awaited.

## Recommended Pattern

Use `useDialog<TResult>()` at the call site and `useDialogContext<TRequest, TResult>()` inside the dialog component. Both hooks come from `@cratis/arc.react/dialogs`.

- The caller opens the dialog with `await` and receives `[dialogResult, value]`
- The dialog closes itself through `closeDialog(result, value?)`
- `TResult` is the value returned from the dialog. `useDialogContext` takes the request (the dialog's input props) type first, so pass `object` there when the dialog has no input

This pattern gives strongly typed dialog results and a simple async flow.

## Example

```tsx
import { useState } from 'react';
import { DialogResult, useDialog, useDialogContext } from '@cratis/arc.react/dialogs';
import { Dialog } from '@cratis/components/Dialogs';

type Project = {
    id: string;
    name: string;
};

const AddProjectDialog = () => {
    const { closeDialog } = useDialogContext<object, Project>();
    const [name, setName] = useState('');

    return (
        <Dialog
            title='Add project'
            isValid={name.trim().length > 0}
            onConfirm={() => closeDialog(DialogResult.Ok, { id: crypto.randomUUID(), name })}
        >
            <label>
                Name
                <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
        </Dialog>
    );
};

const MyComponent = () => {
    const [AddProjectDialogWrapper, showAddProjectDialog] = useDialog<Project>(AddProjectDialog);

    const handleAddProject = async () => {
        const [result, project] = await showAddProjectDialog();
        if (result === DialogResult.Ok && project) {
            console.log('Added', project.name);
        }
    };

    return (
        <>
            <button type='button' onClick={handleAddProject}>
                Add project
            </button>
            <AddProjectDialogWrapper />
        </>
    );
};
```

`onConfirm` calls `closeDialog` with the new project, which resolves the caller's `await`. Cancel, the header close (X), `Escape`, and a backdrop click need no callback: they close the dialog with `DialogResult.Cancelled`. `useDialog` unmounts the dialog when it closes, so it starts with an empty name the next time it opens.

## How the dialog closes

The footer buttons, the header close (X), `Escape`, and a backdrop click all go through the same rules. "Closes" means that the dialog calls `closeDialog(result)` from the surrounding `useDialog` context, without a value.

| User action | Dedicated callback present | Only `onClose` present | No callback |
| ----------- | -------------------------- | ---------------------- | ----------- |
| `Ok` / `Yes` | `onConfirm()` runs; closes only if it returns `true` | `onClose(result)` runs; closes unless it returns `false` | Closes with `DialogResult.Ok` / `Yes` |
| `Cancel` / `No`, X, `Escape`, backdrop | `onCancel()` runs; closes only if it returns `true` | `onClose(result)` runs; closes unless it returns `false` | Closes with `DialogResult.Cancelled` / `No` |

The X, `Escape`, and backdrop report `DialogResult.Cancelled`, even in a `YesNo` dialog. Callbacks may be async; the dialog awaits them before deciding.

A callback that calls `closeDialog(...)` itself has already closed the dialog, whatever it returns. That is how you return a value, as in the example above.

Outside `useDialog` there is no dialog context, so nothing closes automatically. Control `visible` yourself and hide the dialog from the callbacks:

```tsx
const [visible, setVisible] = useState(false);

<Dialog
    title='Details'
    visible={visible}
    buttons={DialogButtons.Ok}
    onClose={() => setVisible(false)}
>
    Details go here.
</Dialog>;
```

## Props

- `title`: Dialog header text
- `subtitle`: Optional secondary line under the title — a reference, a status, a short summary. It is
  rendered in the header as the `subtitle` part and announced as the dialog's description
- `placement`: `'center'` (default), `'start'` or `'end'` — see [Placement](#placement)
- `closeIcon`: Glyph for the header close (X). Defaults to a multiplication sign; pass your icon set's
  close icon to match the rest of the product
- `visible`: Controls visibility (defaults to `true`)
- `onConfirm`: Callback for confirm actions; return `true` to close. See [How the dialog closes](#how-the-dialog-closes)
- `onCancel`: Callback for cancel actions, the X, `Escape`, and a backdrop click; return `true` to close
- `onClose`: Fallback close callback for whichever of `onConfirm` / `onCancel` is absent; closes unless it returns `false`
- `buttons`: Predefined `DialogButtons` (`Ok`, `OkCancel`, `YesNo`, `YesNoCancel`),
  `null` for no footer, or a custom React node. Defaults to
  `DialogButtons.OkCancel`. Anything other than a `DialogButtons` value also
  removes the close (X), stops `Escape` closing the dialog, and leaves
  `onConfirm` / `onCancel` / `onClose` uncalled — the dialog cannot tell which
  of your buttons means what, so a custom footer must close the dialog itself
  through `useDialogContext().closeDialog(...)`, or opt the dismiss
  affordances back in explicitly with `dismissable`
- `dismissable`: Whether the header close (X), a backdrop click and `Escape` are
  offered (see below)
- `closeAriaLabel`: Accessible name for the header close button. Defaults to
  the [`CratisComponentsProvider`](../Common/cratis-components-provider.md)'s
  `messages.dialog.close`, then `'Close'` — override it to localize a single dialog
- `width`: Dialog width (defaults to `'450px'`)
- `style`: Custom dialog style
- `contentStyle`: Custom content area style
- `resizable`: Accepted for source compatibility; the viewport-bounded Cratis dialog has no resize handle. Existing code that passes it keeps compiling; it simply has no effect.
- `isValid`: Enables or disables confirm actions (defaults to `true`)
- `isBusy`: When `true`, disables all buttons, blocks Escape/backdrop dismissal, and shows a loading spinner on the primary action button
- `initialFocus`: Where keyboard focus lands when the dialog opens (see below)
- `okLabel`, `cancelLabel`, `yesLabel`, `noLabel`: Button labels. Each resolves from the prop, then the
  [`CratisComponentsProvider`](../Common/cratis-components-provider.md)'s matching `messages.dialog` entry
  (`ok`, `cancel`, `yes`, `no`), then its English default (`'Ok'`, `'Cancel'`, `'Yes'`, `'No'`) — localize every
  dialog at once through the provider, or one dialog through the prop. Footer icons are decorative and hidden
  from accessibility APIs, so each button's accessible name is exactly its configured label. `CommandDialog`
  forwards these same props straight through to `Dialog`, so the same precedence covers it.
  `StepperCommandDialog` uses `okLabel` for its Submit button (falling back to `messages.stepper.submit`) and
  `cancelLabel` for its optional footer Cancel.
- `className`, `pt`: Styling hooks for the Cratis-owned dialog root and stable parts — see the [pass-through cheat sheet](../Styling/pass-through.md)
- `ptOptions`, `unstyled`: Retained temporarily for source compatibility; ignored because Cratis part attributes always merge and styling is CSS-owned

## Dismissing

A dialog is _dismissable_ when the header close (X), a backdrop click and
`Escape` are all offered. Those three affordances are controlled by one switch, so they
are always on or off together.

By default the dialog works out which it should be from `buttons`: a predefined
`DialogButtons` set is dismissable, a custom `ReactNode` footer or `null` is
not. That mirrors the v10 behavior and is usually what you want — if the
dialog renders your buttons, it does not know which one means "get me out of
here", so it declines to invent one.

Set `dismissable` explicitly to override that:

```tsx
<Dialog
    title="Choose a plan"
    buttons={<MyOwnFooter />}
    dismissable
    closeAriaLabel="Close plan chooser"
    onCancel={() => closeDialog(DialogResult.Cancelled)}
>
    …
</Dialog>
```

This is what `StepperCommandDialog` does for its wizard chrome: it renders a
custom footer and still keeps a header X — and withdraws it again, along with
`Escape` and the backdrop, for the whole window a command is executing in.

## Placement

`placement` decides where the dialog sits. `center` is the classic modal. `start` and `end` turn the
same dialog into a full-height **side sheet** against that inline edge of the viewport — a detail pane,
an internal note, a navigation list on a small screen — sliding in from the edge (and not at all under
`prefers-reduced-motion`). `width` is the sheet's width; the sheet never exceeds the viewport.

The excerpt assumes `closeDialog` from `useDialogContext()`, `DialogInitialFocus` from `@cratis/components/Dialogs`, and your own `ActivityTimeline` component.

```tsx
<Dialog
    title='Activity'
    subtitle='Example Project - Demo Organization'
    placement='end'
    width='440px'
    buttons={null}
    dismissable
    initialFocus={DialogInitialFocus.Content}
    onCancel={() => closeDialog(DialogResult.Cancelled)}
>
    <ActivityTimeline />
</Dialog>
```

Nothing else changes with placement: the focus trap, `Escape`, backdrop dismissal, focus restore,
`isBusy` and `initialFocus` behave identically, and the same parts are there to style. The `backdrop`,
`positioner` and `root` parts carry `data-placement` so CSS can target one placement:

```css
.cratis-dialog[data-placement='end'] {
    box-shadow: var(--product-shadow-sheet);
}
```

## Initial focus

By default the confirm button is focused when a dialog opens, which makes the
common "read it, press Enter" flow cost one keystroke. That default also _arms_
the confirm button: browsers fire `click` from the `keydown` of `Enter`, so a
key still held down from the control that opened the dialog — or the ordinary
habit of pressing `Enter` twice — confirms it immediately.

A plain `Dialog` does not validate its content: confirm is enabled unless you
pass `isValid={false}`. Derive `isValid` from your own input state so confirm
stays disabled until the input is complete. (`CommandDialog` does this for you
from the command's validation.) A dialog that needs **no** input has no such
gate, which is exactly backwards when the action is destructive. Say where
focus should go with `initialFocus`:

| `DialogInitialFocus` | Focuses                                                                |
| -------------------- | ---------------------------------------------------------------------- |
| `Confirm` (default)  | The `Ok` / `Yes` button                                                |
| `Cancel`             | The dismissing button — `Cancel`, or `No` when the set has no `Cancel` |
| `Content`            | The dialog's own title, so nothing is armed                            |

```tsx
import { Dialog, DialogInitialFocus } from '@cratis/components/Dialogs';
import { DialogButtons } from '@cratis/arc.react/dialogs';

export const DeletePersonalDataDialog = () => (
    <Dialog
        title='Delete personal data?'
        buttons={DialogButtons.YesNo}
        initialFocus={DialogInitialFocus.Cancel}
    >
        This permanently removes the person and every record about them.
    </Dialog>
);
```

Opened through `useDialog`, the caller receives `DialogResult.Yes` or `DialogResult.No` from the buttons, and `DialogResult.Cancelled` from the X, `Escape`, or a backdrop click.

`Cancel` falls back to `Content` when the button set has nothing to dismiss
with (`DialogButtons.Ok`, a custom footer, or no footer). Focus never stays on
`document.body`: a modal that does not move focus into itself leaves keyboard
and screen-reader users stranded outside the content that just interrupted
them.

`initialFocus` is forwarded by `CommandDialog`, and it changes **only** focus —
the footer, the close (X), `Escape`, and every callback keep working. That is
the difference from the older workaround of replacing `buttons` with a custom
node, which silently gives all of those up.

## Notes

- Prefer `onConfirm` and `onCancel` over `onClose` for clear intent.
- `onConfirm` and `onCancel` must return `true`, or call `closeDialog` themselves, to close the dialog.
- `onClose` closes unless it returns `false`.
- For typed, awaitable dialogs, let the dialog call `closeDialog(...)` from `useDialogContext<TRequest, TResult>()`.
- While `isBusy` is `true`, every button, the X, `Escape`, and the backdrop are disabled, and the content is disabled and inert.
