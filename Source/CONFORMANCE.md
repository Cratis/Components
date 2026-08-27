<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# Built-in renderer conformance evidence

The opt-in `@cratis/components/renderer/builtin` manifest is exercised by
`@cratis/components.conformance` against all fourteen renderer ABI v1 slots. The repository gate
requires every bounded check to pass with zero skips, validates the package's static `cratis`
metadata against the public adapter schema, and plants dropped-ref, omitted-part,
over-declared-capability, unjustified-skip, and duplicate-owner defects to prove exact failures.

This is automated repository evidence, not a universal accessibility or browser claim. axe, jsdom
forms/events, deterministic SSR/hydration, RTL, forced-colors, and reduced-motion inputs do not
replace manual assistive-technology review or the separate Storybook browser/axe gate. See the
conformance package's `CONFORMANCE.md` for the complete evidence boundary.
