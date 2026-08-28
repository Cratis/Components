<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# PrimeReact 11 adapter conformance

The adapter declares `stable-presentation/v1` at renderer ABI major 1. Repository evidence runs
`@cratis/components.conformance` against all nine declared slots and requires 100 of 100 checks to
pass with zero failures and zero skips.

The bounded checks cover:

- schema-valid package metadata and exact static/runtime consistency;
- every stable part, canonical state, and typed `pt` destination;
- exact native elements and native refs;
- native names, values, submit/reset, disabled/read-only, validation, and autofill-shaped props;
- one value-first `ChangeHandler` callback with `source: 'user'` and the originating native `Event`;
- current and deprecated Button appearance mapping and canonical data attributes;
- real PrimeReact 11 styled DOM identities for all nine slots;
- explicit switch semantics and hidden visual indicators;
- deterministic SSR and mismatch-free hydration under an application-owned outer provider; and
- package peers, archive boundaries, runtime loading, declaration hygiene, and strict Bundler and
  NodeNext consumers with bounded upstream exceptions.

The setup gate separately proves `CRATIS-UI-1005` when the outer `PrimeReactProvider` context or
the non-secret license attestation is missing. Automated component tests assemble PrimeReact's
public configuration/theme contexts directly so the real license manager never runs; they contain
and validate no key.

The generic overlay absent/present check has no applicable slot in this nine-slot profile and
supplies no PrimeReact overlay evidence. Portable part names and typed `pt` destinations are
preserved, while PrimeReact may add wrappers or nest parts differently from the built-in renderer;
undocumented descendant order and sibling selectors are not portable contracts.

PrimeReact 11.1.0 currently publishes malformed generic declaration aliases. A compile-only,
non-emitted shim keeps this adapter's own strict build enabled; the packed adapter declaration is
vendor-free and the package verifier ensures no shim or vendor declaration leaks into it. Remove the
shim when an allowed PrimeReact 11 release fixes those declarations.

This is automated jsdom/axe and package evidence, not universal browser, visual, RTL, forced-colors,
reduced-motion, license-validity, or assistive-technology certification. The application remains
responsible for a valid PrimeUI license, provider/theme configuration, CSP, and any host-specific
SSR style collection. PrimeReact 10 is not included or exercised.
