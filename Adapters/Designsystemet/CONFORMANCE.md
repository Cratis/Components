<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# Designsystemet adapter conformance

The adapter declares `stable-presentation/v1` at renderer ABI major 1. Repository evidence runs
`@cratis/components.conformance` against all nine declared slots and requires every applicable check
to pass with zero failures and zero skips. The generated report is the authoritative check inventory.

The bounded checks cover:

- schema-valid package metadata and exact static/runtime consistency;
- every stable part, canonical state, and typed `pt` destination;
- exact native elements and native refs;
- native names, values, submit/reset, disabled/read-only, validation, and autofill-shaped props;
- one value-first `ChangeHandler` callback with `source: 'user'` and the originating native `Event`;
- current and deprecated Button appearance mapping, and that no Cratis `data-size` or `data-variant`
  value reaches a Designsystemet element;
- real Designsystemet DOM identities for all nine slots;
- deterministic SSR and mismatch-free hydration; and
- package peers, archive boundaries, runtime loading, and declaration hygiene.

The generic overlay absent/present check has no applicable slot in this nine-slot profile. The
checkbox, radio and switch `box`, `indicator`, `control` and `handle` parts are hidden structural
hooks because Designsystemet paints those controls on the native input. Undocumented descendant
order and sibling selectors are not portable contracts.

This is automated jsdom and package evidence, not universal browser, visual, RTL, forced-colors,
reduced-motion, or assistive-technology certification.
