# IconPicker

A controlled icon property control: a closed trigger showing the selected glyph and name, and a popout
that browses a host-supplied catalog. Product documentation: `Documentation/IconPicker/index.md`.

## Component hierarchy

- `IconPicker.tsx` — composition root. Owns open state, resolves the selection against the catalog, and
  chooses between an anchored `Popover` and, on a narrow viewport, a contained `Modal` sheet.
  - `IconPickerTrigger.tsx` — the closed control; shows the raw qualified identity for a missing selection.
  - `IconPickerPopout.tsx` — the dialog content; owns the search and filters through `useIconPickerBrowser`.
    - `IconPickerSearch.tsx`, `IconPickerLibraryFilter.tsx`, `IconPickerCategoryFilter.tsx`
    - `IconPickerResults.tsx` — loading, error, empty and no-results states, compact category groups, or
      one flat grid.
      - `IconPickerGrid.tsx` — a listbox with a roving tab stop (`useRovingFocus`, `useGridColumns`).
      - `IconPickerTile.tsx` — one option; draws its preview only once near the viewport (`useIsVisible`).
- Pure logic with specs: `createIconPickerIndex.ts`, `searchIconPickerIndex.ts`,
  `groupIconPickerByCategory.ts`, `isSameIconPickerValue.ts`, `toIconPickerValue.ts`, `isIconPickerAllowed.ts`.

## Architecture decisions

- **Identity is `library` + `key` + `variant`.** The picker never matches or emits a name, class or index, and a
  selection missing from the catalog is shown by identity, never replaced by a same-named icon.
- **The catalog is the host's.** No icon package is resolved here; previews are host render functions called lazily.
- **Restricted icons stay listed.** An icon outside `allowed` is shown dashed with the reason, rather than
  hidden, so people see why a familiar icon cannot be chosen. The host narrows the catalog to hide icons.
- **Overlay, focus and dismissal come from React Aria** (`DialogTrigger`, `Popover`, `Modal`), portaled
  through the shared overlay environment and stacked above any enclosing dialog.
- **Arrow keys are a roving grid**, with the column count read back from the laid-out CSS grid.
