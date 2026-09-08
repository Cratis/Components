# TimeMachine - Navigation

## Timeline Navigation

### Timeline Points

Click any point on the timeline to jump to that version:

```text
●━━━●━━━━━●━━━━━━━●
v1  v2    v3      v4 (current)
```

### Hover Preview

Hover over timeline points to preview a version without selecting it. The preview shows the read model state at that point in time.

### Visual Indicators

- **Filled circles**: Versions with events
- **Highlighted**: Currently selected version
- **Preview highlight**: Hovered version

## Gesture Navigation

### Trackpad (Two-Finger Swipe)

- Swipe left: Move to previous version
- Swipe right: Move to next version
- Smooth scrolling accumulates to change versions

### Touch Devices

`TimeMachine` does not install dedicated swipe or pinch handlers. Use the previous/next buttons or tap a timeline entry. Product-specific touch gestures must be implemented and tested by the host.

### Mouse Wheel

- Scroll in read model view to navigate versions
- Only when not hovering over a card (allows card scrolling)

## Button Navigation

Navigation arrows are available:

```text
[← Previous]  Timeline  [Next →]
```

- **Previous**: Go to earlier version
- **Next**: Go to later version
- Buttons disable at timeline ends

## Keyboard behavior

The timeline controls are native buttons. Reach them with `Tab` / `Shift+Tab` and activate them with `Enter` or `Space`; previous/next controls disable at the timeline boundaries. `TimeMachine` does not install document-level arrow, `Home`, `End`, or `Escape` shortcuts. A host may add scoped product shortcuts, but it must own focus rules and conflicts with text inputs or other controls.

## Breadcrumb Navigation

The view switcher shows current mode:

```text
[Read Model] | Events
```

Click to switch between viewing modes.

## Navigation Behavior

### Smooth Transitions

Transitions between versions are animated for clarity:

- Cards fade in/out
- Properties highlight when changed
- Timeline indicator moves smoothly

### Mounted interaction state

While it remains mounted, the component keeps its selected version and Read Model / Events view mode. `currentVersionIndex` supplies the initial selection; later user selections are reported through `onVersionChange`. `TimeMachine` does not persist state across unmounts or browser sessions, and it does not retain card scroll positions or expose timeline zoom state. The host owns any durable preference or route synchronization.

## Advanced Navigation

### Initial version and change observation

Choose the initial version and observe later user navigation:

```typescript
const [versionIndex, setVersionIndex] = useState(5);

<TimeMachine
    versions={versions}
    currentVersionIndex={versionIndex}
    onVersionChange={setVersionIndex}
/>
```

`currentVersionIndex` is read when the component mounts; changing it later does not replace the internal selection. Remount the component with a different key only when the product needs to reset the timeline from outside.

### Choose an initial version by criteria

Calculate the starting index before mounting the timeline:

```typescript
const matchingIndex = versions.findIndex(version =>
    version.timestamp >= new Date('2024-01-15')
);
const initialIndex = matchingIndex < 0 ? 0 : matchingIndex;

<TimeMachine
    versions={versions}
    currentVersionIndex={initialIndex}
    onVersionChange={setVersionIndex}
/>
```

The same approach can locate the first version containing an event. This chooses the initial position; it is not an imperative navigation API.

## Scroll Sensitivity

Adjust how much scrolling triggers version change:

```typescript
<TimeMachine
    scrollSensitivity={100}  // Need more scrolling
    versions={versions}
/>
```

Lower values (25-50): Quick navigation, less control
Higher values (100-200): Precise navigation, more deliberate

## Navigation Tips

1. **Use timeline for quick jumps**: Click directly on target version
2. **Use wheel navigation for browsing**: Scroll through versions sequentially in Read Model view
3. **Hover to preview**: Check version before selecting
4. **Watch for highlights**: Changed properties show what's different
5. **Use buttons for step-by-step**: Navigate methodically through history
6. **Check event view**: See all events chronologically
