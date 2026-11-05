---
title: 'Cratis Components: build a vendor-native workflow'
description: Use Cratis Arc contracts in an application-owned vendor grid or editor alongside Cratis Components. Keep data, provider, and focus ownership explicit.
---

<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

Build an application-owned vendor workflow with Cratis Arc's generated command and query contracts
when you need more than primitive styling. Your grid or editor owns its interactions, while Arc
connects it to the backend. Cratis Components can remain in use elsewhere in the application without
owning this workflow.

## Choose the boundary

Use a renderer adapter when the nine common primitives, such as buttons and text inputs, need
vendor presentation. Choose custom composition when the capability you need belongs to a larger
workflow: grouped rows, vendor lazy loading, a vendor editing model, a commercial scheduler, or a
suite-specific dialog/grid contract.

Start that workflow with the vendor components and connect them to Arc directly. Starting with
`DataPage` leaves Components in charge of layout, Arc query binding, selection, the action menu,
the details panel, and DataTables composition. An adapter can change nested buttons without making
DataPage a vendor-native grid.

## Read through the Arc contract

Call the generated query hook to get the data without a Components table. In this example,
`AllAccounts` represents an application-generated query, and `AccountGrid` is a vendor wrapper you
supply. Pass the returned read models, the query's data for display, into that wrapper:

```tsx
import { AllAccounts } from './generated/AllAccounts';
import { AccountGrid } from './vendor/AccountGrid';

export const Accounts = () => {
    const [accounts] = AllAccounts.use();

    return <AccountGrid rows={accounts.data} />;
};
```

`accounts.data` gives the wrapper the query data; it does not configure a vendor grid. In
`AccountGrid`, define row identity, sorting, filtering, paging, selection, keyboard behavior, and
rendering using the vendor's API. Also handle the query's loading and failure states so an empty
grid does not hide an unfinished or failed request.

If the grid requests server-side sorting, filtering, or paging, connect those requests to explicit
query arguments and apply the operations on the server. Sorting or filtering only the loaded page
cannot produce a result for the complete dataset. Arc supplies the generated transport/query
contract, while the application decides how the vendor grid drives it.

Use the generated Arc command API for writes. Let the application-owned dialog or editor map vendor
events to typed command values, then handle validation and execution results at the Arc boundary.
A Components `ChangeHandler<T>` expects the next semantic value as its first argument, not a vendor
event wrapper. Translate the event instead of casting incompatible callback types together.

## Keep providers explicit

Mount `<Arc>` around the workflow so generated hooks use your application's Arc configuration and
query cache, even when the screen uses no Components controls. Place the vendor provider where its
components can read it. This example also keeps Components configuration available for other surfaces:

```tsx
import { Arc } from '@cratis/arc.react';
import { CratisComponentsProvider } from '@cratis/components';
import { ApplicationVendorProvider } from './vendor/ApplicationVendorProvider';
import { Accounts } from './Accounts';

export const Application = () => (
    <Arc>
        <ApplicationVendorProvider>
            <CratisComponentsProvider value={{ locale: 'en-US' }}>
                <Accounts />
            </CratisComponentsProvider>
        </ApplicationVendorProvider>
    </Arc>
);
```

`<Arc>` supplies configuration such as origin and API base path, along with an application-scoped
query cache. Query hooks have default contexts if `<Arc>` is absent, but neither UI provider supplies
Arc configuration. `ApplicationVendorProvider` is an application-owned wrapper for the vendor setup,
just as `AccountGrid` wraps the grid. It supplies the vendor context; `CratisComponentsProvider` supplies
Components configuration. Neither automatically transfers themes, portal registries, caches, or
license keys to the other. Supply each resource through the API of the provider that needs it.

If this workflow uses no Components surface, omit `CratisComponentsProvider` and keep `<Arc>` for
the application's Arc configuration. Arc can be used without Components.

## Reuse portable Components contracts selectively

A Components `Button` can sit beside a vendor grid when its public props and behavior fit the task.
You can select a primitive adapter for that button and style it through typed parts and
`data-cratis-*` states. This does not change who owns the neighboring grid.

Keep vendor-specific types at that boundary. `DataPage`, `Column`, `MenuItem`, `DialogParts`, and
`ChangeHandler<T>` describe specific Components contracts, not interchangeable names for vendor
objects. A vendor grid column, menu tree, modal lifecycle, or change event needs an explicit
translation before it can satisfy the corresponding Components contract.

## Own integration behavior

Specify and test the integration decisions that the application now owns:

- Query arguments for server paging, sorting, and filtering.
- Selection state and row identity.
- Focus, dismissal, validation timing, and pending state in the dialog or editor.
- Portal containers and layer order when vendor and Components overlays are open together.
- Mapping vendor values and errors to generated Arc command/query values.
- Licensing, themes, server rendering, Content Security Policy (CSP), and upgrade verification.

Give each interaction one focus owner. Wrapping a vendor modal in a Components modal can introduce
two focus traps or competing Escape handlers. Configure the vendor's portal separately from the
Components `overlayEnvironment`; the two systems do not share a portal registry or layer service.

Test the complete workflow in the real provider and portal shell. Conformance checks for an
adapter's nine primitives do not cover this application-owned composition.

## Verify the result

Walk through loading the query, selecting a row, editing it, and handling both successful and failed
command results. Check keyboard navigation and focus restoration with the actual overlays open.
When the grid uses server operations, confirm that sorting and filtering apply to the complete
result before paging. Any Components controls in the workflow should use the selected adapter or
built-in fallback intentionally; neither turns the surrounding workflow into a vendor equivalent.

Use [renderer coexistence](index.md) to configure the remaining Components controls alongside vendor
portals and focus handling. Check [unsupported renderer claims](unsupported.md) before describing
which parts an adapter replaces.
