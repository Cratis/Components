---
title: "Build a list screen with Cratis Components"
description: Combine DataPage and command dialogs in a React list screen, with live Arc query results and actions that use the selected row.
---

Use `DataPage` in Cratis Components when a list needs an action bar and actions for the selected row. This author screen combines [an observable table](/components/displaying-data/) with [command dialogs](/components/building-a-form/): **Add author** is available without a selection, while **Add book** needs a selected author.

Complete the providers and styles from [Getting started](/components/getting-started/), and keep the Arc backend running. You need the generated contracts from the [tutorial prerequisites](tutorial/index.md#before-you-start): `Author`/`AllAuthors`, `RegisterAuthor`, `BooksForAuthor`, and `AddBook`.

Reuse `AddAuthor` from the [form recipe](/components/building-a-form/) and `AddBookDialog` from the [tutorial](/components/tutorial/list-and-detail/). The latter accepts `authorId` and passes it to `AddBook` through `initialValues`, so the user only enters the book's details. The example below composes those dialogs; it does not define replacement proxies.

Declare `react-icons` in the frontend package when importing its icons directly, even though Components also uses it internally:

```bash
npm install react-icons
```

## The shape

`AllAuthors` supplies the rows and later updates. The two menu items open dialogs, but only **Add book** depends on selection. Keep that selected author in React state so the action can pass its id to the dialog.

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

## Check selection and completion

1. With no selection, **Add author** is available and **Add book** is disabled.
2. Select a row. `onSelectionChange` saves its typed `Author`; the no-argument action reads that state and passes `selected.id` as `authorId` to the dialog.
3. Confirm a valid book title. The dialog closes on command success. The observable result updates separately; this recipe has no books panel, so inspect that author's books using the [tutorial's details component](tutorial/list-and-detail.mdx).
4. Change selection and open **Add book** again. Check that it targets the newly selected author, not a captured id from the previous dialog.

`disableOnUnselected` only controls availability; it does not pass a row to `command`. Keep the selected-state guard. The example also assumes your shell supplies a visible heading: `DataPage.title` alone is not rendered.

There is no application refresh handler for the observable table, but command success is not a read-after-write timing guarantee. If a command succeeds and a row is absent, inspect the query connection and read-model update before retrying. With Chronicle behind Arc, projection progress belongs to that check.

## Tips

To add edit or remove actions, define the corresponding commands, such as `RenameAuthor` and `RemoveAuthor`. Give each a `disableOnUnselected` menu item and pass the selected id through the dialog's `initialValues`. As with adding an author, the table changes when its observable query delivers the updated result.

Add a `detailsComponent` when the user needs to inspect the selected row; see [DataPage details panel](DataPage/details-panel.md). The list and detail queries can read different, purpose-built read models instead of sharing one model for every screen.

If you need only rows, without an action bar or detail panel, use [`DataTableForObservableQuery`](DataTables/data-table-for-observable-query.md) directly.

## Next

- [Building a form](building-a-form.md) and [Displaying data](displaying-data.md) — the two halves in detail
- [DataPage](DataPage/index.md) — configure the action row, columns, selection, and details panel
- [CommandDialog](CommandDialog/index.md) — execute the add, edit, and remove commands
