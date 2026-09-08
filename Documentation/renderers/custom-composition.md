---
title: Build a custom vendor-native composition
description: Combine Arc-generated contracts with application-owned vendor workflows without relabeling Components composites as vendor-native.
---

<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

**Goal:** keep Arc's generated command and query contracts while building a workflow whose table,
dialog, selection, and editing behavior all belong to an application-selected vendor.

## Choose the boundary

Use a renderer adapter when only the nine common primitives need vendor presentation. Use custom
composition when the required capability belongs to a larger workflow: grouped rows, vendor lazy
loading, a vendor editing model, a commercial scheduler, or a suite-specific dialog/grid contract.

Do not start with `DataPage` and describe the result as a vendor DataPage. DataPage still owns its
layout, Arc query binding, selection, action menu, details panel, and DataTables composition even
when some nested buttons use an adapter.

## Read through the Arc contract

Call the generated query hook when you need values rather than a Components table. Feed the returned
read models into an application-owned vendor wrapper:

```tsx
import { AllAccounts } from './generated/AllAccounts';
import { AccountGrid } from './vendor/AccountGrid';

export const Accounts = () => {
    const [accounts] = AllAccounts.use();

    return <AccountGrid rows={accounts.data} />;
};
```

`AccountGrid` owns the vendor's row identity, sorting, filtering, paging, selection, keyboard model,
and rendering. Arc still owns the generated transport/query contract. If the vendor grid performs
server operations, model those operations as explicit query arguments and apply them on the server;
do not infer complete-result behavior from Components loaded-page table state.

Use the generated Arc command API in the same way for writes. Keep command construction, validation,
execution results, and error handling typed at the Arc boundary, while the application-owned dialog
or editor maps its vendor event model into those values. Do not pass a vendor event object into a
Components `ChangeHandler<T>` or cast incompatible callback types together.

## Keep providers explicit

Mount every provider for the scope it actually owns:

```tsx
import { CratisComponentsProvider } from '@cratis/components';
import { ApplicationVendorProvider } from './vendor/ApplicationVendorProvider';
import { Accounts } from './Accounts';

export const Application = () => (
    <ApplicationVendorProvider>
        <CratisComponentsProvider value={{ locale: 'en-US' }}>
            <Accounts />
        </CratisComponentsProvider>
    </ApplicationVendorProvider>
);
```

The vendor provider owns the vendor-native `AccountGrid`. The Components provider remains available
for other Components surfaces in the application. Neither provider receives the other's theme,
portal registry, cache, or license unless that vendor's own documented API requires the application
to supply it directly.

If this workflow uses no Components surface, it does not need `CratisComponentsProvider`. Arc can be
used without Components.

## Reuse portable Components contracts selectively

Use a Components primitive when its public semantic contract fits. For example, an application may
render a Components `Button` beside a vendor grid, or select one of the three concrete primitive
adapters for that button. Continue to style it through its typed parts and `data-cratis-*` states.

Do not reuse a Components type merely to give a vendor-native object a familiar name. `DataPage`,
`Column`, `MenuItem`, `DialogParts`, and `ChangeHandler<T>` describe specific Components contracts.
A vendor grid column, menu tree, modal lifecycle, or change event remains vendor-owned unless an
explicit adapter translates and proves the exact Components contract.

## Own integration behavior

The application-owned composition must specify and test:

1. which query arguments own server paging, sorting, and filtering;
2. which component owns selection and row identity;
3. which dialog or editor owns focus, dismissal, validation timing, and pending state;
4. where overlays portal and how their layers interoperate with Components overlays;
5. how vendor values and errors map to generated Arc command/query values; and
6. who owns licensing, themes, server rendering, CSP, and upgrade verification.

Test the complete workflow in the real provider and portal shell. Components conformance evidence
for an adapter's nine primitives does not cover this application-owned composition.

## Verify the result

A vendor-native workflow should contain vendor-native behavior because the application deliberately
composed it, not because a provider was expected to transform a Cratis composite. Confirm that:

- no Cratis composite is being described as a vendor equivalent;
- one control owns each focus and keyboard interaction;
- Arc queries apply complete-result operations before paging;
- package/provider/license boundaries remain explicit; and
- the built-in fallback remains available only where the application intends it.

Read [renderer coexistence](index.md) for portal and focus rules and [unsupported renderer claims](unsupported.md)
for the promises this approach does not create.
