---
title: Troubleshooting
description: Find the owning guidance for common Components installation, styling, rendering, and form symptoms.
---

<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

Start from the symptom you can observe. Each entry points to the page that owns the current contract and remedy.

## The command submit button stays disabled

Required command values must be visible to client validation before submission. Put non-input required values in `initialValues`, or keep custom controls synchronized through `currentValues`; a value first created in `onBeforeExecute` arrives too late to satisfy the validity gate. Follow [Building a form](building-a-form.md#tips) for the short rule and [CommandDialog advanced features](CommandDialog/advanced-features.md#custom-inputs) for custom inputs.

## Yarn PnP cannot resolve `rxjs` from Arc React

The current `@cratis/arc.react@22.6.2` package imports `rxjs` without declaring it. A strict Yarn PnP consumer needs the temporary `packageExtensions` entry and `rxjs` version shown in [Getting started](getting-started.mdx#yarn-pnp-with-arc-react-2262).

## Product CSS does not win over Components styles

Import the product stylesheet after the Components `tokens` and `styles` entries. Unlayered product CSS wins over the low-priority Components layers; a product that uses its own cascade layers must declare their order explicitly. See the [Styling cascade contract](Styling/index.md#cascade-contract) and the [mixed styling example](Styling/mixing-paths.md).

## A component import from the package root no longer compiles

The Components 4 package root is setup-only. Import components from explicit subpaths and use the current namespace-to-subpath mapping in [Migrate from Components 3 to 4](Migration/3-to-4.md#import-from-explicit-subpaths).

## An adapter still renders a built-in control

The public adapters implement the declared presentation slots rather than replacing every Components export. With the default `rendererFallback='core'`, undeclared slots use the built-in implementation; `rendererFallback='throw'` rejects that fallback without adding adapter coverage. See [Primitive adaptation: Fallback](renderers/primitive-adaptation.md#fallback) and [Unsupported renderer claims](renderers/unsupported.md#no-transparent-full-catalog-replacement).

## Server rendering crashes on a browser global

Use the [UI foundation capability matrix](ui-foundation.md#capability-matrix) to check the server-rendering boundary for the component profile. For a custom portal container, resolve `document` inside `overlayEnvironment.getContainer` and return `null` when it is unavailable, as shown in [Choose an overlay container](Common/cratis-components-provider.md#choose-an-overlay-container).

## See also

For generated proxies, command authorization, command validation, and Arc request behavior, use [Arc troubleshooting](/arc/troubleshooting/).
