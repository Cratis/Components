# TimeMachine - Navigation

## Timeline Navigation

### Timeline Points

Click any point on the timeline to jump to that version:

```
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

- Swipe left/right to navigate between versions
- Pinch to zoom timeline (if implemented)

### Mouse Wheel

- Scroll in read model view to navigate versions
- Only when not hovering over a card (allows card scrolling)

## Button Navigation

Navigation arrows are available:

```
[← Previous]  Timeline  [Next →]
```

- **Previous**: Go to earlier version
- **Next**: Go to later version
- Buttons disable at timeline ends

## Keyboard Shortcuts

(If implemented):

- `Left Arrow`: Previous version
- `Right Arrow`: Next version
- `Home`: First version
- `End`: Latest version
- `Esc`: Close detail view

## Breadcrumb Navigation

The view switcher shows current mode:

```
[Read Model] | Events
```

Click to switch between viewing modes.

## Navigation Behavior

### Smooth Transitions

Transitions between versions are animated for clarity:

- Cards fade in/out
- Properties highlight when changed
- Timeline indicator moves smoothly

### State Persistence

The component remembers:

- Current version index
- View mode (Read Model vs Events)
- Scroll position within cards
- Zoom level (if applicable)

## Advanced Navigation

### Direct Version Access

Programmatically navigate to a specific version:

```typescript
const [versionIndex, setVersionIndex] = useState(0);

// Jump to specific version
setVersionIndex(5);

<TimeMachine
    versions={versions}
    currentVersionIndex={versionIndex}
    onVersionChange={setVersionIndex}
/>
```

### Version Search

Find versions by criteria:

```typescript
const findVersionByTimestamp = (targetDate: Date) => {
    return versions.findIndex(v => 
        v.timestamp >= targetDate
    );
};

const index = findVersionByTimestamp(new Date('2024-01-15'));
setVersionIndex(index);
```

### Event-Based Navigation

Jump to version containing a specific event:

```typescript
const findVersionByEvent = (eventType: string) => {
    return versions.findIndex(v =>
        v.events?.some(e => e.type === eventType)
    );
};

const index = findVersionByEvent('ProductPublished');
setVersionIndex(index);
```

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
2. **Use gestures for browsing**: Swipe through versions sequentially  
3. **Hover to preview**: Check version before selecting
4. **Watch for highlights**: Changed properties show what's different
5. **Use buttons for step-by-step**: Navigate methodically through history
6. **Check event view**: See all events chronologically
