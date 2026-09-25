---
title: 'Recipe: Building a form'
description: Execute a command from a typed form using CommandDialog and CommandForm fields, with validation handled for you.
---

**Goal:** collect input and run an Arc command — with the confirm button disabled until the form is valid and while it executes, validation wired up, and no manual fetch.

**Prerequisites:** the providers and styles from [Getting started](getting-started.mdx), and a generated command proxy. The examples use the Arc tutorial's `RegisterAuthor`, which has a required `id` and a `name`.

## Use CommandDialog

`CommandDialog` takes your generated command constructor, instantiates it, renders the fields you supply plus the OK/Cancel footer, and executes on confirm:

```tsx title="AddAuthor.tsx"
import { useState } from 'react';
import { Guid } from '@cratis/fundamentals';
import { CommandDialog } from '@cratis/components/CommandDialog';
import { InputTextField } from '@cratis/components/CommandForm';
import { RegisterAuthor } from './Authors/RegisterAuthor'; // generated proxy

export const AddAuthor = () => {
    const [id] = useState(() => Guid.create());
    return (
        <CommandDialog<RegisterAuthor>
            command={RegisterAuthor}
            title='Add author'
            okLabel='Add'
            initialValues={{ id }}
            validateOn='change'
            onSuccess={() => console.info('Author registered')}
        >
            <InputTextField<RegisterAuthor>
                value={(command) => command.name}
                title='Name'
                placeholder='Sample Author'
            />
        </CommandDialog>
    );
};
```

The `value={(command) => command.name}` accessor is **typed against the command** — rename `Name` in C#, rebuild, and this line stops compiling until you fix it. Every field component in [CommandForm](CommandForm/index.md) binds the same way.

What happens at each stage:

- **While editing** — **Add** stays disabled until client validation passes: every required property has a value and every rule the backend shared with the proxy is satisfied. Field messages appear on blur by default; `validateOn='change'` shows them as the user types, and `'both'` does both.
- **On confirm** — every button is disabled while the command executes.
- **On success** — `onSuccess` receives the command's response and the dialog closes.
- **On rejection** — the dialog stays open; server validation messages appear against their fields, and `onValidationFailure`, `onFailed`, `onException`, and `onUnauthorized` report the result.

## Show the dialog

Open it from a button with Arc's `useDialog`, and await the result if the caller needs to know how it closed:

```tsx title="AuthorsToolbar.tsx"
import { DialogResult, useDialog } from '@cratis/arc.react/dialogs';
import { AddAuthor } from './AddAuthor';

export const AuthorsToolbar = () => {
    const [AddAuthorDialog, showAddAuthor] = useDialog(AddAuthor);
    return (
        <>
            <button
                type='button'
                onClick={async () => {
                    const [result] = await showAddAuthor();
                    if (result === DialogResult.Ok) {
                        // The command succeeded and the dialog closed.
                    }
                }}
            >
                Add author
            </button>
            <AddAuthorDialog />
        </>
    );
};
```

`CommandDialog` closes itself through the `useDialog` context: with `DialogResult.Ok` after a successful command, and with `DialogResult.Cancelled` from **Cancel**, the close button, or Escape. You don't need to call `closeDialog` yourself. `useDialog` mounts the dialog only while it is open, so the `id` created in `AddAuthor` is fresh for every registration.

## Tips

- **Injected (non-input) values** — set required values the user doesn't type, like a new id or a parent id, via `initialValues`, not `onBeforeExecute`. `onBeforeExecute` runs only on submit, after validation, so a required value set there arrives too late and the confirm button stays disabled. Use `onBeforeExecute` only for transforms that don't affect validity, and return the values from it.
- **Multi-step forms** — reach for `StepperCommandDialog` when one command needs to be gathered across several stages.
- **Inline forms** — use [`CommandForm`](CommandForm/index.md) directly when the fields belong on the page rather than in a dialog.
- Use the Cratis dialog wrappers so execution, validation timing, focus behavior, and footers stay consistent.

## Next

- [Displaying data](displaying-data.md) — render the results
- [CommandDialog](CommandDialog/index.md) — execution callbacks, busy behavior, dialog options, and context
- [CommandForm](CommandForm/index.md) — form binding, field discovery, and available field components
