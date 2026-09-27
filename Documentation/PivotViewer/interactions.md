---
title: PivotViewer interactions
description: What users can do in PivotViewer with a pointer, touch, and the keyboard, and what state it keeps.
---

## Zoom

Zoom ranges from 10% to 300%.

### Mouse Wheel

Hold `Ctrl` (or `Meta` on macOS) while scrolling to zoom around the pointer. An ordinary wheel event keeps its normal scrolling behavior and does not change zoom.

### Zoom Controls

The toolbar's zoom group contains:

- **−** and **+** buttons: zoom out or in by 20 percentage points
- A range slider (accessible name "Zoom level") in 5% steps
- The current percentage: click it to type a value between 10 and 300, then press `Enter` (or leave the field) to apply it or `Escape` to cancel
- A reset button: return to 100%

### Programmatic Zoom

`PivotViewer` does not expose a controlled zoom prop, zoom callback, or imperative zoom ref. Zoom is interaction state owned by the component and changed through its toolbar, modified-wheel gesture, or touch pinch. A workflow that needs application-controlled zoom requires an application-owned composition rather than relying on internal state.

## Pan

The card area is a scroll container. Users move around it by:

- dragging anywhere in the card area with the left or middle mouse button (the drag keeps coasting briefly after release);
- scrolling with the wheel or trackpad;
- dragging with one finger on a touch screen.

### Scroll Behavior

When the collection fits in the viewport there is nothing to scroll. With `prefers-reduced-motion: reduce`, PivotViewer's stylesheet turns off its CSS transitions, CSS animations, and smooth scrolling. The zoom-to-card animation and the detail drawer's slide-in are driven from JavaScript and still run.

## Filter

### Opening Filter Panel

Click the filter button at the left of the toolbar to open the filter panel. The button appears only when `filters` has at least one entry, and a badge on it counts active selections. The panel closes when you click the button again or click outside the panel.

### Categorical Filters

Select values to include them. Without `multi: true` on the filter, a filter holds one value at a time: selecting another value replaces it, and selecting the current value clears it. With `multi: true`, each value toggles independently and an item matches any selected value:

```text
Status (multi: true):
☑ Todo
☑ In Progress
☐ Done
```

### Range Filters

Numeric filters (`type: 'number'`) show a histogram. Select a minimum and maximum to keep only items in that range:

```text
Price: [$0 ━━●━━━━━━━━ $1000]
```

### Search

Type in the search box at the top of the filter panel to narrow the visible items to those whose `searchFields` values contain the text, ignoring case:

```text
Search: [react components____]
```

Search applies together with the active filters. See [Search configuration](configuration.md#search-configuration) for which accessors work.

### Clearing Filters

Each filter with an active selection has a clear button (accessible name "Clear filter" or "Clear range") in its header. There is no single "clear all filters" action; clearing the search box and each filter returns to the full collection.

## Dimension Selection

Use the **Sort by** select in the toolbar to choose the active dimension:

```text
Sort by: [Status ▾]
```

In collection view the active dimension sorts the cards. In grouped view it decides the columns. Below the grid in grouped view, each column has a label with its item count; clicking a label of a string-valued dimension shows only that column, and clicking it again shows all columns. See [Dimensions and filters](dimensions-and-filters.md#dimensions).

## Card Selection

Click or tap a card to select it:

1. The card is highlighted.
2. In collection view the card area scrolls to center the card; in grouped view it also zooms in to at least 120%.
3. The detail drawer slides in from the right with your `detailRenderer` content.

### Closing Details

- Click the close button in the drawer header
- Click the empty background of the card area
- Click the selected card again
- Switch between collection and grouped view

Closing the first selection restores the zoom and scroll position from before it. Clicking a different card while one is selected moves the selection and keeps the drawer open.

## View Modes

Toggle between them with the **Collection** and **Grouped** buttons in the toolbar:

- **Collection View** (the initial view): one grid of cards sorted by the active dimension
- **Grouped View**: one column of cards per value of the active dimension, with labels and counts below

Switching views clears the selection.

## Keyboard behavior

The toolbar exposes native buttons, a range input, and a select, and the filter panel uses native inputs and buttons, so their standard browser keyboard behavior applies. When the editable zoom percentage is open, `Enter` applies the typed percentage and `Escape` cancels editing. The open filter panel handles `Escape` when focus is inside it or on its trigger, then returns focus to the trigger. `PivotViewer` does not install global shortcuts for closing details, navigating cards, zooming with `+` / `-`, or focusing search. Do not advertise those shortcuts unless the host implements, scopes, and tests them.

Keyboard limits to plan for:

- Cards are drawn on a Pixi canvas and cannot be focused. Selecting a card, and therefore opening its details, needs a pointer or touch. If keyboard or screen-reader users must reach individual items, offer another view of the same data, such as a data table.
- The zoom percentage is not focusable, so typing a zoom value needs a pointer. The slider and the zoom buttons work from the keyboard.
- `Escape` closes the filter panel and returns focus to its trigger, but does not close the detail drawer.

## Touch Gestures

On touch devices:

- **Two-finger pinch**: Zoom around the gesture midpoint
- **One-finger drag**: Pan the collection
- **Tap a card**: Select it

`PivotViewer` does not define a double-tap gesture.

## Example: Full Interaction Flow

1. **Start**: View all items in collection view, sorted by the default dimension
2. **Filter**: Open the filter panel and select "High" priority
3. **Group**: Choose **Grouped**, then pick "Assignee" in **Sort by**
4. **Search**: Type "UI" in the filter panel's search box
5. **Zoom**: Zoom in with the slider or `Ctrl` + wheel
6. **Pan**: Drag the background to reach other columns
7. **Select**: Click a card to view its details
8. **Act**: Use an action your `detailRenderer` provides
9. **Reset**: Clear the search and each filter to see all items again

## Mounted interaction state

While the same viewer instance remains mounted, it keeps the current zoom, scroll position, view mode, active dimension, filters, search text, and selection. It does not persist those choices across unmounts, reloads, or browser sessions. If the product needs durable or route-addressable state, treat that as an application-owned composition requirement; the component does not expose a durable persistence contract.

## Multi-step Filtering

Users can combine multiple filters:

1. Set status filter: "In Progress"
2. Set priority range: 5-10
3. Search for: "frontend"
4. Group by: "Assignee"

An item stays visible only when it matches every active filter and the search.

## Responsive Behavior

The component adapts to its container:

- Reflows the card grid to the container width, measured with a `ResizeObserver`; cards keep their fixed size
- Wraps the toolbar onto several rows when the viewport is 900 px wide or less
- Supports pointer and touch panning, and two-finger pinch zoom
- Keeps toolbar buttons, the zoom range, and the dimension selector keyboard-operable through native controls

The detail drawer keeps its fixed 380 px width at every size.

## Performance During Interaction

- Filter, grouping, and sort requests go to the Web Worker when one is available
- Filter-panel counts and free-text search run on the main thread
- Only cards near the viewport get a Pixi sprite, and sprites are reused as you scroll

See [Performance](performance.md) for what to measure in your application.
