# Dialog

Base dialog component for creating typed dialogs that can be awaited.

## Recommended Pattern

Use `useDialog<T>()` at the call site and `useDialogContext<T>()` inside the dialog component.

- The caller opens the dialog with `await` and receives `[dialogResult, value]`
- The dialog closes itself through `closeDialog(...)`
- The generic `T` is the value returned from the dialog

This pattern gives strongly typed dialog results and a simple async flow.

## Example

```typescript
import { useState } from 'react';
import { DialogResult, useDialog, useDialogContext } from '@cratis/arc.react/dialogs';
import { Dialog } from '@cratis/components/Dialogs';

type Project = {
    id: string;
    name: string;
};

const AddProjectDialog = () => {
    const { closeDialog } = useDialogContext<Project>();
    const [name, setName] = useState('');

    return (
        <Dialog
            title='Add project'
            isValid={name.trim().length > 0}
            onConfirm={() => closeDialog(DialogResult.Ok, { id: crypto.randomUUID(), name })}
            onCancel={() => closeDialog(DialogResult.Cancelled)}
        >
            {/* Dialog content */}
        </Dialog>
    );
};

const MyComponent = () => {
    const [AddProjectDialogWrapper, showAddProjectDialog] = useDialog<Project>(AddProjectDialog);

    const handleAddProject = async () => {
        const [result, project] = await showAddProjectDialog();
        if (result === DialogResult.Ok && project) {
            // Use the typed result
        }
    };

    return (
        <>
            <button onClick={handleAddProject}>Add project</button>
            <AddProjectDialogWrapper />
        </>
    );
};
```

## Props

- `title`: Dialog header text
- `visible`: Controls visibility (defaults to `true`)
- `onConfirm`: Callback for confirm actions
- `onCancel`: Callback for cancel actions
- `onClose`: Fallback close callback
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
  `'Close'` — override it to localize
- `width`: Dialog width (defaults to `'450px'`)
- `style`: Custom dialog style
- `contentStyle`: Custom content area style
- `resizable`: Accepted for source compatibility; the viewport-bounded Cratis dialog has no resize handle. Existing code that passes it keeps compiling; it simply has no effect.
- `isValid`: Enables or disables confirm actions (defaults to `true`)
- `isBusy`: When `true`, disables all buttons, blocks Escape/backdrop dismissal, and shows a loading spinner on the primary action button
- `initialFocus`: Where keyboard focus lands when the dialog opens (see below)
- `okLabel`, `cancelLabel`, `yesLabel`, `noLabel`: Button labels. Footer icons are decorative and hidden from accessibility APIs, so each button's accessible name is exactly its configured label
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

```typescript
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

## Initial focus

By default the confirm button is focused when a dialog opens, which makes the
common "read it, press Enter" flow cost one keystroke. That default also _arms_
the confirm button: browsers fire `click` from the `keydown` of `Enter`, so a
key still held down from the control that opened the dialog — or the ordinary
habit of pressing `Enter` twice — confirms it immediately.

A dialog with input is protected from this for free, because `isValid` keeps
confirm disabled until the form is complete. A dialog that needs **no** input
is not, which is exactly backwards when the action is destructive. Say where
focus should go with `initialFocus`:

| `DialogInitialFocus` | Focuses                                                                |
| -------------------- | ---------------------------------------------------------------------- |
| `Confirm` (default)  | The `Ok` / `Yes` button                                                |
| `Cancel`             | The dismissing button — `Cancel`, or `No` when the set has no `Cancel` |
| `Content`            | The dialog's own title, so nothing is armed                            |

```typescript
import { Dialog, DialogInitialFocus } from '@cratis/components/Dialogs';
import { DialogButtons, DialogResult, useDialogContext } from '@cratis/arc.react/dialogs';

const DeletePersonalDataDialog = () => {
    const { closeDialog } = useDialogContext();

    return (
        <Dialog
            title='Delete personal data?'
            buttons={DialogButtons.YesNo}
            initialFocus={DialogInitialFocus.Cancel}
            onConfirm={() => closeDialog(DialogResult.Yes)}
            onCancel={() => closeDialog(DialogResult.No)}
        >
            This permanently removes the person and every record about them.
        </Dialog>
    );
};
```

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
- `onConfirm` and `onCancel` should return `true` to close when used.
- `onClose` closes unless it returns `false`.
- For typed, awaitable dialogs, let the dialog call `closeDialog(...)` from `useDialogContext<T>()`.
