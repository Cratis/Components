// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { OrderedItem } from './OrderedItem';
import type { OrderedItemEditorProps } from './OrderedItemEditor';
import type { OrderedItemCapabilities } from './OrderedItemCapabilities';
import type { OrderedItemValidation } from './OrderedItemValidation';
import { moveOrderedItem } from './moveOrderedItem';
import { resolveOrderedItemFieldAccess } from './resolveOrderedItemFieldAccess';
import { resolveOrderedItemLabels } from './resolveOrderedItemLabels';
import { restoreOrderedItemFocus, type PendingOrderedItemFocus } from './restoreOrderedItemFocus';
import { orderedItemFieldHandlers } from './orderedItemFieldHandlers';
import { orderedItemDragHandlers, type OrderedItemDragState } from './orderedItemDragHandlers';

type OperationContext<TItem extends OrderedItem> = Pick<OrderedItemEditorProps<TItem>, 'items' | 'capabilities' | 'onChange' | 'createItem'> & {
    pending: RefObject<PendingOrderedItemFocus | null>;
    canAdd: boolean;
};

const canAddItem = <TItem extends OrderedItem>({ capabilities, createItem, items }: OrderedItemEditorProps<TItem>) =>
    capabilities.add && createItem !== undefined && (capabilities.maxItems === undefined || items.length < capabilities.maxItems);

const atMaximumItems = <TItem extends OrderedItem>({ capabilities, items }: OrderedItemEditorProps<TItem>) =>
    capabilities.add && capabilities.maxItems !== undefined && items.length >= capabilities.maxItems;

const restrictionReason = (capabilities: OrderedItemCapabilities, key: keyof NonNullable<OrderedItemCapabilities['reasons']>, allowed: boolean) =>
    !allowed && capabilities.reasons?.[key] ? [capabilities.reasons[key] as string] : [];

const restrictionsFor = (capabilities: OrderedItemCapabilities) => (
    [
        ['add', capabilities.add],
        ['remove', capabilities.remove],
        ['reorder', capabilities.reorder],
        ['label', resolveOrderedItemFieldAccess(capabilities, 'label') === 'editable'],
        ['icon', resolveOrderedItemFieldAccess(capabilities, 'icon') === 'editable'],
        ['destination', resolveOrderedItemFieldAccess(capabilities, 'destination') === 'editable'],
    ] as const
).flatMap(([key, allowed]) => restrictionReason(capabilities, key, allowed));

const invalidMove = (fromIndex: number, toIndex: number, count: number) =>
    fromIndex < 0 || toIndex < 0 || toIndex >= count || toIndex === fromIndex;

type MoveContext<TItem extends OrderedItem> = Pick<OperationContext<TItem>, 'items' | 'pending' | 'onChange'> & { reorder: boolean };

const moveItem = <TItem extends OrderedItem>({ items, reorder, pending, onChange }: MoveContext<TItem>, item: TItem, toIndex: number, control: string) => {
    if (!reorder) return;
    const fromIndex = items.findIndex((candidate) => candidate.id === item.id);
    if (invalidMove(fromIndex, toIndex, items.length)) return;
    pending.current = { itemId: item.id, control, announce: true };
    onChange({ kind: 'move', item: items[fromIndex], fromIndex, toIndex, items: moveOrderedItem(items, fromIndex, toIndex) });
};

const removeItem = <TItem extends OrderedItem>({ items, capabilities, pending, onChange }: OperationContext<TItem>, item: TItem) => {
    if (!capabilities.remove) return;
    const index = items.findIndex((candidate) => candidate.id === item.id);
    if (index < 0) return;
    const neighbor = items[index + 1] ?? items[index - 1];
    pending.current = neighbor
        ? { itemId: neighbor.id, control: 'remove', announce: false }
        : { itemId: undefined, control: 'add', announce: false };
    onChange({ kind: 'remove', item: items[index], index, items: items.filter((_, position) => position !== index) });
};

const addItem = <TItem extends OrderedItem>({ canAdd, createItem, pending, onChange, items }: OperationContext<TItem>) => {
    if (!canAdd || !createItem) return;
    const item = createItem();
    pending.current = { itemId: item.id, control: 'label', announce: false };
    onChange({ kind: 'add', item, index: items.length, items: [...items, item] });
};

/** Owns the editor's existing hooks in their original order, independent of its render helpers. */
export const useOrderedItemEditor = <TItem extends OrderedItem>(props: OrderedItemEditorProps<TItem>) => {
    const { items, capabilities, onChange, labels: suppliedLabels, fixedItems = [], destinations = [] } = props;
    const labels = useMemo(() => resolveOrderedItemLabels(suppliedLabels), [suppliedLabels]);
    const baseId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const pending = useRef<PendingOrderedItemFocus | null>(null);
    const restoring = useRef(false);
    const [localValidation, setLocalValidation] = useState<Record<string, OrderedItemValidation>>({});
    const [drag, setDrag] = useState<OrderedItemDragState | null>(null);
    const [announcement, setAnnouncement] = useState('');
    const canAdd = canAddItem(props);
    const atMaximum = atMaximumItems(props);
    const operations = { ...props, pending, canAdd };

    useLayoutEffect(() => {
        restoreOrderedItemFocus({ rootRef, pending, restoring, items, labels, setAnnouncement });
    });

    const move = useCallback((item: TItem, toIndex: number, control: string) => {
        moveItem({ items, reorder: capabilities.reorder, pending, onChange }, item, toIndex, control);
    }, [capabilities.reorder, items, onChange]);

    const handleMove = (item: TItem, delta: -1 | 1, control: string) => {
        const index = items.findIndex((candidate) => candidate.id === item.id);
        if (index >= 0) move(item, index + delta, control);
    };
    const fields = orderedItemFieldHandlers({ ...props, labels, setLocalValidation });
    const dragging = orderedItemDragHandlers({ items, reorder: capabilities.reorder, drag, setDrag, move });

    return {
        ...props, fixedItems, destinations,
        labels, baseId, rootRef, pending, restoring, localValidation, drag, setDrag, announcement,
        canAdd, atMaximum, restrictions: restrictionsFor(capabilities),
        handleMove, handleRemove: (item: TItem) => removeItem(operations, item), handleAdd: () => addItem(operations),
        ...fields, ...dragging,
    };
};

/** Internal state and callbacks, not a published component contract. */
export type OrderedItemEditorState<TItem extends OrderedItem> = ReturnType<typeof useOrderedItemEditor<TItem>>;
