---
title: PivotViewer configuration
description: Props, colors, loading and empty states, and search configuration for PivotViewer.
---

## Props

### Required Props

| Prop | Type | Meaning |
| --- | --- | --- |
| `data` | `TItem[]` | Items to display. Items must be plain, structured-cloneable data because PivotViewer posts them to its worker. |
| `dimensions` | `PivotDimension<TItem>[]` | Values to sort by (collection view) and group by (grouped view). See [Dimensions and filters](dimensions-and-filters.md). |
| `cardRenderer` | `(item) => { title: string; labels?: string[]; values?: string[] }` | Text shown on each card. See [Renderers](renderers.md). |

### Optional Props

| Prop | Type | Default | Meaning |
| --- | --- | --- | --- |
| `filters` | `PivotFilter<TItem>[]` | none | Facets in the filter panel. The toolbar shows the filter button, and with it the search box, only when this has at least one entry. |
| `detailRenderer` | `(item, onClose) => ReactNode` | built-in fallback | Content of the detail drawer for the selected card. The drawer shell stays component-owned. |
| `getItemId` | `(item, index) => string \| number` | a numeric `id` property, otherwise the array index | Stable identity for selection. |
| `defaultDimensionKey` | `string` | first dimension | Initial dimension. Ignored if no dimension has that key. |
| `searchFields` | `PropertyAccessor<TItem>[]` | none (search does nothing) | Property accessors the search box matches against. |
| `title` | `string` | none | Heading at the left of the toolbar. Omit it when the host already names the view. |
| `className` | `string` | none | Extra class on the `.pivot-viewer` root. |
| `emptyContent` | `ReactNode` | "No items to display." | Shown when no items are visible. |
| `isLoading` | `boolean` | `false` | Replaces the card area with a spinner and accessible loading status. |
| `loadingLabel` | `string` | "Loading…" | Status text announced while `isLoading` is `true`. Takes precedence over `labels.loading`. |
| `labels` | `PivotViewerLabels` | English defaults | Toolbar text and loading status overrides. See [Toolbar labels](#toolbar-labels). |
| `colors` | `Partial<PivotViewerColors>` | theme tokens | Color overrides. See [Color customization](#color-customization). |

The toolbar's default count reads "*n* events" for backward compatibility, even for non-event collections. Override `labels.itemCount` to name your items. The filter panel has its own English copy (including `Search…`); `labels` does not override that panel.

## Toolbar labels

Set only the fields you need. Omitted fields keep their current English text:

| Key | Type | Default |
| --- | --- | --- |
| `filters` | `string` | `Filters` |
| `sortBy` | `string` | `Sort by` |
| `collection` | `string` | `Collection` |
| `grouped` | `string` | `Grouped` |
| `zoomOut` | `string` | `Zoom out` |
| `zoomLevel` | `string` | `Zoom level` (slider accessible name) |
| `zoom` | `(percent: number) => string` | `Zoom: 100%` at 100% zoom (slider title) |
| `editZoomLevel` | `string` | `Click to edit zoom level` |
| `resetZoom` | `string` | `Reset zoom` |
| `zoomIn` | `string` | `Zoom in` |
| `itemCount` | `(count: number) => string` | `${count} events` |
| `loading` | `string` | `Loading…` (unless `loadingLabel` is set) |

For a collection of tasks, pass `labels.itemCount` as a formatter returning the count followed by "tasks". `zoom` receives the rounded zoom percentage. To customize the loading announcement along with the toolbar, set `labels.loading`; the existing `loadingLabel` prop continues to work and wins when both are provided. Other text outside the toolbar, such as filter-panel copy and the empty state, is not changed by these labels.

## Example Configuration

The examples on this page assume a `Task` type and `taskDimensions`, `taskFilters`, `taskCardRenderer`, and `taskDetailRenderer` defined as in [Dimensions and filters](dimensions-and-filters.md#complete-example) and [Renderers](renderers.md). `fetchTasks` stands for your own data loading.

```tsx
import { useEffect, useState } from 'react';
import { PivotViewer } from '@cratis/components/PivotViewer';

export function TaskViewer() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks()
            .then(setTasks)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ height: 600, display: 'flex', flexDirection: 'column' }}>
            <PivotViewer
                data={tasks}
                dimensions={taskDimensions}
                filters={taskFilters}
                defaultDimensionKey='status'
                cardRenderer={taskCardRenderer}
                detailRenderer={taskDetailRenderer}
                getItemId={(item) => item.id}
                searchFields={[
                    (item) => item.title,
                    (item) => item.description,
                    (item) => item.assignee,
                ]}
                title='Tasks'
                className='my-pivot-viewer'
                emptyContent={<p>No tasks match the current filters.</p>}
                isLoading={loading}
                colors={{
                    primaryColor: '#4CAF50',
                    surfaceGround: '#1a1a1a',
                    surfaceCard: '#2d2d2d',
                }}
            />
        </div>
    );
}
```

The wrapping `div` gives the viewer its height: PivotViewer fills its parent and sets no height of its own.

## Color Customization

`colors` accepts any subset of `PivotViewerColors`. Each key sets one semantic CSS variable on the viewer root:

| Key | CSS variable |
| --- | --- |
| `primaryColor` | `--cratis-primary-color` |
| `primaryColorText` | `--cratis-primary-color-text` |
| `primary500` | `--cratis-primary-500` |
| `surfaceGround` | `--cratis-surface-ground` |
| `surfaceCard` | `--cratis-surface-card` |
| `surfaceSection` | `--cratis-surface-section` |
| `surfaceOverlay` | `--cratis-surface-overlay` |
| `surfaceBorder` | `--cratis-surface-border` |
| `textColor` | `--cratis-text-color` |
| `textColorSecondary` | `--cratis-text-color-secondary` |
| `highlightBg` | `--cratis-highlight-bg` |
| `maskbg` | `--cratis-maskbg` |
| `focusRing` | `--cratis-focus-ring` |

```tsx
const customColors = {
    primaryColor: '#0066cc', // Primary accent color
    surfaceGround: '#ffffff', // Main background
    surfaceCard: '#f5f5f5', // Pixi card base and DOM card backgrounds
    surfaceSection: '#e8e8e8', // Pixi card secondary surface
    textColor: '#333333', // Text color
    surfaceBorder: '#e0e0e0', // Border color
};

<PivotViewer colors={customColors} data={tasks} dimensions={taskDimensions} cardRenderer={taskCardRenderer} />;
```

Color props map to semantic `--cratis-*` variables and the Pixi renderer's card palette. Updating `colors` after mount refreshes both surfaces, including existing title, label, and value text. Omit `colors` to use the application's theme tokens.

## Server rendering and hydration

`PivotViewer` can render its structural fallback on the server without `document`, canvas, or Pixi initialization. Browser-only color resolution, portals, observers, and the Pixi renderer start after hydration. An initially closed filter panel produces the same server and first-client tree; if application state opens it immediately, the portal is deliberately mounted only after hydration.

The server does not rasterize cards. Treat the server output as a stable loading/empty structure, then let the client build the interactive Pixi surface.

## Loading State

Set `isLoading` while data is being fetched, as in the [example configuration](#example-configuration). While it is `true`, PivotViewer shows a spinner instead of the card area. The spinner has a `role="status"` with visually hidden text, so screen readers can announce loading. Set `loadingLabel` or `labels.loading` to change the default "Loading…" text, for example to match your application's language. `loadingLabel` takes precedence when both are set.

After `isLoading` turns `false`, PivotViewer shows "Building indexes..." until its engine has indexed the new `data`.

PivotViewer has no error state. If loading fails, render your own error message instead of (or next to) the viewer; do not leave `isLoading` set.

## Empty State

`emptyContent` replaces the default "No items to display." text whenever no items are visible: when `data` is empty, and when filters or search match nothing.

```tsx
import { FaInbox } from 'react-icons/fa6';

<PivotViewer
    data={tasks}
    dimensions={taskDimensions}
    cardRenderer={taskCardRenderer}
    emptyContent={
        <div className='empty-state'>
            <FaInbox aria-hidden='true' style={{ fontSize: '3rem' }} />
            <h3>No results found</h3>
            <p>Try adjusting your filters</p>
        </div>
    }
/>;
```

`empty-state` is your own class; Components ships no styles for it. If `data` can be empty for reasons other than filtering, word the content so it fits both cases.

## Search Configuration

Specify which fields should be searchable by passing accessor functions:

```tsx
<PivotViewer
    data={tasks}
    dimensions={taskDimensions}
    filters={taskFilters}
    cardRenderer={taskCardRenderer}
    searchFields={[
        (item) => item.title,
        (item) => item.description,
        (item) => item.tags,
        (item) => item.assignee,
    ]}
/>
```

The search box in the filter panel matches an item when the search term, ignoring case, appears in the value of any listed field. The value is converted with `String(...)`, so an array such as `tags` is matched as its comma-joined text.

Each accessor must be a plain property access, optionally nested (`(item) => item.address.city`). PivotViewer reads the property path from the accessor's source text rather than calling it, so computed accessors match nothing. Search is only reachable when `filters` has at least one entry, because the search box lives in the filter panel.
