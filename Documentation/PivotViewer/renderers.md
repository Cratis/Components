---
title: PivotViewer card and detail renderers
description: Use PivotViewer cardRenderer for identifying text and detailRenderer for React content, including forms and actions in the selected item's drawer.
---

PivotViewer uses `cardRenderer` for the text users scan across the collection and `detailRenderer` for the React content they open after selecting an item. Put enough information on each card to recognize it; keep longer explanations, forms, and actions in the detail drawer.

The examples on this page use the `Task` type from [Dimensions and filters](dimensions-and-filters.md#complete-example) and the `Product` type from the [overview](index.md#quick-start).

## Card Renderer

The card renderer returns structured text data, `{ title, labels?, values? }`, for both collection and grouped views. PivotViewer lays it out into each card, pairing the `labels` and `values` arrays by position. Return display strings, including any number or date formatting the reader needs.

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

For a task collection, show the status and assignment that distinguish one task from another:

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

The header uses the item's `name` property, falling back to `type` and then "Event". It does not use the card's `title`, so give your items a `name` property if that heading should identify them. Your content can call `onClose` when the user finishes a task.

Without a `detailRenderer`, the drawer lists the item's `type`, `occurred`, `service`, `environment`, `tenant`, `correlationId`, `causation`, and `content` properties when present. Supply your own renderer for item types that need different fields, as in the product example below.

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

This excerpt assumes an application-provided `updateTaskDescription` persistence call, such as an Arc command. The editor keeps the typed description in local state; saving does not update PivotViewer's `data` for you. Refresh or replace the changed item in `data` so cards and filters also use the saved value.

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

Use `title` for the identifying text and keep the label/value pairs short enough to scan. Matching array lengths keep the two columns aligned. Since `cardRenderer` runs as cards are drawn, prepare expensive derived values before rendering rather than recomputing them in the callback.

### Details

Organize the detail content around what users do after finding an item. Fetch related data in the returned React component when needed, and keep hooks in that component rather than in `detailRenderer` itself. Call `onClose` when an action completes the task.

The drawer is fixed at 380 pixels wide and overlays the right edge of the card area, so check your forms and long content on the narrowest supported screen. To understand how selection and closing fit the rest of the viewer, continue with [Interactions](interactions.md).
