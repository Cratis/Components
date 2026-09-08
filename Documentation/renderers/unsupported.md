---
title: Unsupported renderer claims
description: Exact limits of Components renderer adaptation, platform scope, composite behavior, and installation fallback.
---

<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

Renderer adaptation is a bounded React contract. The following claims are not part of Components 4.

## No transparent full-catalog replacement

Selecting a renderer library does not transform every Components export into an equivalent vendor
component. The current MUI, PrimeReact 11, and PrimeReact 10 adapters implement only the nine
`stable-presentation/v1` slots.

Components does not promise one-to-one vendor coverage for its full catalog, and it does not infer
adapter support from matching component names. A package must declare and prove each renderer slot
it implements. Undeclared slots use the built-in fallback by default or fail when the application
sets `rendererFallback='throw'`.

## No non-React or non-DOM target

The public contract is React and browser-DOM coupled. It includes React component props, semantic
HTML attributes and elements, browser form behavior, DOM refs, CSS, and React/native events.

Renderer ABI major 1 does not target React Native, Vue, Angular, Web Components as a framework-neutral
surface, server-only template engines, terminal interfaces, or canvas/Pixi as a replacement for the
DOM component catalog. Canvas and PivotViewer may use Pixi internally, but that does not make the
rest of Components portable to non-DOM targets.

## No vendor DataPage promise

A DataPage rendered under an adapter is still DataPage. It continues to own its page layout, Arc
query binding, DataTables composition, loaded-page behavior, selection, actions, and optional detail
panel. A nested Button may use a vendor presentation slot; the page does not thereby become a MUI
Data Grid or PrimeReact DataTable.

When a screen requires a vendor grid's grouping, expansion, editing, virtualized collection,
controlled server state, or commercial feature set, build an [application-owned custom composition](custom-composition.md).
Do not depend on undocumented DOM replacement inside DataPage.

## No removal of the built-in installation

Installing `@cratis/components` still installs its built-in foundation, including React Aria packages
used internally for selected interactions. Choosing an adapter does not produce a vendor-only Core
archive and does not tree-shake package installation metadata.

The adapter package adds peer-hosted vendor implementations for declared slots. Uncovered slots can
continue through the built-in fallback. If an application cannot accept the built-in dependency or
license set in its installation at all, the current adapter model is not a fit.

## No automatic provider or portal unification

Components does not merge an application's direct vendor provider, portal registry, z-index manager,
server-rendering cache, theme, or license into one universal host. Adapter providers receive only
the public renderer provider props. PrimeReact 11 additionally requires an application-owned outer
provider and a non-secret boolean setup attestation.

The application must verify coexistence when Components overlays and direct vendor overlays can be
open together. Passing renderer conformance does not establish application-shell layering or focus
behavior.

## No universal conformance claim

Repository conformance and Storybook checks are bounded evidence. They do not establish universal
visual fidelity, browser support, accessibility, assistive-technology behavior, performance,
security, licensing compliance, or production suitability. Read the exact adapter package manifest,
README, `CONFORMANCE.md`, notices, and upstream terms for the version under evaluation.

## Supported decisions

Use the [renderer overview](index.md) to choose explicit ownership, the [primitive profile](primitive-adaptation.md)
for the exact adaptable surface, and the [licensing policy](licensing.md) for package/key boundaries.
