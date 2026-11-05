---
title: 'Cratis Components Dialog: return a typed result'
description: Use Cratis Components Dialog with Arc hooks to await a typed result, handle cancellation, and control focus and dismissal in a modal or side sheet.
---

Cratis Components `Dialog` displays your content in a modal or side sheet. Pair it with Cratis Arc's dialog hooks when a caller needs to await the user's choice and an optional typed value. The caller decides what to do with that value; `Dialog` does not validate or execute an Arc command for you.

## Recommended pattern

Start with the [runtime and provider setup](../getting-started.mdx). At the call site, use `useDialog<TResult>(DialogComponent)`, render the returned wrapper, and await its show function. Inside the dialog, use `useDialogContext<object, TResult>()` to call `closeDialog(result, value?)`. Both hooks come from `@cratis/arc.react/dialogs`.

The show function resolves to `[dialogResult, value?]`, not the value alone. Check both before continuing, because cancellation can return no value. `TResult` describes that optional value; use `object` as the context's request type when the dialog takes no input props.

For a dialog that takes input, the generic order differs: `useDialog<TResult, TRequest>(DialogComponent)` at the caller, and `useDialogContext<TRequest, TResult>()` inside. Pass the request to the show function; the dialog receives it as props and through `context.request`. The [Arc dialog contract](/arc/frontend/react/dialogs/) shows a typed request example. Each `useDialog` instance holds one pending response, so await that interaction before opening it again.

## Example

This example collects a project name and returns a local `Project` value. It does not persist a project or run a backend command. Render `MyComponent` within the configured application.

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

`isValid` keeps Ok disabled until the name contains non-whitespace text. On confirmation, `closeDialog` returns the project to the waiting caller. With this default footer, Cancel, the header close (X), Escape, and a backdrop click need no callback: they resolve the call with `DialogResult.Cancelled` and no project. `useDialog` unmounts the dialog on close, so the name starts empty on the next opening.

## How the dialog closes

Predefined footer buttons and enabled dismissal paths use the same callback rules. In the table, "closes" means that `Dialog` calls `closeDialog(result)` from the surrounding `useDialog` context without a value. A dedicated `onConfirm` or `onCancel` takes precedence over `onClose` for that action.

| User action | Dedicated callback present | Only `onClose` present | No callback |
| ----------- | -------------------------- | ---------------------- | ----------- |
| `Ok` / `Yes` | `onConfirm()` runs; closes only if it returns `true` | `onClose(result)` runs; closes unless it returns `false` | Closes with `DialogResult.Ok` / `Yes` |
| `Cancel` / `No`, X, `Escape`, backdrop | `onCancel()` runs; closes only if it returns `true` | `onClose(result)` runs; closes unless it returns `false` | Closes with `DialogResult.Cancelled` / `No` |

The X, Escape, and backdrop report `DialogResult.Cancelled`, even with `DialogButtons.YesNo`; the No button reports `DialogResult.No`. Callbacks may be async, and the dialog awaits them before deciding whether to close. Returning nothing from `onConfirm` or `onCancel` keeps it open unless the callback calls `closeDialog(...)` itself. Calling `closeDialog` directly is how the example returns a project value.

An async callback does not automatically make a plain `Dialog` busy. Set `isBusy` while your operation is pending if you need to block further activation and dismissal.

