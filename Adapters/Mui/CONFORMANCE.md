<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# MUI adapter conformance

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
- real MUI DOM identities for all nine slots;
- deterministic SSR and mismatch-free hydration; and
- package peers, archive boundaries, runtime loading, declaration hygiene, and strict Bundler and
  NodeNext consumers with `skipLibCheck: false`.

This is automated jsdom/axe and package evidence, not universal browser, visual, or assistive-
technology certification. MUI's CSS-in-JS output also requires host-specific, request-local Emotion
cache and style extraction during SSR. No MUI X package is included or exercised.
