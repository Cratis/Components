---
title: IconPicker
description: Choose an icon from a host-supplied catalog in a searchable, categorized popout that emits a qualified library, key and variant.
---

`IconPicker` is a controlled icon property control. The closed control shows the selected glyph and its name. Pressing it opens a popout with a title, a search field, category and library filters, and a grid of bordered tiles, each with its glyph centered in a fixed area and its name always visible beneath it.

The picker is library-neutral. It browses exactly the catalog you hand it, never resolves icon packages, and emits a qualified identity (`library`, `key` and optional `variant`), never SVG, a CSS class, a display name or an index.

## Basic usage

```tsx
import { useState } from 'react';
import { IconPicker, type IconPickerCatalog, type IconPickerValue } from '@cratis/components/IconPicker';

export function ToolbarIconField({ catalog }: { catalog: IconPickerCatalog }) {
    const [icon, setIcon] = useState<IconPickerValue | null>(null);

    return <IconPicker value={icon} onChange={setIcon} catalog={catalog} aria-label='Toolbar icon' />;
}
```

Import the stylesheet once, either the aggregate `@cratis/components/styles` or the area sheet `@cratis/components/IconPicker/styles`.

## Supply a catalog

A host adapts whatever icon source it has into an `IconPickerCatalog`:

```tsx
import type { IconPickerCatalog } from '@cratis/components/IconPicker';

const catalog: IconPickerCatalog = {
    libraries: [
        { id: 'example-glyphs', name: 'Example Glyphs', version: '2.0.1', attribution: 'Drawn for the examples' },
        { id: 'sample-symbols', name: 'Sample Symbols' },
    ],
    icons: [
        {
            library: 'example-glyphs',
            key: 'home',
            name: 'Home',
            categories: ['Places'],
            tags: ['house', 'start'],
            renderPreview: () => <ExampleHomeGlyph />,
        },
        {
            library: 'sample-symbols',
            key: 'home',
            name: 'Home',
            categories: ['Places'],
            renderPreview: () => <SampleHomeSymbol />,
        },
    ],
};
```

| Field | Meaning |
| --- | --- |
| `libraries[].id` | The stable library identity. Each entry's `library` refers to it. |
| `libraries[].name`, `version`, `attribution` | Shown to tell providers apart and to credit them at the foot of the popout. |
| `icons[].library`, `key`, `variant` | The qualified identity the picker emits. Together they are the icon's identity; the display name is not. |
| `icons[].name` | The label under the glyph, also matched by search. |
| `icons[].categories` | The groups the icon is listed under. An icon with none lands in an "Other" group. |
| `icons[].tags`, `aliases` | Extra words that find the icon. |
| `icons[].deprecated` | Keeps the icon selectable but flags it. |
| `icons[].renderPreview` | Draws the glyph. Called only once the tile nears the viewport. |
| `status`, `error` | `ready` (the default), `loading`, or `error` with a message to show. |

The field names `library`, `key` and `variant` are the same on `IconPickerEntry` and `IconPickerValue`, so a stored value can be compared with, and found in, the catalog directly. Equality is all three fields: the same `home` key in another library, or in another variant, is a different icon.

Two libraries may define the same name. The tiles then name their provider, and a library filter appears, so duplicates stay distinguishable.

## Control the value

`value` is the selected qualified identity, or `null`. `onChange` receives a fresh `{ library, key, variant? }` and is the only thing the picker emits. Choosing an icon calls `onChange`, closes the popout and returns focus to the trigger. Escape, the close button and pressing outside dismiss the popout without calling `onChange`.

Search and filters start fresh each time the popout opens; the selection never changes unless you change `value`.

## Restrict and validate

| Prop | Effect |
| --- | --- |
| `readOnly` | Shows the selection. The control stays focusable, does not open, and never emits. |
| `disabled` | Disables the control. |
| `allowed` | A list of qualified values or a predicate over entries. Other icons stay listed, marked "Not available for this field", and cannot be selected or emitted. |
| `invalid`, `validationMessage` | Marks the control invalid; the message is shown under it and described to assistive technology. |

The host enforces the effective exposure: pass the catalog it wants offered, and `allowed` for a narrower set within it.

## Missing, loading and failed catalogs

A selection the catalog does not hold is never replaced by another icon. The trigger shows its raw qualified identity (for example `retired-library / home`) with a warning mark and a message, and the popout selects nothing.

While `status` is `loading`, the icons already supplied stay browsable and the current selection stays stable; a selection not yet loaded is shown by identity without a warning. When `status` is `error`, the popout shows `error` (or the `error` label) as an alert, still listing whatever was supplied. An empty catalog and a search with no matches each have their own message, and no-results offers a button to clear the filters.

## Large catalogs

The search index is built once per catalog, and typing only filters it. A tile calls `renderPreview` only once it comes near the viewport and keeps the result, so a library of thousands of icons costs nothing until it is scrolled. Browsing lists compact category groups of `compactGroupSize` icons (12 by default) with a **Show all** action; searching or choosing a category lists every match in one grid.

## Placement and narrow viewports

The popout opens beside the trigger at `placement` (`'bottom start'` by default), flips and shifts to stay within the viewport, and renders in a portal so a scrolling or clipping inspector cannot cut it off. On a viewport at most 30rem wide it becomes a sheet contained in the viewport.

## Labels and accessibility

Every label has an English default and can be replaced through `labels`, including the title, the search, the category and library filters, each state, and the summary sentence.

- The trigger's accessible name is `aria-label` (or the `trigger` label) followed by the selected icon's name. With `aria-labelledby`, the selected name is appended to the referenced label.
- Opening focuses the search field; Down moves into the icons. Each grid of tiles is a listbox with one Tab stop: the arrow keys move a tile or a row, and Home and End jump to the ends. Enter or Space selects.
- The category filter is a group of toggle buttons with one Tab stop and arrow-key movement. The summary line announces what is showing.
- Tiles, the close button and the filters meet the touch-target size. The selected tile has a check mark and a heavier border, the focused tile an offset outline, and a tile the field does not accept a dashed border and text, so none depends on color alone. Long or localized names wrap within the tile.

## Styling

Style the stable parts through `pt` or the `data-cratis-part` attributes: `root`, `trigger`, `glyph`, `name`, `message`, `popover`, `dialog`, `title`, `close`, `search`, `clear`, `categories`, `category`, `library`, `summary`, `status`, `group`, `groupTitle`, `showAll`, `grid`, `tile`, `tileIcon`, `tileName`, `provider` and `attribution`.

The root and trigger carry `data-disabled`, `data-invalid`, `data-readonly` and `data-open`; the trigger also carries `data-missing` for a selection the catalog lacks. The active category and the selected tile carry `data-selected`, an unavailable tile carries `data-disabled`, and the status carries `data-loading` while the catalog loads. Colors come from the `--cratis-*` tokens.
