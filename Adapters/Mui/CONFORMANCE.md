<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# MUI adapter conformance

The adapter declares `stable-presentation/v1` at renderer ABI major 1. Repository evidence runs
`@cratis/components.conformance` against the nine declared slots and the atomic `common.tooltip`, `common.numberInput`, `datatables.paginator` and `dialogs.dialog` slots, and requires every applicable check
to pass with zero failures and zero skips. The generated report is the authoritative check inventory.

The bounded checks cover:

- schema-valid package metadata and exact static/runtime consistency;
- every stable part, canonical state, and typed `pt` destination;
- exact native elements and native refs;
- native names, values, submit/reset, disabled/read-only, validation, and autofill-shaped props;
- one value-first `ChangeHandler` callback with `source: 'user'` and the originating native `Event`;
- current and deprecated Button appearance mapping and canonical data attributes;
- real MUI DOM identities for all nine slots and the MUI tooltip popup for `common.tooltip`;
- deterministic SSR and mismatch-free hydration; and
- package peers, archive boundaries, runtime loading, declaration hygiene, and strict Bundler and
  NodeNext consumers with `skipLibCheck: false`.

The generic overlay absent/present check covers the tooltip only: the closed tooltip omits its
popup. The tooltip's host binding (stacking above its dialog, closing immediately when the dialog
closes or the overlay environment changes) is covered by the adapter's own specs, not by the
conformance profile. The dropdown and date picker atomic slots are not implemented and use the built-in
implementations: MUI `Select` and `Autocomplete` cannot produce the stable `trigger`, `clear`, `popover`,
`listbox` and `option` parts of `dropdown.select`, and MUI has no date picker without MUI X. Portable part names and typed `pt`
destinations are preserved, while MUI may add wrappers or nest parts differently from the built-in
renderer; undocumented descendant order and sibling selectors are not portable contracts.

This is automated jsdom/axe and package evidence, not universal browser, visual, RTL, forced-colors,
reduced-motion, or assistive-technology certification. MUI RTL requires host theme direction and an
RTL-configured Emotion cache, which this adapter's provider ABI cannot create per request. MUI's
CSS-in-JS output likewise requires host-specific, request-local Emotion cache and style extraction
during SSR. No MUI X package is included or exercised.
