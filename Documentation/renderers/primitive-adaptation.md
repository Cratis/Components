---
title: Primitive adaptation profile
description: Cratis Components adapts nine presentation slots through renderer ABI 1 while preserving public props, parts, semantic values, and refs.
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
atomic interaction slots with a separate behavior boundary; a stable adapter can implement the
ones listed under [stable atomic slots](#stable-atomic-slots). It also does not include a composite
such as DataPage or CommandDialog.

### CommandForm fields that reach these slots

CommandForm fields render through the slots above, so a primitive adapter restyles them without
replacing the field. Without an adapter, the field renders the same markup, classes, `data-cratis-*`
markers, and accessibility attributes as before. Field-level validation, ids, accessible names, and
error text stay owned by the field; the slot only presents the control.

| CommandForm field  | Slot                | Notes                                                              |
| ------------------ | ------------------- | ------------------------------------------------------------------ |
| `InputTextField`   | `common.textInput`  | `text`, `email`, `password`, `search`, `tel`, and `url` types only          |
| `TextAreaField`    | `common.textArea`   | Default of five rows is passed to the slot                         |
| `CheckboxField`    | `common.checkbox`   | Boolean value                                                      |
| `ToggleSwitchField`| `common.switch`     | Boolean value                                                      |
| `RadioGroupField`  | `common.radio`      | One slot per option; the group container stays built in            |
| `RadioButtonField` | `common.radio`      | Selects its `buttonValue`                                          |

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

The concrete adapters declare the nine presentation slots. Only the MUI adapter also declares an
atomic slot, `common.tooltip`. Their conformance reports cover the declared controls, not the other
atomic slots or any composite workflow.

## Stable atomic slots

A stable presentation library can also take over selected atomic slots through its optional
`atomicSlots` map. `cratisAtomicSlotIds` lists the atomic slots whose contracts are stable;
`CratisAtomicSlots` maps each id to its exact public props type. Each entry is optional and uses
`atomic` mode, `native` or `emulated` fidelity, and a component. `definePresentationUiLibrary()`
rejects any other id, mode, or fidelity. The `profile`, `profileSlots`, and nine `slots` stay as
they are.

```tsx
import { definePresentationUiLibrary } from '@cratis/components/renderer';
import { DesignPaginator } from './DesignPaginator';
import { designLibraryBase } from './designLibraryBase';

export const designLibrary = definePresentationUiLibrary({
    ...designLibraryBase,
    atomicSlots: {
        'datatables.paginator': { mode: 'atomic', fidelity: 'native', render: DesignPaginator },
    },
});
```

An atomic implementation owns the whole interaction for its control: keyboard, focus, and
callbacks. An omitted atomic slot, or a library without `atomicSlots`, keeps the built-in
Components implementation. List each implemented atomic slot in the package `cratis.slots`
metadata with mode `atomic` in `cratis.modes`; `@cratis/components.conformance` runs the slot's
profile for it.

### `datatables.paginator`

| Contract | Value |
| --- | --- |
| Props | `TablePaginatorProps` |
| Ref | None; the paginator does not forward a ref |
| Parts | `TablePaginatorParts`: `root`, `range`, `info`, `pages`, `page`, `ellipsis`, `first`, `previous`, `next`, `last` |
| Paging | `page` is zero-based; `onPageChange` receives the zero-based target page |
| Fallback | The built-in `TablePaginator` implementation |
| Conformance | The `datatables.paginator` profile: parts, pass-through, server rendering, hydration, and one `onPageChange` call for **Next page** |

A design system whose pagination model is one-based converts at the adapter boundary.

### `common.tooltip`

| Contract | Value |
| --- | --- |
| Props | `TooltipProps`: non-interactive `content`, `position`, `disabled`, `className`, and exactly one focusable trigger child |
| Ref | None; the trigger child keeps its own ref |
| Parts | The trigger child keeps its `data-cratis-part` (default `trigger`); the popup is the `popup` part and carries `data-open` while open |
| Behavior | Hover and keyboard focus open the tooltip, blur and Escape close it; empty `content` or `disabled` renders the child unchanged; `content` is a React node, rendered as-is |
| Fallback | The built-in `Tooltip` implementation |
| Conformance | The `common.tooltip` profile: parts, state coverage, server rendering (a closed tooltip omits its popup), hydration, and the opened popup |

Mount the popup in the overlay container from `unstable_useOverlayEnvironment()` so it stays above
dialogs. Only MUI implements this slot today. Designsystemet's own tooltip is a `data-tooltip`
attribute that rewrites `aria-label` after mount, and PrimeReact's tooltip is bound to a target
selector and cannot own the trigger or popup parts, so those three adapters keep the built-in
tooltip.

### `dropdown.select`

| Contract | Value |
| --- | --- |
| Props | `DropdownProps<unknown>`, the public `Dropdown` props; `value` and `onChange` carry the selected value, or the array in `multiple` mode |
| Ref | None; the select does not forward a ref |
| Parts | `DropdownParts`: `root`, `trigger`, `value`, `clear`, `indicator`, `popover`, `listbox`, `option`, `filter`, `multiple`, plus the legacy `input` and `select` aliases |
| Behavior | One keyboard and focus owner: the trigger or the filter input opens the listbox, arrows and Enter select, Escape closes, and `onChange` is called once per user selection with `source: 'user'` and the native event |
| Fallback | The built-in `Dropdown` implementation |
| Conformance | The `dropdown.select` profile: parts, pass-through, state coverage, server rendering, hydration, and one `onChange` call for the **Viewer** option |

Render the popover in the overlay container from `unstable_useOverlayEnvironment()`. No concrete
adapter implements this slot yet: a faithful implementation has to reproduce every part above, the
filter and multiple-select paths, and the legacy aliases, which none of the Designsystemet, MUI, or
PrimeReact select controls provide without re-implementing the built-in `Dropdown`. All four
adapters keep the built-in select. The dialog and date picker atomic slots are not stable yet.

## Fallback

With the default `rendererFallback='core'`, a partial adapter uses the built-in implementation for
an undeclared slot. This is successful resolution, not a warning or error: selecting a nine-slot
presentation adapter does not promise implementations of Dialog, Dropdown, DatePicker, Tooltip,
or paginator slots. The zero-configuration built-in path is quiet as well.

Invalid profile promises remain errors. A missing or unsupported slot in `profileSlots` is rejected
in strict library mode, or reported once with `CRATIS-UI-1002` in degrade mode. Permitting Core
fallback does not disable that validation.

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

This strict boundary rejects built-in fallback with `CRATIS-UI-1003`; it does not make the adapter implement additional
slots. A screen that renders an undeclared atomic control fails instead of becoming vendor-native.

## Evidence boundary

Renderer ABI major 1 and `@cratis/components.conformance` provide machine-checked evidence for the
exact manifest and environment under test. Passing checks do not certify every browser, visual
state, assistive technology, vendor theme, security posture, or production application. Read the
adapter's packaged `CONFORMANCE.md` and peer metadata for its exact evidence.

## Continue

Read [custom composition](custom-composition.md) before adapting a workflow that exceeds these nine
slots, and keep the [unsupported claims](unsupported.md) visible in product decisions.

## Dialog footer buttons

The predefined footer buttons of `Dialog`, `ConfirmationDialog`, `CommandDialog` and
`StepperCommandDialog` (OK, Cancel, Yes, No) render through `common.button`. An adapter receives the
confirming button as `variant='solid'` and every dismissing button as `variant='outline'`, the
footer's `pt.confirm` / `pt.cancel` as `pt.root`, and `onClick`, `autoFocus` and the forwarded `ref`
that drive initial focus. While the dialog is busy the confirming button is **not** `disabled`: it
stays focusable and arrives with `aria-disabled` and `aria-busy`, and the busy spinner arrives as
`icon`; the dismissing buttons arrive `disabled`. `data-cratis-part="confirm|cancel"` and the
`cratis-dialog__button*` classes are written only by the core button used without an adapter.
A custom (ReactNode) footer does not use the slot. A conformance case for the footer is deferred.
