---
title: PivotViewer renderers
description: Control the text on PivotViewer cards and the content of its detail drawer.
---

The examples on this page use the `Task` type from [Dimensions and filters](dimensions-and-filters.md#complete-example) and the `Product` type from the [overview](index.md#quick-start).

## Card Renderer

The card renderer determines how each item appears in the collection view. It returns structured text data — `{ title, labels?, values? }` — and `PivotViewer` lays it out into the card. The `labels` and `values` arrays are paired positionally.

Cards are drawn with Pixi, not as DOM elements, so a card can show only this text: no images, icons, per-card colors, or React content. Every card has the same fixed size (each card occupies a 200 × 176 pixel cell at 100% zoom), and a title or value that does not fit is shortened with an ellipsis.

### Basic Card

```typescript
const cardRenderer = (item: Product) => ({
    title: item.name,
    labels: ['Price'],
    values: [item.price.toFixed(2)],
});
```

### Rich Card Example

```typescript
const taskCardRenderer = (item: Task) => ({
    title: item.title,
    labels: ['Priority', 'Status', 'Assignee', 'Estimate'],
    values: [`P${item.priority}`, item.status, item.assignee, `${item.estimatedHours}h`],
});
```

## Detail Renderer

When a user selects a card, PivotViewer opens a drawer that slides in from the right over the card area. The drawer shell is component-owned: its header, heading, and close button. `detailRenderer` supplies only the content below the header:

```typescript
detailRenderer?: (item: TItem, onClose: () => void) => ReactNode;
```

- The header heading is the item's `name` property, then its `type` property, then the text "Event". Give your items a `name` property, or accept that heading.
- Call `onClose` from your content to close the drawer, for example after a successful save.
- Without a `detailRenderer`, the drawer shows a built-in fallback that lists the item's `type`, `occurred`, `service`, `environment`, `tenant`, `correlationId`, `causation`, and `content` properties when present. For most item types, supply your own renderer.

### Basic Details

```tsx
const detailRenderer = (item: Product) => (
    <dl>
        <dt>Category</dt>
        <dd>{item.category}</dd>
        <dt>Price</dt>
        <dd>{item.price.toFixed(2)}</dd>
    </dl>
);
```

### Comprehensive Details

```tsx
const taskDetailRenderer = (item: Task) => (
    <div className='task-details'>
        <p>{item.description}</p>
        <dl>
            <dt>Status</dt>
            <dd>{item.status}</dd>
            <dt>Assignee</dt>
            <dd>{item.assignee}</dd>
            <dt>Created</dt>
            <dd>{item.createdAt.toLocaleDateString()}</dd>
        </dl>
        <ul className='task-tags'>
            {item.tags.map((tag) => (
                <li key={tag}>{tag}</li>
            ))}
        </ul>
    </div>
);
```

`task-details` and `task-tags` are your own classes; Components ships no styles for them.

## Interactive Details

`detailRenderer` is called as a plain function, not rendered as a component, so it must not call hooks itself. Put interactive content in a component and return that component. Key it by the item so its state resets when the user selects a different card:

```tsx
import { useState } from 'react';

function TaskDescriptionEditor({ task, onClose }: { task: Task; onClose: () => void }) {
    const [editing, setEditing] = useState(false);
    const [description, setDescription] = useState(task.description);

    const save = async () => {
        await updateTaskDescription(task.id, description);
        setEditing(false);
    };

    return (
        <section>
            {editing ? (
                <>
                    <textarea
                        aria-label='Description'
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        rows={5}
                    />
                    <button type='button' onClick={save}>Save</button>
                    <button type='button' onClick={() => setEditing(false)}>Cancel</button>
                </>
            ) : (
                <>
                    <p>{description || 'No description'}</p>
                    <button type='button' onClick={() => setEditing(true)}>Edit</button>
                </>
            )}
            <button type='button' onClick={onClose}>Done</button>
        </section>
    );
}

const interactiveDetailRenderer = (item: Task, onClose: () => void) => (
    <TaskDescriptionEditor key={item.id} task={item} onClose={onClose} />
);
```

`updateTaskDescription` stands for your own persistence call, such as an Arc command. The drawer does not reflect the change until `data` contains the updated item.

## Conditional Rendering

Adapt the structured card data based on item properties:

```typescript
const adaptiveCardRenderer = (item: Task) => {
    const labels: string[] = ['Status'];
    const values: string[] = [item.status];

    if (item.priority >= 8) {
        labels.push('Priority');
        values.push('High');
    }

    return { title: item.title, labels, values };
};
```

## Best Practices

### Cards

1. **Keep cards compact**: every card has the same small fixed size, so show a title and a few label/value pairs
2. **Put the identifying text in `title`**: it is the most prominent line on the card
3. **Keep `labels` and `values` the same length**: they are paired by position
4. **Format values yourself**: return display strings such as `'12h'` or `'P3'`
5. **Keep it cheap**: `cardRenderer` runs for cards as they are drawn, so avoid expensive computation in it

### Details

1. **Show comprehensive info**: This is the place for all details
2. **Organize in sections**: Group related information
3. **Make it actionable**: Include relevant actions and buttons, and call `onClose` when an action finishes the task
4. **Load related data**: Fetch additional details in a component when it mounts
5. **Keep hooks in components**: never call hooks directly inside `detailRenderer`
6. **Consider narrow screens**: the drawer is a fixed 380 pixels wide and overlays the right edge of the card area