Outside `useDialog`, there is no context to close the dialog. Update `visible` from your callbacks instead. This excerpt belongs inside a component with `useState`, `Dialog`, and `DialogButtons` imported:

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
- `headerActions`: Actions rendered in the header before the close button — see [Header actions](#header-actions)
- `hideGlobalHeaderActions`: Leaves out the app-wide header actions registered on the provider for this dialog
- `sliceLocation`: Where the dialog's opener sits in the application (`{ module, feature, slice }`); handed to app-wide header actions
- `visible`: Controls visibility (defaults to `true`)
- `onConfirm`: Callback for confirm actions; return `true` to close. See [How the dialog closes](#how-the-dialog-closes)
- `onCancel`: Callback for cancel actions, the X, `Escape`, and a backdrop click; return `true` to close
- `onClose`: Fallback close callback for whichever of `onConfirm` / `onCancel` is absent; closes unless it returns `false`
- `buttons`: Predefined `DialogButtons` (`Ok`, `OkCancel`, `YesNo`, `YesNoCancel`), `null` for no footer, or a custom React node. Defaults to `DialogButtons.OkCancel`. Custom footer buttons do not invoke the dialog callbacks automatically; wire their actions yourself. Custom or absent footers also disable X, Escape, and backdrop dismissal by default. Re-enable those paths with `dismissable` or the independent dismissal props below.
- `dismissable`: Combined default for the header close (X), a backdrop click and `Escape` (see below)
- `dismissOnOutsideClick`: Overrides backdrop dismissal independently
- `closeOnEscape`: Overrides Escape dismissal independently
- `showCloseButton`: Overrides header close-button visibility independently
- `closeAriaLabel`: Accessible name for the header close button. Defaults to
  the [`CratisComponentsProvider`](../Common/cratis-components-provider.md)'s
  `messages.dialog.close`, then `'Close'` — override it to localize a single dialog
- `width`: Dialog width (defaults to `'450px'`)
- `style`: Custom dialog style
- `contentStyle`: Custom content area style
- `resizable`: Accepted for source compatibility; the viewport-bounded Cratis dialog has no resize handle. Existing code that passes it keeps compiling; it simply has no effect.
- `isValid`: Enables or disables confirm actions (defaults to `true`)
- `isBusy`: Blocks action activation and dismissal, disables and makes the content inert, and shows a spinner on the predefined primary button. That button stays focusable with `aria-disabled`; secondary buttons and the X are disabled. A custom footer is disabled and inert as a whole.
- `initialFocus`: Where keyboard focus lands when the dialog opens (see below)
- `okLabel`, `cancelLabel`, `yesLabel`, `noLabel`: Button labels. Each resolves from the prop, then the
  [`CratisComponentsProvider`](../Common/cratis-components-provider.md)'s matching `messages.dialog` entry
  (`ok`, `cancel`, `yes`, `no`), then its English default (`'Ok'`, `'Cancel'`, `'Yes'`, `'No'`) — localize every
  dialog at once through the provider, or one dialog through the prop. Each predefined button uses its label as its accessible name. `CommandDialog` forwards these same props to `Dialog`, so the same precedence covers it.
  `StepperCommandDialog` uses `okLabel` for its Submit button (falling back to `messages.stepper.submit`) and
  `cancelLabel` for its optional footer Cancel.
- `className`, `pt`: Styling hooks for the Cratis-owned dialog root and stable parts — see the [pass-through cheat sheet](../Styling/pass-through.md)
- `ptOptions`, `unstyled`: Retained temporarily for source compatibility; ignored because Cratis part attributes always merge and styling is CSS-owned

## Header actions

Use `headerActions` for actions such as Help or Copy link that belong to the dialog but do not confirm or cancel it. They render in the `header-actions` part before the close button in keyboard and reading order. This excerpt assumes your application's `Button` is imported:

```tsx
<Dialog title='Edit details' headerActions={<Button variant='ghost' size='small' label='Help' />}>
    Details go here.
</Dialog>
```

`CommandDialog` and `StepperCommandDialog` accept the same `headerActions`, `hideGlobalHeaderActions` and `sliceLocation` props.

### Register actions for every dialog

Register a shared action once on `CratisComponentsProvider`. This excerpt assumes your own `FeedbackButton` and `App` components:

```tsx
import { CratisComponentsProvider, type DialogHeaderContext } from '@cratis/components';

const feedbackAction = (dialog: DialogHeaderContext) =>
    dialog.isCommandDialog ? null : <FeedbackButton about={dialog.title} />;

<CratisComponentsProvider dialogHeaderActions={feedbackAction}>
    <App />
</CratisComponentsProvider>;
```

The renderer is mounted as a component for every dialog, so it can use hooks. It receives a `DialogHeaderContext`:

| Field | Meaning |
| --- | --- |
| `dialogId` | Identifies this dialog instance. Also rendered as `data-cratis-dialog-id` on the dialog root. |
| `title` | The dialog title. |
| `isCommandDialog` | `true` for `CommandDialog` and `StepperCommandDialog`. |
| `sliceLocation` | The `{ module, feature, slice }` the host or Arc supplied through the dialog's `sliceLocation` prop, when there is one. |

Return `null` to show nothing for a dialog. A dialog's own `headerActions` render first, next to the app-wide ones, and `hideGlobalHeaderActions` leaves the app-wide actions out of one dialog.

The dialog slot (`dialogs.dialog`) renders the region, so adapter-based dialogs show it too. Style it through the `headerActions` pass-through key (`pt={{ headerActions: { className: '...' } }}`).

## Dismissing

Dismissal means closing without confirmation through the header X, Escape, or a backdrop click. `dismissable` sets a combined default for those three paths; it does not change the footer buttons.

A predefined `DialogButtons` set enables all three paths by default. A custom footer or `buttons={null}` disables them. With a custom footer, wire the button handlers yourself and ensure the user has a way to leave the dialog.

Set `dismissable` to restore all three paths. This excerpt assumes your own `MyOwnFooter` component and `closeDialog` from `useDialogContext()`:

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

`showCloseButton`, `closeOnEscape`, and `dismissOnOutsideClick` each override the combined default. If omitted, each falls back to `dismissable`, then to the default derived from `buttons`. To keep the X and Escape available with the default footer but prevent an accidental backdrop click from closing the dialog:

```tsx
<Dialog title='Edit details' dismissOnOutsideClick={false}>
    …
</Dialog>
```

Use `showCloseButton={false}` to hide only the X, or `closeOnEscape={false}` to disable only Escape. `CommandDialog` forwards these controls. While `isBusy` is true, dismissal stays blocked regardless of overrides, and a visible X is disabled. Changing dismissal options does not change initial focus or footer callback rules.

## Placement

Use the default `placement='center'` for a centered modal. Choose `'start'` or `'end'` for a full-height side sheet, such as a detail pane beside the current page. These are inline edges: start is left in a left-to-right layout and right in a right-to-left layout. `width` sets the sheet's width within the viewport. The sheet slides in from its edge; `prefers-reduced-motion` disables that animation.

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

The predefined confirm button receives focus by default. That makes Enter a convenient way to confirm, but it is a poor default for a destructive choice: another Enter can activate the action before the user has reviewed it. Use `DialogInitialFocus.Cancel` to focus the dismissing button, or `Content` to focus the title without selecting an action.

Focus and validity are separate. A plain `Dialog` enables confirm unless `isValid={false}`; derive validity from your input state as in the project example. `CommandDialog` also uses command-form validity to gate confirmation. Choose initial focus independently:

| `DialogInitialFocus` | Focuses                                                                |
| -------------------- | ---------------------------------------------------------------------- |
| `Confirm` (default)  | The `Ok` / `Yes` button                                                |
| `Cancel`             | The dismissing button — `Cancel`, or `No` when the set has no `Cancel` |
| `Content`            | The dialog's own title, so nothing is armed                            |

The following prompt illustrates a destructive choice with No focused. It only returns a decision; the caller must implement any deletion.

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

`Cancel` falls back to the title when there is no predefined dismissing button: `DialogButtons.Ok`, a custom footer, or no footer. For custom or absent footers, choose `Content` explicitly if you want the title focused on opening.

`CommandDialog` forwards `initialFocus`. The setting changes focus only; it does not replace the footer, change dismissal options, or alter callback rules. Check the actual application flow with the keyboard, including focus when the dialog opens and where it returns after confirmation or cancellation.

## Notes

When a confirm callback keeps the dialog open, focus returns to the predefined confirm button, or to the title if confirm is unavailable or disabled by `isValid`. A polite live region announces that the action was not completed. Its text comes from the provider's `messages.dialog.refused`, falling back to `'The action was not completed. Review the dialog and try again.'`. Repeated keydown events from a held Enter or Space are ignored on the predefined confirm button.

Check confirmation and each enabled cancellation path separately. With custom buttons, also check their handlers, busy state, and initial focus; predefined footer behavior does not wire those handlers for you. If the next step is command validation and execution rather than returning a value, continue with [CommandDialog](../CommandDialog/index.md) and the [form recipe](../building-a-form.md).
