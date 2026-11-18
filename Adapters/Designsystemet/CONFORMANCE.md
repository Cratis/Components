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

## Browser evidence

A separate CI job, `designsystemet-browser`, runs real Chromium against the nine-slot gallery
(`browser/SlotGallery.tsx`) rendered through the adapter with the real Designsystemet stylesheet
and theme:

- axe with the WCAG 2.2 AA profile (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) in the
  light and dark schemes at `sm`, `md` and `lg` sizes, with zero violations;
- visual baselines for the same six combinations, committed for Linux Chromium only and rendered in
  the pinned Playwright image (regenerate with `scripts/update-baselines.sh --update`);
- keyboard: tab order across enabled controls, disabled controls skipped, focus ring of at least
  2px, Enter and Space on buttons, Space on checkbox and switch, arrow keys on the radio group;
- forced colors: enabled controls stay distinguishable and a focused button keeps an opaque ring; and
- reduced motion: the spinner rotation slows down.

## Manual

Screen-reader behaviour (VoiceOver and NVDA) is a human pass tracked in
[ACCESSIBILITY-MANUAL-PASS.md](./ACCESSIBILITY-MANUAL-PASS.md). It has not been performed.

## Known upstream Designsystemet behaviour

These are observed in the browser checks. They are not adapter defects and are not hidden by the
tests.

- **Spinner stroke under reduced motion:** Designsystemet slows `ds-spinner-rotate-animation` but
  leaves `ds-spinner-stroke-animation` at its normal 2s. The test asserts the rotation only.
- **Focus ring on `.ds-field`:** for checkbox, radio and switch, the ring is drawn on the wrapping
  `.ds-field` through `:has(input:focus-visible)`, not on the input. The test measures the ring owner.
- **`forced-color-adjust: none` buttons:** Designsystemet buttons paint their own colors in forced
  colors mode. The test accepts a visible border or an opaque fill, and exempts the text-only
  tertiary variants (Ghost and Link).

## Not covered

This is automated jsdom, package and Chromium evidence. It is not universal browser, other-engine,
RTL or assistive-technology certification, and it does not cover CommandForm, CommandDialog or
DataPage surfaces yet.
