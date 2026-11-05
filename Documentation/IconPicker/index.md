---
title: IconPicker for host-supplied icon selection
description: IconPicker lets users search your app's icon catalog and returns a qualified value. Control selection, restrict choices, and handle loading states.
---

`IconPicker` in Cratis Components lets users search and choose from an icon catalog supplied by your application. Use it for an icon field where your app owns the available glyphs and stores the selection. The picker returns a qualified identity: a `library`, a `key` and an optional `variant` that together identify the icon.

The closed control shows the selected glyph and its name. Opening it reveals searchable, categorized tiles with visible names. Your app supplies both the catalog and the drawing function for each glyph; the picker does not resolve icon packages or load icons itself.

## Basic usage

Keep the selected identity in your state and pass it back through `value`. This makes the picker controlled: choosing an icon notifies your app through `onChange`, and your app decides which value to display.

```tsx
import { useState } from 'react';
import { IconPicker, type IconPickerCatalog, type IconPickerValue } from '@cratis/components/IconPicker';

export function ToolbarIconField({ catalog }: { catalog: IconPickerCatalog }) {
    const [icon, setIcon] = useState<IconPickerValue | null>(null);

    return <IconPicker value={icon} onChange={setIcon} catalog={catalog} aria-label='Toolbar icon' />;
}
```

Import the stylesheet once, either the aggregate `@cratis/components/styles` or the area sheet `@cratis/components/IconPicker/styles`. Follow the [styling setup](../Styling/index.md) for token defaults and the shared base needed with per-area stylesheets.

## Supply a catalog

Adapt your icon source into an `IconPickerCatalog`. In this illustrative catalog, `ExampleHomeGlyph` and `SampleHomeSymbol` stand for glyph components supplied by your app:

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
| `icons[].renderPreview` | Draws the glyph. Glyph drawing in tiles is deferred until they near the viewport. The trigger also calls it for the selected icon. |
| `status`, `error` | `ready` (the default), `loading`, or `error` with a message to show. |

Both entries in this example are named Home and use the key `home`, but their `library` values differ. Store the full `IconPickerValue` so you can distinguish them later. `IconPickerEntry` and `IconPickerValue` share the identity fields `library`, `key` and `variant`; all three must match for two values to identify the same icon. The picker emits this identity, not SVG markup, a CSS class, a display name or a catalog index.

When the catalog lists several libraries, the tiles show provider names and a library filter appears. Users can tell same-named icons apart before choosing.

## Control the value

Pass the selected qualified identity as `value`, or `null` when nothing is selected. Choosing an available icon calls `onChange` with a fresh `{ library, key, variant? }`, closes the popout and returns focus to the trigger. In the basic example, `setIcon` accepts that identity and supplies it on the next render.

Escape, the close button and pressing outside dismiss the popout without calling `onChange`. Search and filters start fresh each time it opens. Browsing does not change the selection; only an update to `value` does.

## Restrict and validate

Choose whether an icon should be hidden or shown as unavailable. To hide it, leave it out of the catalog. To keep it visible but prevent selection for this field, use `allowed`.

| Prop | Effect |
| --- | --- |
| `readOnly` | Shows the selection. The control stays focusable, does not open, and never emits. |
| `disabled` | Disables the control. |
| `allowed` | A list of qualified values or a predicate over entries. Other icons stay listed, marked "Not available for this field", and cannot be selected or emitted. |
| `invalid`, `validationMessage` | `invalid` marks the control invalid. A `validationMessage` is shown below it and described to assistive technology; it also implies invalid state unless `invalid` is explicitly set. |

Your app controls the catalog and the narrower set accepted by `allowed`. These restrictions govern what the picker can emit; they do not replace validation wherever your app stores or uses the value.

## Missing, loading and failed catalogs

Set `catalog.status` while your app loads the catalog. With `loading`, icons already supplied remain browsable and selectable, subject to `allowed`. The selected value stays unchanged. If its entry has not loaded, the trigger shows the qualified identity without a missing-selection warning.

When loading completes, set `status` to `ready`, which is also the default when omitted. A value absent from a ready catalog is never replaced by a same-named icon from elsewhere. The trigger shows its raw identity, such as `retired-library / home`, with a warning mark and a message; no tile is selected.

If loading fails, set `status` to `error` and supply a message through `catalog.error`. The popout announces that message as an alert, falling back to the `error` label when no message is supplied. Supplied icons remain listed and selectable, and an absent selection is shown by identity without a missing-selection warning. Loading and retrying remain your app's responsibility.

An empty ready catalog has its own message. If the catalog has icons but search or filters match none, the picker shows a no-results message and a button to clear the filters.

## Large catalogs

Browsing shows compact category groups of `compactGroupSize` icons, 12 by default, with a **Show all** action. Searching or choosing a category lists every match in one grid.

The search index is reused while the catalog's `icons` array stays the same. Replace that array when supplying updated entries so the picker rebuilds the index. Tiles defer drawing their glyphs until they approach the viewport and keep them rendered after scrolling away. This delays glyph rendering, not catalog indexing or creation of the matching tiles; it is not grid virtualization. Without `IntersectionObserver`, all displayed tiles render their glyphs immediately.

## Placement and narrow viewports

Use `placement` to position the popout beside the trigger; the default is `'bottom start'`. The popout adjusts to the viewport and renders in a portal to avoid clipping by surrounding containers. On a viewport at most 30rem wide, it becomes a contained sheet.

## Labels and accessibility

Give the trigger a field-specific accessible name, such as `aria-label='Toolbar icon'` in the basic example. The selected icon's name is appended to `aria-label`, or to the default `trigger` label when no label is supplied. With `aria-labelledby`, it is appended to the referenced label instead. Missing values use their qualified identity as the selection name.

The keyboard path supports browsing without selecting until the user confirms a choice:

- Opening focuses the search field. Down moves from search into the icons.
- Each grid is a listbox with one Tab stop. Arrow keys move by tile or row; Home and End jump to the ends. Enter or Space chooses an allowed icon.
- The category filter is a group of toggle buttons with one Tab stop and arrow-key movement. The summary line announces what is showing.

Unavailable tiles remain focusable and explain why they cannot be chosen. The selected tile has a check mark and a heavier border, focus has an offset outline, and unavailable tiles have a dashed border and text. These states do not depend on color alone. Long or localized names wrap within the tile.

Use `labels` to replace the English defaults, including the title, search, filters, state messages and summary sentence.

## Styling

Style the stable parts through `pt` or the `data-cratis-part` attributes: `root`, `trigger`, `glyph`, `name`, `message`, `popover`, `dialog`, `title`, `close`, `search`, `clear`, `categories`, `category`, `library`, `summary`, `status`, `group`, `groupTitle`, `showAll`, `grid`, `tile`, `tileIcon`, `tileName`, `provider` and `attribution`.

The root and trigger carry `data-disabled`, `data-invalid`, `data-readonly` and `data-open`; the trigger also carries `data-missing` for a selection absent from a ready catalog. The active category and the selected tile carry `data-selected`, an unavailable tile carries `data-disabled`, and the status carries `data-loading` while the catalog loads. Colors come from the `--cratis-*` tokens.

For application-wide colors and focus treatments, continue with [Cratis Components styling choices](../Styling/index.md). Keep the picker's visible names and non-color state cues when customizing its parts.
