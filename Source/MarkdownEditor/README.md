# MarkdownEditor

A controlled markdown editor: one bordered box with a formatting toolbar, a round corner toggle that swaps
the box to a host-rendered preview, configurable autocompletion at the caret, and uploads of pasted or
dropped files through a host callback. Product documentation: `Documentation/MarkdownEditor/index.md`.

## Component hierarchy

- `MarkdownEditor.tsx` — composition root. Owns the mode, the selection, and the edits that place a selection.
  - `MarkdownModeToggle.tsx` — the round `aria-pressed` toggle, shown only when `renderPreview` is given.
  - `MarkdownToolbar.tsx` — the formatting buttons; one Tab stop with arrow-key movement.
  - `MarkdownWritingArea.tsx` — the textarea: completion keys, formatting shortcuts, file paste and drop.
  - `MarkdownSuggestionList.tsx` — the listbox portaled to the overlay container at the caret.
- `useMarkdownCompletion.ts` — finds the trigger at the caret, debounces, aborts stale requests, and owns
  the highlight and dismissal.
- `useMarkdownUploads.ts` — placeholder-first uploads, resolved by value when each upload answers.
- Pure text edits, each with specs: `applyMarkdownFormat.ts` (and `toggleInlineMarker.ts`,
  `toggleLinePrefix.ts`, `toggleCodeBlock.ts`, `insertLink.ts`), `findCompletionMatch.ts`,
  `replaceRange.ts`, `replacePlaceholder.ts`.

## Architecture decisions

- **No markdown renderer ships here.** Rendering and HTML sanitization are the host's security decision,
  and every host already has a renderer for read-only markdown. `renderPreview` hands the preview to it,
  which keeps this subpath free of markdown dependencies.
- **Completion is generic.** A `MarkdownCompletion` names a string or pattern trigger and a `suggest`
  callback; the editor owns recognition, debouncing, stale-answer dropping, rendering, keyboard handling
  and insertion. What a trigger looks up stays with the host.
- **One pane at a time.** The panes are absolutely positioned inside the body so a long document scrolls
  inside the editor instead of growing it, and the root falls back to `height` as a `min-height`.
- **Focus never leaves the writing area** while completing or formatting: suggestion and toolbar presses
  prevent the mouse-down default, and the list is driven through `aria-activedescendant`.
- **The suggestion list is a top layer.** It carries `data-react-aria-top-layer` so a React Aria modal
  around the editor neither hides it nor treats a click on it as an outside interaction, and stacks above
  the nearest dialog through the dialog stack.

## Styling

`MarkdownEditor.css`, imported through `Source/styles.css`, uses only `--cratis-*` tokens. It has no
comments or transitions on purpose: every rule counts against the aggregate stylesheet budget.
