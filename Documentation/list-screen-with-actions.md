---
title: "Recipe: A list screen with actions"
description: Combine a live table with command dialogs to build the everyday "list things, add/edit/remove them" screen.
---

**Goal:** the most common screen in any app — a table of things with an action bar to add one, and selection-aware actions that work on the selected row. This recipe wires [displaying data](/components/displaying-data/) and [running commands](/components/building-a-form/) together.

**Prerequisites:** the providers and styles from [Getting started](/components/getting-started/), an observable query proxy (`AllAuthors`), and a `CommandDialog` component for each action. `AddAuthor` comes from the [form recipe](/components/building-a-form/); `AddBookDialog` takes an `authorId` prop and passes it to `AddBook` through `initialValues`, as in the [tutorial](/components/tutorial/list-and-detail/).

## The shape

- A **live table** reads an observable query, so it reflects changes the instant a command lands.
- An **action bar** item opens an "add" `CommandDialog`.
- **Selection-aware actions** are disabled until a row is selected, then open a command dialog for that row.

```tsx title="Authors.tsx"
import { useState } from 'react';
import { useDialog } from '@cratis/arc.react/dialogs';
import { Column, DataPage, MenuItem } from '@cratis/components/DataPage';
import { FaBook, FaPlus } from 'react-icons/fa6';
import { AllAuthors, type Author } from './Authors/Author'; // observable query proxy
import { AddAuthor } from './AddAuthor';
import { AddBookDialog } from './AddBook';

export const Authors = () => {
    const [selected, setSelected] = useState<Author | null>(null);
    const [AddAuthorWrapper, showAddAuthor] = useDialog(AddAuthor);
    const [AddBookWrapper, showAddBook] = useDialog(AddBookDialog);

    return (
        <div style={{ height: '100vh' }}>
            <DataPage<AllAuthors, Author, object>
                title='Authors'
                query={AllAuthors}
                emptyMessage='No authors yet'
                onSelectionChange={(event) => setSelected(event.value)}
            >
                <DataPage.MenuItems>
                    <MenuItem
                        label='Add author'
                        icon={FaPlus}
                        command={() => void showAddAuthor()}
                    />
                    <MenuItem
                        label='Add book'
                        icon={FaBook}
                        disableOnUnselected
                        command={() => {
                            if (selected) {
                                void showAddBook({ authorId: selected.id });
                            }
                        }}
                    />
                </DataPage.MenuItems>
                <DataPage.Columns>
                    <Column field='name' header='Name' sortable />
                </DataPage.Columns>
            </DataPage>
            <AddAuthorWrapper />
            <AddBookWrapper />
        </div>
    );
};
```

`MenuItem.command` receives no arguments, so the screen keeps the selected row from `onSelectionChange`. The explicit type arguments make `event.value` an `Author`; without them, and without a typed `detailsComponent`, TypeScript infers the row as `object`. `DataPage` still tracks the selection itself for `disableOnUnselected` and the optional details panel. Give `DataPage` an ancestor with a definite height; the wrapper above uses `100vh`.

## Why it stays simple

You never write the glue between the write and the read: the command changes the data, the observable query pushes its new result, and the table re-renders — automatically. With Chronicle, the new result arrives once the projection has updated the read model. There's no "refresh the list after saving" code because there's nothing to refresh.

## Tips

- **Edit and remove are just more commands.** Model them as commands (for example `RenameAuthor` and `RemoveAuthor`), add a `disableOnUnselected` menu item for each, and pass the selected row's id through the dialog's `initialValues`; the table updates itself.
- **Keep the table's read model specialized.** The list query and a detail query can read different, purpose-built read models — don't force one model to serve every screen.
- **Show the selected row's details** by passing a `detailsComponent`; see [DataPage details panel](DataPage/details-panel.md).
- For a plain table without the action bar and details panel, use [`DataTableForObservableQuery`](DataTables/data-table-for-observable-query.md) directly.

## Next

- [Building a form](building-a-form.md) and [Displaying data](displaying-data.md) — the two halves in detail
- [DataPage](DataPage/index.md) — configure the action row, columns, selection, and details panel
- [CommandDialog](CommandDialog/index.md) — execute the add, edit, and remove commands
