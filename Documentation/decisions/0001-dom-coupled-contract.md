---
title: DOM-coupled public component contract
description: Why Components intentionally exposes React, HTML, native form, ref, and DOM event semantics while keeping renderer vendors private.
sidebar:
    order: 1
    badge: { text: Accepted, variant: tip }
---

**Status:** Accepted

## Context

A component library can hide its implementation vendor without pretending that every rendering target has the same contract. Components renders React trees for browser applications. Consumers rely on standard HTML attributes, semantic native elements, form submission and validation behavior, focus, DOM events, native element refs, and stable `data-cratis-part` hooks.

Describing that surface as “renderer-independent” created an ambiguity. It could be read as either of these claims:

- Consumers do not depend on the types, implementation DOM, or styling hooks of React Aria or another internal renderer vendor.
- Consumers can use the same component contract without React or the browser DOM.

Only the first claim is intended. The second would require replacing useful browser guarantees with reduced facades and would make ordinary React composition less precise.

## Decision

The public component contract is deliberately **DOM-and-React-coupled**.

Components may expose:

- React nodes, component props, refs, and event handlers.
- Standard HTML attribute types such as `HTMLAttributes` and element-specific button, input, dialog, and form attributes.
- Native element refs such as `HTMLButtonElement`, `HTMLInputElement`, and `HTMLDivElement` where the concrete element is part of the guarantee.
- Native form participation, validation, focus, keyboard, and submission semantics.
- Components-owned semantic markup, typed `pt` parts, `className`, `style`, and stable `data-cratis-part` attributes.

“Renderer-independent” means that an internal renderer vendor remains private. React Aria or a future replacement must not leak its component types, vendor-specific styling contract, undocumented implementation DOM, or release cadence into the public API. Components owns the public DOM and React contract even when it delegates interaction behavior internally.

The supported target is a React application rendered to a browser DOM. The following targets are explicitly outside this contract:

- React Native and other non-DOM React renderers, because they do not provide HTML elements, browser form behavior, or DOM refs.
- Terminal and text user interfaces, because their layout, focus, and input models are not HTML semantics.
- Native desktop UI toolkits, because their controls and event systems are not browser elements or DOM events.
- Server-only template/view engines and non-React Web Component consumers, because they cannot consume React component, ref, and hook contracts directly.
- Canvas-only, WebGL-only, or Pixi-only renderers as replacements for the component surface. Spatial components may use Pixi internally or alongside a DOM layer, but that does not turn the package into a non-DOM UI contract.

## Consequences

Consumers can use native platform capabilities without adapters or weakened wrapper types. Forms participate in browser behavior, refs identify the real element, event handlers receive normal React DOM events, and `pt` attributes reach documented semantic parts.

Components can replace React Aria or another internal implementation without migrating consumers, provided the Components-owned public markup, behavior, types, and stable parts remain compatible.

A breaking change to an exposed native element, ref target, form behavior, event shape, or documented part is a public API change even when no prop name changes.

The package does not promise portability to excluded non-DOM targets. A future package for one of those targets would need its own target-native contract rather than a lowest-common-denominator abstraction over this one.
