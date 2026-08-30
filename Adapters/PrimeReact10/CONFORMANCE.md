<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# PrimeReact 10 adapter conformance

The adapter declares `stable-presentation/v1` at renderer ABI major 1. The repository gate runs
`@cratis/components.conformance` against all nine declared slots and requires every applicable check
to pass with zero failures and zero skips. The generated report is the authoritative check inventory.

The bounded checks cover:

- schema-valid package metadata and exact static/runtime consistency;
- every stable part, canonical state, and typed `pt` destination;
- exact native elements and native refs;
- native names, values, submit/reset, disabled/read-only, validation, and autofill-shaped props;
- one value-first `ChangeHandler` callback with `source: 'user'` and the originating native `Event`;
- current and deprecated Button appearance mapping and canonical data attributes;
- real PrimeReact 10.9.9 styled DOM identities for all nine slots;
- checked and unchecked indicator ownership, explicit switch semantics, indeterminate progress ARIA,
  and a visible vendor loading indicator;
- deterministic SSR for all nine slots and mismatch-free representative Button hydration; and
- package peers, archive boundaries, runtime loading, declaration hygiene, major isolation, and
  strict Bundler and NodeNext consumers with bounded upstream exceptions.

PrimeReact 10 is MIT licensed and has no key or setup attestation. The adapter preserves an outer
application-owned `PrimeReactProvider` when present and creates a default provider only when no
outer context exists.

The generic overlay absent/present check has no applicable slot in this nine-slot profile and
supplies no PrimeReact overlay evidence. Portable part names and typed `pt` destinations are
preserved, while PrimeReact may add wrappers or nest parts differently from the built-in renderer;
undocumented descendant order and sibling selectors are not portable contracts.

PrimeReact 10.9.9 still publishes an aggregate API declaration that imports unrelated components
whose `onToggle` declarations conflict with React 19, and other declarations still name global JSX.
Tracked compile-only shims constrain those exact upstream defects without suppressing library
checking. The packed adapter declaration is vendor-free; package verification ensures that no shim
or vendor declaration is emitted. Remove or narrow a shim when the pinned upstream behavior changes.

PrimeReact 10 predates modern package export maps. The adapter uses explicit legacy CommonJS entry
points so its packed ESM entry can load under native Node as well as application bundlers without
bundling PrimeReact. PrimeReact 10 and 11 are installed and verified as distinct incompatible
workspace resolutions.

This is automated jsdom/axe, SSR, and package evidence, not universal browser, visual, RTL,
forced-colors, reduced-motion, or assistive-technology certification. The application remains
responsible for its selected global PrimeReact 10 theme, optional provider configuration, CSP, and
host-specific style loading.
