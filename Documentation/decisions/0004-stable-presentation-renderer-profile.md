---
title: Stable presentation renderer profile
description: The bounded nine-slot renderer contract promoted after independent conformance proof.
sidebar:
    order: 4
    badge: { text: Accepted, variant: tip }
---

**Status:** Accepted

## Context

Components V4 needs an honest extension point for adapting common primitives without implying that a
vendor renderer replaces the full Components catalog. The experimental renderer system proved a
larger fourteen-slot model, but five of those slots own interactions rather than presentation and
have not earned the same compatibility promise.

The `stable-presentation/v1` candidate was tested independently by four implementations: the
private plain-DOM falsification fixture, MUI, PrimeReact 11, and PrimeReact 10. Each implementation
passed every applicable conformance check with zero failures and zero skips. The generated report,
rather than a hardcoded count in this decision, inventories the exercised checks. The proof covers the
exact public props, refs, parts, state, behavior ownership, server rendering, hydration, and bounded
accessibility assertions recorded by the conformance package. It does not turn the remaining
experimental renderer system into a stable API.

## Decision

Renderer ABI major 1 promotes one immutable profile through
`@cratis/components/renderer`:

- `common.button`
- `common.iconButton`
- `common.textInput`
- `common.textArea`
- `common.checkbox`
- `common.radio`
- `common.switch`
- `common.progress`
- `common.surface`

The stable API is identified by `CRATIS_PRESENTATION_PROFILE`,
`CRATIS_PRESENTATION_ABI_VERSION`, and `cratisPresentationSlotIds`. Its
`CratisPresentationUiLibrary` declaration requires all nine slots, `presentation` behavior
ownership, `native` or `emulated` fidelity, and the `slot.render`, `parts.passthrough`, and
`ssr.staticRender` capabilities. `definePresentationUiLibrary()` validates the same boundary for
JavaScript callers, rejects duplicate capabilities, and defensively copies/freezes the manifest
through the shared manifest machinery.

The profile also stabilizes the non-secret boolean setup contract used by certified providers:
`CratisRendererSetupExtensions`, `CratisRendererSetup`, and
`CratisPresentationUiLibraryProviderProps`. Adapter declaration merging may add boolean
attestations only. Credentials, license keys, caches, provider instances, and mutable configuration
objects remain impossible at this boundary.

`CratisOverlayEnvironment` is a separate stable V4 host contract. It resolves a portal container on
demand and may return `null` when no container is available. Internal overlay hooks remain
experimental.

The MUI, PrimeReact 11, and PrimeReact 10 package manifests are stable
`CratisPresentationUiLibrary` values. Selecting one certifies nine-slot primitive adaptation only.
It never promises full-catalog replacement.

## Semver policy

Removing a `stable-presentation/v1` slot, changing its identifier, changing its public component
props or ref contract, changing presentation behavior ownership, or weakening its required fidelity
is a breaking change.

Adding a slot is not a compatible expansion of `stable-presentation/v1`. Additions require a new
named profile and version so existing adapters never acquire an unimplemented requirement. The conformance package and the three certified adapters share the Components repository release
version. Renderer ABI major `1` remains separate from npm versioning, and every adapter retains the
honest `@cratis/components >=4 <5` peer range.

## Intentionally unstable

The following surfaces keep their `unstable_` prefix and carry no promise from this decision:

- the open fourteen-slot table and generic `UiLibrary` manifest;
- atomic slots and `BehaviorMode`;
- capabilities outside the bounded presentation subset;
- adapter diagnostics and errors;
- manifest composition;
- `RendererScope`, islands, and `only` routing;
- `useCapability`, `useRendererId`, and internal overlay hooks;
- the built-in full manifest;
- lazy loading, preload behavior, and adapter discovery tooling.

The unused `unstable_RendererExtensions` and `unstable_RendererProps` declarations are removed.
No component or adapter consumed them, so retaining them would advertise renderer-specific prop
bags that did not exist. Portable customization remains the typed `pt` contract.

## Consequences

Applications keep zero-configuration built-in behavior. The package root remains setup-only, the
React/browser-DOM-free kernel boundary remains unchanged, and Core gains no PrimeReact dependency.
Adapter authors can depend on a small stable façade while experimental work continues behind
explicit `unstable_` names.

Conformance evidence is bounded evidence, not a universal claim about every browser, theme,
assistive technology, security posture, or application shell. Adapter packages continue to publish
their exact peer, license, and conformance metadata.
