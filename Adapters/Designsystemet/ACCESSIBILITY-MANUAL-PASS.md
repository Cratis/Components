<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# Designsystemet adapter: manual screen-reader pass

**Status: not yet performed. This is a human task.** Nothing in this file is a result. The results
columns are empty on purpose, and this document does not claim assistive-technology certification.

The browser checks in `browser/` cover axe, keyboard order, focus rings, forced colors, reduced
motion and visual baselines for the nine slots (see [CONFORMANCE.md](./CONFORMANCE.md)). They cannot
say what a screen reader announces. This checklist is for the person who does.

## Setup

- VoiceOver: macOS, Safari and Chrome.
- NVDA: Windows, Firefox and Chrome.
- Run the adapter's Storybook, or the slot gallery in `browser/SlotGallery.tsx`, with the
  Designsystemet renderer selected. Test light and dark.
- Record the browser, browser version, screen-reader version and OS in each result.

## Slot scenarios (available now)

| Step | Expected announcement | VoiceOver | NVDA | Issue |
| --- | --- | --- | --- | --- |
| Tab to a solid Button | Accessible name, role "button" | | | |
| Tab to a disabled Button | Skipped, or announced as dimmed/unavailable when reached by browse mode | | | |
| Tab to a loading Button | Name and busy state | | | |
| Tab to the icon-only Button | Its `aria-label` ("Add item"), role "button" | | | |
| Tab to a labelled text input | Label, role "edit text", current value | | | |
| Tab to an invalid text input | Label, value and invalid state | | | |
| Tab to a text area | Label, role "edit text", multi-line | | | |
| Tab to a checkbox; press Space | Label, role, checked/unchecked on each toggle | | | |
| Arrow within the radio group | Group name, option name, position (for example "2 of 3"), selected state | | | |
| Tab to a switch; press Space | Label, on/off state change | | | |
| Browse to the determinate progress bar | Name and the value 65 | | | |
| Browse to the indeterminate progress bar | Name and busy/indeterminate, no invented value | | | |
| Browse to the Surface (article) | Its `aria-label` landmark/region name | | | |

## CommandDialog

The browser keyboard checks now cover focus trap, order, Escape and focus return; this table is the
screen-reader half and is still unchecked.

| Step | Expected announcement | VoiceOver | NVDA | Issue |
| --- | --- | --- | --- | --- |
| Open the dialog | Role "dialog", title, and description announced; focus moves inside | | | |
| Tab and Shift+Tab | Focus stays trapped in the dialog | | | |
| Submit with a validation error | Error text announced and focus placed on the field or summary | | | |
| Step navigation | Current step and step count announced | | | |
| Esc or Close | Dialog closes, focus returns to the opener | | | |

## DataPage

There are no page-number buttons or `aria-current`; check that the "1 / 2" and range text are
announced and that focus is not lost after paging to the last page (a known finding).

| Step | Expected announcement | VoiceOver | NVDA | Issue |
| --- | --- | --- | --- | --- |
| Landmarks and headings | Page heading and landmarks reachable by rotor or element list | | | |
| Table or list | Table or list semantics with row and column counts | | | |
| Sort and filter controls | Name and current sort or filter state | | | |
| Paginator | Control labels (First, Previous, Next, Last page), range and page text announced | | | |
| Row actions | Action name includes the row it applies to | | | |

## Recording findings

1. File one issue per distinct problem in Cratis/Components. Name the slot or surface, the screen
   reader and browser pairing, what was announced and what was expected.
2. Put the issue number in the table row's Issue column. Write "pass" or "fail" in the result
   columns only after a person ran the step.
3. Record known upstream Designsystemet behaviour as such; it needs an upstream report, not an
   adapter fix.
