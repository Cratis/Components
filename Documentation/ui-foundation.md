---
title: UI foundation
description: Why Components owns its public design system and uses React Aria for accessible behavior.
sidebar:
    order: 2
---

Components exists to give a Cratis application a stable, productive UI API—not to expose whichever rendering library happens to implement it. The default package therefore owns its markup, styling contract, and TypeScript types. It uses React Aria internally for accessible interaction behavior and uses TanStack Table only when a table needs advanced state that Arc paging and React Aria do not already provide.

This is an accepted direction for the next major release. Components 3 remains PrimeReact-backed so compatible fixes can ship without hiding a renderer migration inside a minor release.

## Decision

The next major release follows these boundaries:

```mermaid
graph TD
    App[Consumer application] --> Components[@cratis/components]
    Components --> Contracts[Cratis-owned APIs, parts, tokens, and state attributes]
    Components --> Aria[React Aria interaction behavior]
    Components --> Table[TanStack Table where advanced table state is needed]
    Components --> Arc[@cratis/arc.react bindings]
    Legacy[@cratis/components.primereact compatibility package] --> Prime[PrimeReact / PrimeUI]
```

Consumers continue importing `@cratis/components/*`. React Aria and TanStack are implementation dependencies and do not appear in public prop types.

Arc command, query, and dialog bindings remain owned by `@cratis/arc.react`. Components builds visual behavior around those bindings rather than re-exporting them through a package with optional rendering peers.

## Consumer contract

The public contract must make both the default Cratis look and a deeply customized product design straightforward:

- Cratis-owned CSS variables for semantic colors, spacing, typography, motion, elevation, and control dimensions.
- Stable Cratis part names for every meaningful component element.
- State data attributes such as open, selected, disabled, invalid, pending, and orientation.
- `className`, `style`, and per-part configuration without renderer-specific types.
- No required theme preset or proprietary provider.
- Light, dark, forced-colors, reduced-motion, responsive, and right-to-left behavior.
- Public component behavior that remains stable when the internal foundation changes.

A product may map its own tokens directly onto the Cratis variables or style the stable parts itself. It must not need selectors tied to React Aria's DOM or an internal package's class names.

## Why React Aria

[React Aria Components](https://react-aria.adobe.com/getting-started) is style-free and Apache-2.0 licensed. It supplies the interaction behavior that is difficult to implement and maintain correctly: keyboard navigation, focus management, screen-reader semantics, collection behavior, overlays, internationalized dates, and cross-device input.

Its official component set covers the high-risk primitives Components needs, including Dialog, Select, ComboBox, Table, DatePicker, NumberField, Slider, ColorPicker, Tooltip, and form controls. Its table supports selection, sorting, hierarchical rows, column resizing, drag-and-drop, infinite loading, and virtualization. Its date stack supports locale-specific formats, time zones, right-to-left layouts, and multiple calendar systems.

React Aria does not remove application responsibility. Components still owns labels, error associations, focus appearance, contrast, hit targets, responsive layout, and behavior specs.

The React Aria Components Toast API is still exported as unstable. Components keeps its own toast dispatch and presentation contract and may use the lower-level React Aria/Stately toast packages or its own accessible region until the component API is stable.

## Why TanStack Table is selective

[TanStack Table](https://tanstack.com/table/latest/docs/overview) is an MIT-licensed headless table engine. It provides advanced filtering, sorting, grouping, sizing, visibility, pinning, selection, and manual server-side state without prescribing markup.

Query-backed Cratis tables already receive paging from Arc, and React Aria supplies accessible table semantics. TanStack is added only where it removes real state-management complexity. Server filtering, sorting, and paging remain one coherent operation: the server filters before paging and returns the filtered total.

## Why PrimeReact is not the default

PrimeReact 11 has a capable layered architecture, and its headless hooks are explicitly intended for custom component libraries. The constraint is the consumer contract around that architecture.

The [PrimeUI Community License](https://primeui.dev/licenses/community) states that developers building on an internal wrapper or design system still need seats. Eligibility excludes many organizations by revenue, team size, funding, or public-sector status. The [OEM guidance](https://primeui.dev/licenses/oem) also identifies frameworks and SDKs used for third-party development as potential OEM uses, while not clarifying peer-only open-source wrappers.

A PrimeReact-backed compatibility package is therefore explicit rather than invisible. It requires the Prime peers, documents that PrimeUI licensing still applies, and is not published until PrimeTek confirms the applicable OEM and redistribution terms in writing.

## Why Components does not implement every primitive itself

Owning the public API does not mean reimplementing accessibility infrastructure. Dialog focus traps, composite keyboard navigation, international calendars, collection selection, and screen-reader behavior carry high maintenance and regression risk.

Components owns product-facing composition, Arc integration, styling, and semantics. It delegates low-level interaction behavior to an open, specialized foundation and verifies the result with browser and accessibility tests.

## Release sequence

The transition is deliberately split:

1. A Components 3 minor release delivers source-compatible accessibility, localization, filtering, notification, and paging fixes. PrimeReact and PrimeUI licensing remain unchanged and explicit.
2. The next major release changes the default foundation, removes Prime runtime and declaration references, and introduces the Cratis-owned styling and provider contracts.
3. A PrimeReact compatibility package may preserve the existing implementation for consumers that need a staged migration, subject to licensing confirmation.

The stabilization specs are the parity contract for the major release. The new implementation is not complete until it preserves the observable behavior those specs protect.

## Validation gates

The major release does not ship until:

- The default package contains no Prime runtime imports or Prime references in emitted declarations.
- npm, pnpm, and Yarn PnP packed-consumer fixtures pass.
- Supported Arc versions compile and load with the packed artifact.
- Representative consumers compile and exercise their critical screens.
- Keyboard, focus, browser accessibility, Storybook, SSR, responsive, dark-mode, forced-colors, and reduced-motion scenarios pass.
- Custom token systems and per-part styling work without internal DOM selectors.
- Bundle size and rendering performance are measured against the stabilization release.
- The migration guide has been followed successfully without repository-specific knowledge.

Track implementation and acceptance evidence in [the UI foundation issue](https://github.com/Cratis/Components/issues/170).
