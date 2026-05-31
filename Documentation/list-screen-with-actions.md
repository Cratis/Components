---
title: "Recipe: A list screen with actions"
description: Combine a live table with command dialogs to build the everyday "list things, add/edit/remove them" screen.
sidebar:
  order: 6
---

**Goal:** the most common screen in any app — a table of things with a toolbar to add, and per-row actions to edit or remove. This recipe wires [displaying data](/components/displaying-data/) and [running commands](/components/building-a-form/) together.

## The shape

- A **live table** reads an observable query, so it reflects changes the instant a command lands.
- A **toolbar button** opens an "add" `CommandDialog`.
- **Row actions** open edit/remove command dialogs for the selected item.

```tsx
import { DataPage, MenuItem } from '@cratis/components/DataPage';
import { Column } from 'primereact/column';
import { useDialog } from '@cratis/arc.react/dialogs';
import { AllAuthors } from './Author';        // observable query proxy
import { AddAuthor } from './AddAuthor';       // CommandDialog from the form recipe

export const Authors = () => {
    const [AddAuthorDialog, showAddAuthor] = useDialog(AddAuthor);

    return (
        <>
            <DataPage
                title="Authors"
                query={AllAuthors}
                emptyMessage="No authors yet">
                <DataPage.MenuItems>
                    <MenuItem label="Add author" icon="pi pi-plus" command={() => showAddAuthor()} />
                </DataPage.MenuItems>
                <DataPage.Columns>
                    <Column field="name" header="Name" sortable />
                </DataPage.Columns>
            </DataPage>
            <AddAuthorDialog />
        </>
    );
};
```

## Why it stays simple

You never write the glue between the write and the read: the "add" command appends an event, the projection updates the read model, and the observable table re-renders — automatically. There's no "refresh the list after saving" code because there's nothing to refresh.

## Tips

- **Edit and remove are just more commands.** Model them as commands (`RenameAuthor`, `RemoveAuthor`) and open them in dialogs the same way; the table updates itself.
- **Keep the table's read model specialized.** The list query and a detail query can read different, purpose-built read models — don't force one model to serve every screen.
- For a plain table without the detail panel, use [`DataTableForObservableQuery`](/components/displaying-data/) directly.

## Next

- [Building a form](/components/building-a-form/) and [Displaying data](/components/displaying-data/) — the two halves in detail.
- [Build a full-stack feature](/build-a-full-app/) — the backend slice this screen sits on.
