---
title: Troubleshooting
description: Find the owning guidance for common Components installation, styling, rendering, and form symptoms.
---

<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

Start with the observable failure, not the widget you suspect. For the [library tutorial](tutorial/index.md), check these boundaries in order:

| Symptom | Inspect first |
| --- | --- |
| Generated import is missing | Backend slice and proxy generation |
| Components render but are unstyled | CSS entry and bundle |
| No command/query request leaves the browser | Arc provider and runtime configuration |
| Request fails or is unauthorized | Request result and backend/authentication logs |
| Confirm stays disabled | Client validity, visible fields, and hidden required values |
| Command succeeds but a row is absent | Observable query connection and read-model update |
| Only layout or product overrides fail | Ancestor height or cascade-layer order |

Keep command success, query success, and appearance separate. An empty-state message does not diagnose a failed query, and removing validation or styles to silence a symptom does not repair its cause.

## The command submit button stays disabled

Required command values must be visible to client validation before submission. Put non-input required values in `initialValues`, or keep custom controls synchronized through `currentValues`; a value first created in `onBeforeExecute` arrives too late to satisfy the validity gate. Follow [Building a form](building-a-form.md#tips) for the short rule and [CommandDialog advanced features](CommandDialog/advanced-features.md#custom-inputs) for custom inputs.

## Commands or queries do not reach the backend

Components executes commands and runs queries through the generated proxies, which read their runtime configuration from Arc's `<Arc>` provider (`@cratis/arc.react`). `CratisComponentsProvider` supplies only UI configuration and does not replace it. Check that `<Arc>` wraps the application, that its `origin`, `basePath`, and `apiBasePath` settings match your host, and that the development server forwards the proxy routes (for example `/api` and `/.cratis`) to the backend. Then watch the browser's network panel for the command or query route. See [Getting started](getting-started.mdx#install-and-wire-it-up) and the [Arc frontend guide](/arc/frontend/).

## Components render without styles

Use a local CSS entry with `@import '@cratis/components/tokens';` followed by `@import '@cratis/components/styles';` (or `styles/base` plus all mounted per-area entries). Import that local file once from the application entry. Add `theme` only for the Cratis baseline. Without structural CSS, semantic markup can render without the intended structure or appearance.

On TypeScript 6, direct TypeScript imports of package stylesheet subpaths can report `TS2882` because they have no type declarations. Prefer the CSS-first setup above with your bundler's local CSS types, or retain direct imports with the explicit module declarations in [Getting started](getting-started.mdx#install-and-wire-it-up). Do not remove the styles, suppress checking globally, or add a vendor theme to fix this. See [Set up styling](Styling/getting-started.md).

## A DataPage collapses or its paginator falls off the screen

`DataPage` fills the height it is given, so an ancestor must have a definite height, such as a sized router outlet, a flex child with `min-height: 0`, or `height: 100vh`. Without one it falls back to a small minimum height. See [DataPage](DataPage/index.md).

## A successful command does not appear in the list

First confirm the command result is successful; a disabled submit button or rejected request is a different branch. The dialog closes on success, but an observable table only changes when its query delivers a result containing the row. Check that the table uses the intended observable query, its arguments match the new data, and its connection is active.

Then inspect the backend read-model update. With Chronicle behind Arc, a projection must process the event into that model before the query can report it. Components neither subscribes directly to Chronicle nor guarantees an immediate read after a successful command. Do not keep registering the same author to force a refresh; each fresh dialog generates another id. See [Displaying data](displaying-data.md#interpret-query-status).

## A detail panel shows the previous author's books

Keep the selected row and query argument aligned. In the tutorial, `DataPage` keeps the detail component mounted when selection changes, while the query hook retains its last result until new arguments resolve. The keyed `Books` child, `key={String(item.id)}`, starts a fresh query instance per author. See [List and detail](tutorial/list-and-detail.mdx). A custom panel must also distinguish failed and unauthorized results from an empty book list.

## A row action has no selected item

`MenuItem.command` receives no arguments. Save the typed row from `onSelectionChange`, read that state in the callback, and pass its id to the dialog. `disableOnUnselected` controls whether the action is enabled; it does not inject a row. Without a typed details component, supply the explicit `DataPage` type arguments shown in [A list screen with actions](list-screen-with-actions.md).

## Yarn PnP cannot resolve `rxjs` from Arc React

If you use `@cratis/arc.react@22.6.2`, that version imports `rxjs` without declaring it. A strict Yarn PnP consumer needs the version-specific `packageExtensions` entry and `rxjs` version shown in [Getting started](getting-started.mdx#yarn-pnp-with-arc-react-2262). Arc React 22.16.0 no longer needs this workaround.

## Product CSS does not win over Components styles

Import the product stylesheet after the Components `tokens` and `styles` entries. Unlayered product CSS wins over the low-priority Components layers; a product that uses its own cascade layers must declare their order explicitly. See the [Styling cascade contract](Styling/index.md#cascade-contract) and the [mixed styling example](Styling/mixing-paths.md).

## A component import from the package root no longer compiles

The Components 4 package root is setup-only. Import components from explicit subpaths and use the current namespace-to-subpath mapping in [Migrate from Components 3 to 4](Migration/3-to-4.md#import-from-explicit-subpaths).

## An adapter still renders a built-in control

The public adapters implement the declared presentation slots rather than replacing every Components export. With the default `rendererFallback='core'`, undeclared slots use the built-in implementation; `rendererFallback='throw'` rejects that fallback without adding adapter coverage. See [Primitive adaptation: Fallback](renderers/primitive-adaptation.md#fallback) and [Unsupported renderer claims](renderers/unsupported.md#no-transparent-full-catalog-replacement).

## Server rendering crashes on a browser global

Use the [UI foundation capability matrix](ui-foundation.md#capability-matrix) to check the server-rendering boundary for the component profile. For a custom portal container, resolve `document` inside `overlayEnvironment.getContainer` and return `null` when it is unavailable, as shown in [Choose an overlay container](Common/cratis-components-provider.md#choose-an-overlay-container).

## Components 3 fails to build after updating PrimeReact to 11.2

`@cratis/components` 3.x imports `@primereact/styles/password`, which PrimeReact 11.2.0 renamed to `inputpassword`. Components 3.6.1 and earlier declare PrimeReact `^11.0.0`, so the install succeeds and then a bundler that follows package `exports`, such as Vite, fails with `"styles" is not exported by ... @primereact/styles/password`. Later 3.x maintenance releases limit PrimeReact to versions below 11.2.0, so the package manager reports the mismatch instead. Keep `primereact` and every `@primereact/*` package at 11.1.x while you stay on Components 3, or move to Components 4, which does not depend on PrimeReact; see [Migrating from 3 to 4](Migration/3-to-4.md). The PrimeReact 11 renderer adapter for Components 4 is tested against 11.2.0.

## See also

For generated proxies, command authorization, command validation, and Arc request behavior, use [Arc troubleshooting](/arc/troubleshooting/).
