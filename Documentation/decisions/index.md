---
title: Components architecture decisions
description: Accepted decisions that define Components' public React, package, kernel, and renderer boundaries.
---

These accepted decisions explain why Components owns its public React and DOM contracts while
keeping implementation libraries, optional peers, and unstable renderer machinery behind explicit
boundaries.

## Decisions

- [DOM-coupled public component contract](0001-dom-coupled-contract.md) — React, native HTML, refs,
  events, and form semantics are intentional public contracts.
- [Public component classification](0002-component-classification.md) — distinguishes primitives,
  composites, and interop-only surfaces.
- [Repository-owned kernel boundary](0003-kernel-boundary.md) — keeps optional and renderer-specific
  dependency graphs out of the setup-only root.
- [Stable presentation renderer profile](0004-stable-presentation-renderer-profile.md) — promotes the
  exact nine-slot `stable-presentation/v1` adapter boundary while broader machinery remains unstable.

Read [UI foundation](../ui-foundation.md) for the current architecture and capability matrix.
