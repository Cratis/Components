<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# Conformance evidence boundary

`runConformance()` returns evidence for the exact library manifest, package metadata, DOM
implementation, dependency versions, and execution environment supplied to that call. A passing
report does **not** claim universal accessibility, browser, visual, assistive-technology, framework,
or production conformance.

The automated families are:

- package metadata schema constraints, runtime consistency, and capability over-declaration;
- all fourteen ABI v1 slot declarations, stable parts/states, pt markers, and exact native roots;
- bounded native form/callback behavior and presentation/atomic ownership;
- internal React-boundary normalization fixtures (props, styles, refs, events, cleanup, StrictMode);
- DOM-free deterministic server rendering, hydration, manifest isolation, and overlay absence/presence;
- axe WCAG A/AA scans plus executable RTL, forced-colors, and reduced-motion inputs;
- packed declaration purity and strict Bundler/NodeNext consumer compilation.

A requested skip is accepted only when the relevant declaration is `unsupported`/`emulated`, or the
request names a capability the library does not claim. An unjustified skip is a failure.

## Explicit limitations

- axe is automated DOM analysis and cannot replace manual keyboard, screen-reader, magnification,
  voice-control, or other assistive-technology review.
- jsdom does not establish behavior across browser engines, devices, touch/pointer combinations, or
  operating-system accessibility modes.
- forced-color and reduced-motion fixtures prove code-path execution, not visual contrast or the
  absence of all motion. Repository Storybook light/dark axe runs remain a separate gate.
- renderer-vendor focus, collection, and overlay behavior outside the fourteen public slots is not
  exercised.
- adapter package licensing, security, performance, and upstream support policy remain the adapter
  author's responsibility.
