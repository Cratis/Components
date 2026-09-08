# PivotViewer - Interactions

## Zoom

### Mouse Wheel

Hold `Ctrl` (or `Meta` on macOS) while scrolling to zoom around the pointer. An ordinary wheel event keeps its normal scrolling behavior and does not change zoom.

### Zoom Controls

Use the zoom slider or buttons in the toolbar:

- **Zoom In** button: Increase zoom level
- **Zoom Out** button: Decrease zoom level
- **Reset** button: Return to default zoom

### Programmatic Zoom

`PivotViewer` does not expose a controlled zoom prop, zoom callback, or imperative zoom ref. Zoom is interaction state owned by the component and changed through its toolbar, modified-wheel gesture, or touch pinch. A workflow that needs application-controlled zoom requires an application-owned composition rather than relying on internal state.

## Pan

Click and drag anywhere in the collection view to pan around.

### Scroll Behavior

- Automatic scrolling when content exceeds viewport
- Smooth panning for natural feel
- Momentum scrolling on touch devices

## Filter

### Opening Filter Panel

Click the filter icon in the toolbar to open the filter panel.

### Categorical Filters

Check or uncheck values to include/exclude them:

```text
Status:
☑ Todo
☑ In Progress
☐ Done
```

### Range Filters

Adjust sliders to set minimum and maximum values:

```text
Price: [$0 ━━●━━━━━━━━ $1000]
```

### Search

Type in the search box to filter by text across specified fields:

```text
Search: [react components____]
```

### Clearing Filters

- Click individual filter's clear button
- Use "Clear All Filters" button

## Dimension Selection

Click dimension labels (axis labels) at the top to change grouping:

```text
[Status] | Priority | Assignee | Date
```

The selected dimension determines how items are organized into groups.

## Card Selection

Click any card to view its details:

1. Card is highlighted
2. Detail panel slides in from the right
3. Full information is displayed

### Closing Details

- Click the close button in detail panel
- Click outside the detail panel
- Select a different card

## View Modes

Toggle between:

- **Collection View**: Grid of cards grouped by dimension
- **Detail View**: Focus on selected item with full details

## Keyboard behavior

The toolbar exposes native buttons, a range input, and a select, so their standard browser keyboard behavior applies. When the editable zoom percentage is open, `Enter` applies the typed percentage and `Escape` cancels editing. `PivotViewer` does not install global shortcuts for closing details, navigating cards, zooming with `+` / `-`, or focusing search. Do not advertise those shortcuts unless the host implements, scopes, and tests them.

## Touch Gestures

On touch devices:

- **Two-finger pinch**: Zoom around the gesture midpoint
- **Drag the background**: Pan around the collection
- **Tap a card**: Select it

`PivotViewer` does not define a double-tap gesture.

## Example: Full Interaction Flow

1. **Start**: View all items grouped by Status
2. **Filter**: Open filters, select only "High" priority
3. **Group**: Click "Assignee" dimension to regroup
4. **Search**: Type "UI" to find UI-related items
5. **Zoom**: Zoom in to see more detail
6. **Pan**: Drag to view different groups
7. **Select**: Click a card to view details
8. **Action**: Edit task from detail panel
9. **Reset**: Clear filters to see all items again

## Mounted interaction state

While the same viewer instance remains mounted, it keeps the current zoom, scroll position, active dimension, filters, and selection. It does not persist those choices across unmounts, reloads, or browser sessions. If the product needs durable or route-addressable state, treat that as an application-owned composition requirement; the component does not expose a durable persistence contract.

## Multi-step Filtering

Users can combine multiple filters:

1. Set status filter: "In Progress"
2. Set priority range: 5-10
3. Search for: "frontend"
4. Group by: "Assignee"

All filters work together to narrow down the view.

## Responsive Behavior

The component adapts to screen size:

- Adjusts card size for available space
- Reflows the toolbar and filter controls below 900 px
- Supports pointer/touch panning and two-finger pinch zoom
- Keeps toolbar buttons, the zoom range, and the dimension selector keyboard-operable through native controls

## Performance During Interaction

- Smooth 60fps animations
- Instant filter updates (Web Worker)
- Progressive rendering for large datasets
- Optimized re-renders on state changes
