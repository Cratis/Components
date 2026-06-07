---
title: "Recipe: Building a form"
description: Execute a command from a typed form using CommandDialog and CommandForm fields, with validation handled for you.
sidebar:
  order: 3
---

**Goal:** collect input and run an Arc command — with the confirm button disabled while it executes, validation wired up, and no manual fetch.

## Use CommandDialog

`CommandDialog` takes your generated command constructor, instantiates it, renders the fields you supply plus the OK/Cancel footer, and executes on confirm:

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { InputTextField, TextAreaField } from '@cratis/components/CommandForm';
import { DialogProps, DialogResult } from '@cratis/arc.react/dialogs';
import { RegisterAuthor } from './RegisterAuthor';   // generated proxy

export const AddAuthor = ({ closeDialog }: DialogProps) => (
    <CommandDialog<RegisterAuthor>
        command={RegisterAuthor}
        title="Add author"
        okLabel="Add"
        validateOn="blur"
        onConfirm={() => closeDialog(DialogResult.Ok)}>
        <InputTextField<RegisterAuthor> value={i => i.name} title="Name" placeholder="Jane Austen" />
        <TextAreaField<RegisterAuthor> value={i => i.bio} title="Bio" />
    </CommandDialog>
);
```

The `value={i => i.name}` accessor is **typed against the command** — rename `Name` in C#, rebuild, and this line stops compiling until you fix it.

## Show the dialog

Open it from a button and await the result with `useDialog`:

```tsx
import { useDialog } from '@cratis/arc.react/dialogs';
import { DialogResult } from '@cratis/arc.react/dialogs';

const [AddAuthorDialog, showAddAuthor] = useDialog(AddAuthor);

// in your component
<>
    <button onClick={async () => {
        const [result] = await showAddAuthor();
        if (result === DialogResult.Ok) { /* command executed successfully */ }
    }}>Add author</button>
    <AddAuthorDialog />
</>
```

## Tips

- **Injected (non-input) values** — set required values like a parent id via `initialValues`, not `onBeforeExecute`. Values set in `onBeforeExecute` run too late to affect validity, so the confirm button would stay disabled. Use `onBeforeExecute` only for generated values (like a new `Guid`) that don't gate validity.
- **Multi-step forms** — reach for `StepperCommandDialog` when one command needs to be gathered across several stages.
- Don't import `Dialog` from `primereact/dialog` directly — use the Cratis wrappers so execution, validation timing, and footers stay consistent.

## Next

- [Displaying data](/components/displaying-data/) — render the results.
- The full field set and dialog options are in the Components reference and Storybook.
