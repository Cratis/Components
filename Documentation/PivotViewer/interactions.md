# PivotViewer - Interactions

## Zoom

### Mouse Wheel

Scroll up to zoom in, scroll down to zoom out.

### Zoom Controls

Use the zoom slider or buttons in the toolbar:

- **Zoom In** button: Increase zoom level
- **Zoom Out** button: Decrease zoom level
- **Reset** button: Return to default zoom

### Programmatic Zoom

Access zoom controls through component state if needed.

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

```
Status:
☑ Todo
☑ In Progress
☐ Done
```

### Range Filters

Adjust sliders to set minimum and maximum values:

```
Price: [$0 ━━●━━━━━━━━ $1000]
```

### Search

Type in the search box to filter by text across specified fields:

```
Search: [react components____]
```

### Clearing Filters

- Click individual filter's clear button
- Use "Clear All Filters" button

## Dimension Selection

Click dimension labels (axis labels) at the top to change grouping:

```
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

## Keyboard Shortcuts

Common shortcuts (if implemented):

- `Esc`: Close detail panel
- `Arrow keys`: Navigate between cards
- `+/-`: Zoom in/out
- `/`: Focus search box

## Touch Gestures

On touch devices:

- **Pinch**: Zoom in/out
- **Swipe**: Pan around collection
- **Tap**: Select card
- **Double-tap**: Quick zoom

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

## State Persistence

The component remembers:

- Current zoom level
- Scroll position
- Active dimension
- Applied filters
- Selected item

This provides a consistent experience as users interact with the data.

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
- Collapses filter panel on mobile
- Touch-friendly controls on tablets
- Keyboard-optimized on desktop

## Performance During Interaction

- Smooth 60fps animations
- Instant filter updates (Web Worker)
- Progressive rendering for large datasets
- Optimized re-renders on state changes
