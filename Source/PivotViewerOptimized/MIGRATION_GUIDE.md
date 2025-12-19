# Migration Guide: PivotViewerOptimized

## For Users of the Component

### No Changes Required!

The public API remains exactly the same. Your existing code will continue to work:

```tsx
import { PivotViewerOptimized } from './Components/PivotViewerOptimized';

<PivotViewerOptimized
  data={items}
  dimensions={dimensions}
  filters={filters}
  cardRenderer={(item) => <Card item={item} />}
/>
```

## For Developers Working on the Component

### New Structure Benefits

The component is now organized into focused modules for better maintainability:

#### 1. **Utilities** (`utils/`)
If you need to:
- Modify animation behavior → `utils/animations.ts`
- Change constants/config → `utils/constants.ts`
- Update selection logic → `utils/selection.ts`
- Add helper functions → `utils/utils.ts`

#### 2. **UI Components** (`components/`)
If you need to:
- Update canvas rendering → `components/PivotCanvas.tsx`
- Modify filters UI → `components/FilterPanel.tsx`
- Change toolbar → `components/Toolbar.tsx`
- Update detail panel → `components/DetailPanel.tsx`

#### 3. **Data Engine** (`engine/`)
If you need to:
- Change data structure → `engine/store.ts`
- Modify filtering logic → `engine/pivot.worker.ts`
- Update layout calculation → `engine/layout.ts`
- Add new types → `engine/types.ts`

#### 4. **Hooks** (`hooks/`)
If you need to:
- Add state management → `hooks/hooks.ts`
- Modify worker communication → `hooks/usePivotEngine.ts`

### Example: Adding a New Animation

**Before** (old structure):
- Navigate through 700+ line component file
- Find inline animation code
- Risk breaking other features

**After** (new structure):
1. Open `utils/animations.ts`
2. Add your animation function
3. Export it
4. Use it in the component

```tsx
// utils/animations.ts
export function myNewAnimation(params) {
  // Your animation logic
}

// PivotViewerOptimized.tsx
import { myNewAnimation } from './utils/animations';
// Use it
```

### Example: Modifying Selection Behavior

**Before**:
- Search through large component file
- Find selection logic mixed with other code

**After**:
1. Open `utils/selection.ts`
2. Modify `handleCardSelection` function
3. Changes are isolated and testable

### Import Paths Reference

```tsx
// Main component
import { PivotViewerOptimized } from './PivotViewerOptimized';

// Types
import type { PivotViewerProps } from './types';
import type { ItemId, GroupingResult } from './engine/types';

// Components
import { PivotCanvas } from './components/PivotCanvas';
import { Toolbar } from './components/Toolbar';

// Hooks
import { useZoomState, usePanning } from './hooks/hooks';
import { usePivotEngine } from './hooks/usePivotEngine';

// Utils
import { animateZoomAndScroll } from './utils/animations';
import { handleCardSelection } from './utils/selection';
import { BASE_CARD_WIDTH } from './utils/constants';

// Or use barrel exports
import { PivotCanvas, Toolbar } from './components';
import { useZoomState, usePivotEngine } from './hooks';
import { animateZoomAndScroll, handleCardSelection } from './utils';
```

## Common Tasks

### Adding a New Constant

```tsx
// utils/constants.ts
export const MY_NEW_CONSTANT = 42;

// PivotViewerOptimized.tsx (or any file)
import { MY_NEW_CONSTANT } from './utils/constants';
```

### Creating a New Animation

```tsx
// utils/animations.ts
export function fadeIn(element: HTMLElement, duration = 300) {
  // Animation code
}

// Use it anywhere
import { fadeIn } from './utils/animations';
fadeIn(myElement);
```

### Adding a New Hook

```tsx
// hooks/hooks.ts
export function useMyNewHook() {
  // Hook logic
  return { /* ... */ };
}

// Use it in component
import { useMyNewHook } from './hooks/hooks';
```

### Creating a New Component

```tsx
// components/MyNewComponent.tsx
export function MyNewComponent() {
  return <div>...</div>;
}

// components/index.ts
export { MyNewComponent } from './MyNewComponent';

// Use it
import { MyNewComponent } from './components';
```

## Testing

The new structure makes testing much easier:

```tsx
// Before: Hard to test animations
// Had to mount entire component

// After: Easy to test in isolation
import { animateZoomAndScroll } from './utils/animations';

test('animateZoomAndScroll completes animation', () => {
  const onComplete = jest.fn();
  // Test just the animation function
});
```

## Debugging

With the new structure, debugging is more straightforward:

1. **Animation issues?** → Check `utils/animations.ts`
2. **Selection not working?** → Check `utils/selection.ts`
3. **Filter problems?** → Check `components/FilterPanel.tsx` and `engine/`
4. **Layout issues?** → Check `engine/layout.ts`

## Performance

The modular structure hasn't changed performance characteristics:
- Same Web Worker architecture
- Same Pixi.js rendering
- Same columnar data storage
- Just better organized!

## Questions?

See:
- `README.md` - Architecture overview
- `REFACTORING_SUMMARY.md` - What changed
- Inline code comments - Implementation details
