---
title: Primitive adaptation profile
description: Reference for the nine stable presentation slots, portable parts and states, fallback, and behavior ownership.
---

<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

The `stable-presentation/v1` profile is deliberately small. It lets an adapter render common
controls with vendor-native primitives while Components retains its public props, semantic values,
refs, parts, and composition contracts. Stable means this exact nine-slot adaptation boundary; it
never means that an adapter replaces the full Components catalog.

## The nine slots

| Slot ID             | Components contract | Stable presentation responsibility       |
| ------------------- | ------------------- | ---------------------------------------- |
| `common.button`     | `ButtonProps`       | Native button semantics and presentation |
| `common.iconButton` | `IconButtonProps`   | Accessible icon-only button              |
| `common.textInput`  | `TextInputProps`    | Text-like native input                   |
| `common.textArea`   | `TextAreaProps`     | Multiline native input                   |
| `common.checkbox`   | `CheckboxProps`     | Boolean checkbox                         |
| `common.radio`      | `RadioProps`        | One radio option                         |
| `common.switch`     | `SwitchProps`       | Boolean switch                           |
| `common.progress`   | `ProgressBarProps`  | Determinate or indeterminate progress    |
| `common.surface`    | `SurfaceProps`      | Non-interactive semantic container       |

This profile does not include tooltip, dropdown, dialog, date picker, or table paginator. Those are
atomic interaction slots with a separate behavior boundary. It also does not include a composite
such as DataPage or CommandDialog.

## Stable adapter API

Adapter packages import the bounded contract from `@cratis/components/renderer`:

```ts
import {
    CRATIS_PRESENTATION_ABI_VERSION,
    CRATIS_PRESENTATION_PROFILE,
    cratisPresentationSlotIds,
    definePresentationUiLibrary,
    type CratisPresentationUiLibrary,
} from '@cratis/components/renderer';
```

The stable renderer exports are deliberately bounded:

| Export | Use |
| --- | --- |
| `CRATIS_PRESENTATION_PROFILE` | Exact profile id: `stable-presentation/v1`. |
| `CRATIS_PRESENTATION_ABI_VERSION` | Renderer ABI major required by the profile. |
| `cratisPresentationSlotIds` / `CratisPresentationSlotId` | Canonical immutable slot order and its identifier type. |
| `CratisPresentationSlots` | Mapping from each slot id to the exact public Components props/ref contract. |
| `CratisPresentationSlotDeclaration` / `CratisPresentationSlotMap` | One presentation-owned implementation and the complete nine-slot table. |
| `CratisPresentationCapabilityId` / `CratisPresentationCapabilities` | Bounded capability vocabulary and required tuple shape. |
| `CratisPresentationUiLibrary` | Immutable stable manifest shape. |
| `definePresentationUiLibrary()` | Runtime validation plus a defensive frozen copy for JavaScript and TypeScript callers. |
| `CratisRendererSetupExtensions` / `CratisRendererSetup` | Declaration-merged, non-secret boolean setup attestations. |
| `CratisPresentationUiLibraryProviderProps` | `setup` and `children` passed to an adapter provider. |
| `CratisOverlayEnvironment` | Independent, on-demand portal-container lookup supplied by the host. |

Symbols on `@cratis/components/renderer` whose names start with `unstable_` are not promoted by this
profile. Do not use the generic manifest, composition, renderer scopes/islands, atomic slots,
internal hooks, lazy loading, or discovery tooling as a stable dependency.

`CratisPresentationSlotMap` requires all nine exact component contracts. Every declaration must use
`mode: 'presentation'` and either `fidelity: 'native'` or `fidelity: 'emulated'`. A stable manifest
must declare `slot.render`, `parts.passthrough`, and `ssr.staticRender`; RTL, forced-colors, and
reduced-motion capabilities remain optional evidence. `definePresentationUiLibrary()` checks the
same requirements for JavaScript callers, rejects duplicate capabilities, and returns a defensive
frozen copy. Use `CratisRendererSetupExtensions` only for non-secret boolean setup
attestations and `CratisOverlayEnvironment` for an independent host portal-container lookup.

The six stable capability ids have narrow meanings:

