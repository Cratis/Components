---
title: Components architecture decisions
description: Accepted decisions that define Components' public React, package, kernel, and renderer boundaries.
---

These accepted decisions explain why Components owns its public React and DOM contracts while
keeping implementation libraries, optional peers, and unstable renderer machinery behind explicit
boundaries.

## Decisions

| ID and decision | Status | Stage | Decided | Decider |
| --- | --- | --- | --- | --- |
| [0001 — DOM-coupled public component contract](0001-dom-coupled-contract.md) | Accepted | Implemented | 2026-08-27 | woksin |
| [0002 — Public component classification](0002-component-classification.md) | Accepted | Implemented | 2026-08-27 | woksin |
| [0003 — Repository-owned kernel boundary](0003-kernel-boundary.md) | Accepted | Implemented | 2026-08-27 | woksin |
| [0004 — Stable presentation renderer profile](0004-stable-presentation-renderer-profile.md) | Accepted | Implemented | 2026-08-28 | woksin |
| [0005 — Generic primitive admission](0005-generic-primitive-admission.md) | Accepted | None | 2026-09-29 | woksin (delegated) |

Read [UI foundation](../ui-foundation.md) for the current architecture and capability matrix.
