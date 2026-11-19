<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# Designsystemet adapter conformance

The adapter declares `stable-presentation/v1` at renderer ABI major 1. Repository evidence runs
`@cratis/components.conformance` against all nine declared slots and the `dialogs.dialog`, `common.numberInput`, `datatables.paginator` and `common.tooltip` atomic slots,
and requires every applicable check to pass with zero failures and zero skips. The generated report is the authoritative check inventory.

The bounded checks cover:

- schema-valid package metadata and exact static/runtime consistency;
- every stable part, canonical state, and typed `pt` destination;
- exact native elements and native refs;
- native names, values, submit/reset, disabled/read-only, validation, and autofill-shaped props;
- one value-first `ChangeHandler` callback with `source: 'user'` and the originating native `Event`;
- current and deprecated Button appearance mapping, and that no Cratis `data-size` or `data-variant`
  value reaches a Designsystemet element;
- real Designsystemet DOM identities for all nine slots;
- the dialog as a native `<dialog>` root whose `backdrop` and `positioner` belong to the browser top
  layer, with the close button and Escape closing through Components and an overlay container inside the
  dialog for descendant popovers;
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

The same job also runs the existing Source stories for the CommandForm (`AutoCommandForm`), the
CommandDialog and stepper dialog, and the DataPage (single page and paged) through the adapter, with
the token bridge (`@cratis/components/themes/designsystemet`) applied:

- axe (WCAG 2.2 AA) per surface in light and dark at `sm`, `md` and `lg`, with the open findings
  below asserted exactly so a fix or regression turns the test red;
- keyboard: the dialog moves focus in on open, tabs in order (the disabled Save is skipped), keeps
  focus trapped forwards and backwards, shows a focus ring of at least 2px, and closes on Escape or
  Close with focus returning to the opener; the stepper dialog keeps focus trapped; the DataPage tab
  order runs toolbar, search, column sort buttons, rows, paginator; the paginator is a labelled
  navigation whose first and previous buttons are disabled on page one and which pages with Enter and
  Space;
- forced colors: the dialog keeps a visible edge and its buttons an opaque ring; DataPage controls
  stay distinguishable; and
- visual baselines (Linux) for the open CommandDialog and the paged DataPage in light and dark. The
  CommandForm story renders today's date, so it has no baseline.

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

## Open findings from the surface checks

These are in Cratis components or the token bridge rather than the Designsystemet adapter. The tests
assert them exactly; fix the source, then delete the expectation.

- **Paginator current page:** the paginator has no page-number buttons by default, so there is no
  `aria-current="page"`; the current page is the "1 / 2" text and the range. With `pageLinks` the current
  page carries `aria-current="page"`.
- **Dialog initial focus:** focus moves to the dialog container (`tabindex="-1"`), not the first field.
  This is accepted by the dialog pattern; it is recorded for the screen-reader pass.

## Not covered

This is automated jsdom, package and Chromium evidence. It is not universal browser, other-engine,
RTL or assistive-technology certification, and it covers only the stories named above, not every CommandForm field type or DataPage
configuration.