| Capability | Requirement | Meaning |
| --- | --- | --- |
| `slot.render` | required | Every declared slot supplies a render component for its exact contract. |
| `parts.passthrough` | required | Documented typed parts and `pt` destinations remain available. |
| `ssr.staticRender` | required | Every slot produces deterministic static server markup without browser globals. |
| `rtl` | optional evidence | The adapter has bounded evidence for right-to-left input. |
| `forcedColors` | optional evidence | The adapter has bounded evidence under forced-color host input. |
| `motion.reduced` | optional evidence | The adapter has bounded evidence under reduced-motion host input. |

Optional evidence flags remain bounded claims; they are not universal browser or accessibility
certification.

Removing or changing a v1 slot is a breaking change. Adding a required slot needs a new profile and
version; `stable-presentation/v1` will not silently grow. The open fourteen-slot manifest,
composition, atomic behavior, renderer scopes, internal hooks, diagnostics, and built-in full
manifest remain `unstable_` APIs.

## Stable parts

Eight profile controls expose a typed `*Parts` object and `pt` prop that sends ordinary React HTML
attributes to documented destinations. `ProgressBar` instead exposes its documented `root`,
`indicator`, and `label` through stable `data-cratis-part` markers and a root `className`; it has no
`pt` prop. Conforming adapters preserve each slot's exact public customization contract rather than
inventing a uniform prop that the component does not declare.

```tsx
import { Button } from '@cratis/components/Common';

export const SaveAction = () => (
    <Button
        label='Save'
        pt={{
            root: { className: 'account-save' },
            label: { className: 'account-save-label' },
        }}
    />
);
```

The adapter may add wrappers or arrange documented parts differently. Descendant order, sibling
position, and vendor-generated classes are not portable. Target the named part itself rather than
an undocumented path through the vendor DOM.

## Stable states

Components contracts expose state through public props, native attributes and pseudo-classes, and
documented `data-*` attributes. Examples include disabled, invalid, checked, loading, and Button
appearance values. The exact state set belongs to each component contract; an adapter must not
invent a vendor event or class as the only observable state.

Use typed props and stable part/state selectors. Do not depend on a vendor's generated class names,
private data attributes, or internal state objects when the code must work across adapters.

## Semantic values, refs, and events

Adaptation does not weaken the public type. A text input still emits the next string through the
Components `ChangeHandler<string>` shape. Ref-capable controls still identify the documented native
element. Button type, form participation, disabled/read-only behavior, names, values, and validation
remain part of the bounded profile.

A vendor-native wrapper is conforming only when it accepts the exact Components props and preserves
those semantics. A type cast that hides an incompatible vendor callback is not an adapter.

## One behavior owner

Every slot declaration chooses one ownership mode:

- `presentation` preserves the Components behavior contract while the adapter supplies the
  presentation implementation;
- `atomic` gives one adapter implementation the complete interaction.

Do not render a second interactive semantic root inside the first, forward one user action to two
independent state machines, or stack a vendor focus owner around a built-in focus owner. One user
interaction must produce one semantic value change and have one keyboard/focus owner.

All three concrete adapters currently declare only the nine presentation slots. Their conformance
reports cover those declared controls, not the five atomic slots or any composite workflow.

## Fallback

With the default `rendererFallback='core'`, a partial adapter uses the built-in implementation for
an undeclared slot. The zero-configuration built-in path is the default, not an adapter warning.
When an active adapter falls back, Components reports the bounded fallback diagnostic after mount.

Set `rendererFallback='throw'` when a host must reject every undeclared slot:

```tsx
import { CratisComponentsProvider } from '@cratis/components';
import { muiUiLibrary } from '@cratis/components.mui';
import type { PropsWithChildren } from 'react';

export const StrictRendererBoundary = ({ children }: PropsWithChildren) => (
    <CratisComponentsProvider library={muiUiLibrary} rendererFallback='throw'>
        {children}
    </CratisComponentsProvider>
);
```

This strict boundary rejects built-in fallback; it does not make the adapter implement additional
slots. A screen that renders an undeclared atomic control fails instead of becoming vendor-native.

## Evidence boundary

Renderer ABI major 1 and `@cratis/components.conformance` provide machine-checked evidence for the
exact manifest and environment under test. Passing checks do not certify every browser, visual
state, assistive technology, vendor theme, security posture, or production application. Read the
adapter's packaged `CONFORMANCE.md` and peer metadata for its exact evidence.

## Continue

Read [custom composition](custom-composition.md) before adapting a workflow that exceeds these nine
slots, and keep the [unsupported claims](unsupported.md) visible in product decisions.
