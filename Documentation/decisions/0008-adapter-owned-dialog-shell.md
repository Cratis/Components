---
id: '0008'
title: Adapter-owned dialog shell
description: The stable dialogs.dialog atomic slot lets an adapter own the modal shell while Components keeps the dialog stack, result flow, actions and the descendants' overlay container, passed through a host prop.
status: accepted
stage: implemented
class: contract
reversibility: costly
decided: 2026-11-19
decider: L163
applies-to:
    - 'Source/Dialogs/**/*'
    - 'Source/renderer/**/*'
    - 'Adapters/**/*'
    - 'Conformance/**/*'
sidebar:
    badge: { text: Accepted, variant: tip }
---

**Status:** Accepted

**Provenance:** L163 made this decision on 2026-11-19 for [#530](https://github.com/Cratis/Components/issues/530), filed by woksin.

## Context

[ADR 0007](0007-stable-atomic-slots.md) lets a stable presentation adapter implement selected
atomic slots, each typed by its public component props. A dialog is different from the other
atomic slots. The built-in `Dialog` does more than draw a modal: it registers a tier in the dialog
stack, turns the tier into a z-index, publishes that z-index and an overlay container to its
descendants, maps the close button, Escape and outside press to a `DialogResult`, renders the typed
footer and app-wide header actions, and moves initial focus. Dropdowns, date pickers, tooltips and
pickers inside a dialog read the stack and the overlay container to stay above it.

An adapter that replaces the dialog with only the public `DialogProps` loses all of that. No tier
is registered, so nested popovers fall behind the dialog. A native modal `<dialog>` opened with
`showModal()` moves into the browser top layer and makes the rest of the page inert, so popovers
portaled to `document.body` become invisible and unclickable.

## Decision

`dialogs.dialog` is appended to `cratisAtomicSlotIds`. Its contract is `CratisDialogSlotProps`: the
public `DialogProps` plus a `host` prop of type `CratisDialogHost`.

The work is split between Components and the adapter:

| Owner | Responsibility |
| --- | --- |
| Components | The dialog stack tier and z-index, the `DialogResult` flow, the typed footer and its buttons, the header actions, busy and validity state, the announcement live region, initial focus, and the overlay environment that descendants portal into |
| Adapter | The modal shell: the focus trap, Escape, outside press, scroll lock and focus restoration, plus the header, title, subtitle and close button it renders from the props and the host |

The host carries what the adapter needs from Components:

- `id`, `zIndex`, `subtitleId`, `hasSubtitle` and `titleRef` (initial focus may land on the title);
- `dismissal`: whether outside press, Escape and the close button may dismiss the dialog;
- `closeAriaLabel` and `closeIcon` for the close button;
- `content`, `headerActions`, `footer` and `liveRegion`, rendered by Components with their Cratis
  parts and the consumer's `pt` attributes;
- `dismiss(source)`, which an adapter calls for every user dismissal, naming the gesture
  (`escape`, `outside` or `closeButton`). Components turns it into the dialog's cancel result, and
  ignores it while the dialog is hidden or busy or when `dismissal` blocks that gesture;
- `registerOverlayContainer(element)`, a ref callback for an element inside the modal shell.

While the dialog is open, Components gives its descendants an overlay environment whose container
is the registered element, so a descendant dropdown or tooltip portals inside the dialog and stays
usable in the top layer. The registration belongs to one open session of one dialog: a ref from a
previous session or a closed dialog is ignored, and a closed dialog provides no container. Until the
adapter registers an element, descendants keep the surrounding environment. Components also
publishes the dialog as its descendants' overlay host, so `unstable_useOverlayHost` reports the
host's `id`, its effective open state and a tooltip z-index above the dialog.

A dialog nested in another adapter dialog receives `visible` as false until its parent has opened,
and again as soon as its parent hides. Native modals therefore open parent-first and close
child-first, so Escape reaches the topmost dialog and no hidden modal keeps the page inert.

`Dialog` routes to the adapter declaration when one is resolved and keeps the built-in dialog
otherwise; an adapter without `atomicSlots['dialogs.dialog']` gets the built-in dialog with no
change. The profile identifier, the nine presentation slots and the renderer ABI stay unchanged.

The `dialogs.dialog` conformance profile renders the adapter declaration through the public
`Dialog`, so the adapter receives the same host an application gives it. A native `<dialog>` may
stand in for the `role="dialog"` root; the top layer then owns the backdrop and positioning, so the
`backdrop` and `positioner` parts are not required of it.

## Alternatives considered

- **Public props only.** Rejected: it loses the stack, the result flow and the actions, and a
  native modal hides every descendant overlay.
- **Adapter-owned stack and footer.** Rejected: each adapter would re-implement the result flow and
  the stacking that descendants depend on, and they would drift apart.
- **No stable dialog slot.** Kept as the fallback had the overlay container not worked: a browser test
  proves that a dropdown, a tooltip and a nested dialog stay usable and on top inside a native
  modal `<dialog>`.

## Semver policy

ADR 0007's semver policy applies. Removing a `CratisDialogHost` member, changing its meaning, or
moving a responsibility between Components and the adapter is a breaking change. Adding an optional
host member is a compatible addition.

## Consequences

An adapter that renders a native modal `<dialog>` gets the platform's focus trap, Escape handling
and focus restoration, and keeps Components' dialog behavior and descendant stacking. Designsystemet
implements the slot. MUI, PrimeReact 11 and PrimeReact 10 keep the built-in dialog.
