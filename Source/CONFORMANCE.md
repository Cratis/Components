<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# Built-in renderer conformance evidence

The opt-in `@cratis/components/renderer/builtin` manifest is exercised by
`@cratis/components.conformance` against all fourteen renderer ABI v1 slots. The repository gate
requires every bounded check to pass with zero skips, validates the package's static `cratis`
metadata against the public adapter schema, and plants dropped-ref, omitted-part,
over-declared-capability, unjustified-skip, and duplicate-semantic-root defects with exact failure
sets.

This is automated repository evidence, not a universal accessibility or browser claim. axe, jsdom
forms/events, deterministic SSR/hydration, and bounded environmental DOM hosts do not replace
manual assistive-technology review or the separate Storybook browser/axe gate. Semantic-root
counts do not instrument vendor focus traps, dismissal listeners, or scroll locks, and slot-local
SSR output does not prove cross-process request isolation. See the conformance package's
`CONFORMANCE.md` for the complete evidence boundary.
