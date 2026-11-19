---
id: '0007'
title: Stable atomic slots
description: A stable presentation adapter can implement selected atomic slots through an optional atomicSlots map, without changing the nine-slot profile or the renderer ABI.
status: accepted
stage: implemented
class: contract
reversibility: costly
decided: 2026-11-18
decider: L163
applies-to:
    - 'Source/renderer/**/*'
    - 'Adapters/**/*'
    - 'Conformance/**/*'
sidebar:
    badge: { text: Accepted, variant: tip }
---

**Status:** Accepted

**Provenance:** L163 made this decision on 2026-11-18 for [#530](https://github.com/Cratis/Components/issues/530), filed by woksin.

## Context

[ADR 0004](0004-stable-presentation-renderer-profile.md) made nine presentation slots stable and
kept the five atomic slots (`datatables.paginator`, `dialogs.dialog`, `dropdown.select`,
`display.datePicker`, `common.tooltip`) behind the `unstable_` generic manifest. An adapter that
must own one of those interactions, such as a design-system paginator, had no stable way to do so.

ADR 0004 also rules that adding a slot to `stable-presentation/v1` is not a compatible expansion.
The MUI, PrimeReact 11, and PrimeReact 10 adapters must keep resolving exactly as they do today.

## Decision

Stable atomic slots are a separate, optional extension of `CratisPresentationUiLibrary`:

- `cratisAtomicSlotIds` lists the atomic slots whose contracts are stable. The first release listed
  only `datatables.paginator`; `common.tooltip`, `dropdown.select`, and `display.datePicker` were appended next,
  then `dialogs.dialog` and `common.numberInput`. New ids are only ever appended.
- `CratisAtomicSlots` maps each id to its exact public props type, `CratisAtomicSlotDeclaration`
  requires `atomic` mode, `native` or `emulated` fidelity, and a component, and
  `CratisAtomicSlotMap` makes every entry optional. Amended by
  [ADR 0008](0008-adapter-owned-dialog-shell.md): the `dialogs.dialog` contract is the public
  `DialogProps` plus a Components-owned `host` prop, because the dialog shares its stack, result
  flow and overlay container with Components.
- `CratisPresentationUiLibrary.atomicSlots` is optional. `profileSlots` and `slots` keep meaning
  the nine presentation slots, so no existing manifest, validator, or adapter changes.
- `definePresentationUiLibrary()` validates and freezes `atomicSlots` when it is present and leaves
  the field out of the result when it is absent. It reads one snapshot of the map's own
  enumerable keys, rejects unknown ids and inherited declarations, and ignores non-enumerable ones.
- Resolution applies the same checks to libraries that claim the stable profile through the
  generic definer or a raw manifest. An invalid atomic declaration is not resolved, so the control
  keeps its built-in implementation, and library validation reports it as a diagnostic.
- Resolution merges the stable atomic declarations of a `stable-presentation/v1` library into the
  slot table that the renderer layer and manifest composition already build. A library without
  `atomicSlots`, or of any other profile, contributes nothing, so its table is unchanged. An
  omitted atomic slot keeps the built-in Components implementation.
- `@cratis/components.conformance` runs the existing slot profile for every declared stable atomic
  slot, and package metadata lists those slots and their `atomic` mode alongside the nine.

The profile identifier `stable-presentation/v1` and renderer ABI major `1` stay unchanged. No new
profile id is introduced, because no existing adapter acquires a requirement: the field is optional
and each atomic slot is independently optional.

## Semver policy

Removing an id from `cratisAtomicSlotIds`, changing its identifier, changing its public component
props or ref contract, changing its `atomic` behavior ownership, or weakening its required fidelity
is a breaking change.

Appending an id to `cratisAtomicSlotIds` is a compatible addition, because the map entry is
optional and an adapter that omits it keeps the built-in implementation.

## Consequences

An adapter that implements a stable atomic slot owns the whole interaction for that control:
keyboard, focus, and callbacks. Adapters that do not declare `atomicSlots` keep the built-in
paginator, dialog, dropdown, date picker, and tooltip. The `unstable_` generic manifest and its
atomic slots keep working as before; the stable names are new symbols alongside them.
