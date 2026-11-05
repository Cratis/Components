---
title: Upgrade Cratis Components
description: Choose a Cratis Components upgrade path, separate dependency and styling changes, and keep a tested rollback point at each migration step.
---

Upgrade Cratis Components by choosing the guide for your installed major version and intended target. Components 4 removes the PrimeReact-backed public APIs; a 2.x application can move directly to 4 without adopting Components 3 or PrimeReact 11 first.

| Your upgrade | Start with |
| --- | --- |
| Components 3.x → 4.x | [3.x → 4.0](3-to-4.md): subpath imports, provider configuration, styling parts, and migration tooling |
| Components 2.x → 4.x | [Migrate directly from Components 2](3-to-4.md#migrate-directly-from-components-2): keep direct PrimeReact 10 controls while replacing Components |
| Components 2.x → 3.x | [2.x → 3.0](2-to-3.md): the historical PrimeReact 11 dependency, styling, and licensing boundary |

Before changing packages, preserve a working copy of the application's source, package manifest, and lockfile together. Run its existing checks to establish a baseline. Each guide identifies where to stop and verify the next change; return to the preceding checkpoint if you cannot resolve a failure before continuing.

Treat direct PrimeReact imports separately from Components usage. An application can retain those controls during the Components 4 migration, but it still owns their dependencies, CSS, provider configuration, and license requirements. Do not remove them just because Components no longer needs them.

If Components 3 is your intended target, read PrimeReact's [Updating to v11](https://primereact.dev/docs/primitive/guides/migration/updating-to-v11) guide alongside [2.x → 3.0](2-to-3.md). For Components 4, follow the [recommended migration order](3-to-4.md#recommended-order-stop-points-and-rollback) before running a codemod, the tool that rewrites supported source patterns.
