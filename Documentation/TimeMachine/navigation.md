---
title: TimeMachine navigation
description: Move between versions with the timeline, buttons, cards, wheel, and keyboard, and control the initial version.
---

## Timeline Navigation

### Timeline Points

The timeline runs vertically along the right edge in the read model view, one entry per version, labeled with the version's date and time. Click an entry to select that version:

```text
Jan 1, 2024  10:00
Jan 5, 2024  14:30
Jan 10, 2024  9:15   (selected)
```

Each entry is a native button with `aria-pressed` on the selected version and the date and time as its accessible name. The version's `label` is shown on its card, not on the timeline.

### Hover Preview

Hover over a timeline entry, or focus it with the keyboard, to bring that version's card to the front without selecting it. Moving away returns to the selected version. A preview does not call `onVersionChange`.

### Visual Indicators

- **Selected**: the entry for the selected version is highlighted
- **Magnification**: the hovered entry and its neighbors grow, in a fish-eye effect that fades over three entries on each side

## Gesture Navigation

### Trackpad (Two-Finger Swipe)

In the read model view, wheel and trackpad scrolling over the TimeMachine moves between versions:

- TimeMachine adds up the scroll deltas, using the horizontal delta when it is larger than the vertical one
- Each time the total reaches `scrollSensitivity` (default `50`), it moves one version: a positive delta (scrolling down or right) moves to the next version, a negative one to the previous version
- It stops at the first and last version

### Touch Devices

`TimeMachine` does not install dedicated swipe or pinch handlers. Use the previous/next buttons or tap a timeline entry. Product-specific touch gestures must be implemented and tested by the host.

### Mouse Wheel

- Scroll in read model view to navigate versions
- Only when not hovering over a card (allows card scrolling)
- TimeMachine prevents the page from scrolling while the pointer is over it outside a card

## Button Navigation

Previous and next buttons sit at the bottom center of the read model view:

```text
[‹]  [›]
```

- **Previous** (accessible name "Previous version"): go to the earlier version
- **Next** (accessible name "Next version"): go to the later version
- Buttons disable at timeline ends

Clicking a version card behind the front one also selects that version. Earlier versions are not shown in the stack; reach them with the timeline or the previous button.

## Keyboard behavior

The timeline controls are native buttons. Reach them with `Tab` / `Shift+Tab` and activate them with `Enter` or `Space`; previous/next controls disable at the timeline boundaries. `TimeMachine` does not install document-level arrow, `Home`, `End`, or `Escape` shortcuts. A host may add scoped product shortcuts, but it must own focus rules and conflicts with text inputs or other controls.

The front card's content area and the events list are focusable scroll regions, so keyboard users can scroll them with the arrow keys once focused. Selecting a version by clicking its card has no keyboard equivalent; use the timeline or the previous/next buttons instead.

## View switching

The view switcher at the top center has two icon buttons, "Read Model View" and "Events View":

```text
[Read Model] | Events
```

The selected view is marked with `data-selected` and `data-pressed`. The timeline and previous/next buttons appear only in the read model view.

## Navigation Behavior

### Smooth Transitions

Transitions between versions are animated with CSS:

- Cards move forward and back in a 3D stack: the displayed version is in front, with up to nine later versions behind it
- Flipping a card to its events rotates it
- Timeline entries grow and shrink around the hovered entry

With `prefers-reduced-motion: reduce`, these transitions and animations are turned off.

### Mounted interaction state

While it remains mounted, the component keeps its selected version and Read Model / Events view mode. `currentVersionIndex` supplies the initial selection; later user selections are reported through `onVersionChange`. `TimeMachine` does not persist state across unmounts or browser sessions, and it does not retain card scroll positions or expose timeline zoom state. The host owns any durable preference or route synchronization.

## Advanced Navigation

### Initial version and change observation

Choose the initial version and observe later user navigation:

```tsx
const [versionIndex, setVersionIndex] = useState(5);

<TimeMachine
    versions={versions}
    currentVersionIndex={versionIndex}
    onVersionChange={setVersionIndex}
/>;
```

`currentVersionIndex` is read when the component mounts; changing it later does not replace the internal selection. Remount the component with a different key only when the product needs to reset the timeline from outside.

### Choose an initial version by criteria

Calculate the starting index before mounting the timeline:

```tsx
const matchingIndex = versions.findIndex((version) => version.timestamp >= new Date('2024-01-15'));
const initialIndex = matchingIndex < 0 ? 0 : matchingIndex;

<TimeMachine
    versions={versions}
    currentVersionIndex={initialIndex}
    onVersionChange={setVersionIndex}
/>;
```

The same approach can locate the first version containing an event. This chooses the initial position; it is not an imperative navigation API.

## Scroll Sensitivity

Adjust how much scrolling triggers version change:

```tsx
<TimeMachine
    versions={versions}
    scrollSensitivity={100} // Need more scrolling
/>
```

Lower values (25-50): Quick navigation, less control
Higher values (100-200): Precise navigation, more deliberate

## Navigation Tips

1. **Use timeline for quick jumps**: Click directly on target version
2. **Use wheel navigation for browsing**: Scroll through versions sequentially in Read Model view
3. **Hover to preview**: Check version before selecting
4. **Flip a card**: See the events that produced that version
5. **Use buttons for step-by-step**: Navigate methodically through history
6. **Check event view**: See all events across versions
