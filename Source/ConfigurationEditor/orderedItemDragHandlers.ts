// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Dispatch, DragEvent, SetStateAction } from 'react';
import type { OrderedItem } from './OrderedItem';
import { resolveOrderedItemDropIndex } from './resolveOrderedItemDropIndex';

export interface OrderedItemDragState {
    id: string;
    overId?: string;
    position?: 'before' | 'after';
}

type DragContext<TItem extends OrderedItem> = {
    items: ReadonlyArray<TItem>;
    reorder: boolean;
    drag: OrderedItemDragState | null;
    setDrag: Dispatch<SetStateAction<OrderedItemDragState | null>>;
    move: (item: TItem, toIndex: number, control: string) => void;
};

const dropPosition = (event: DragEvent<HTMLLIElement>) => {
    const rectangle = event.currentTarget.getBoundingClientRect();
    return event.clientY < rectangle.top + rectangle.height / 2 ? 'before' : 'after';
};

const dragOver = (current: OrderedItemDragState | null, itemId: string, position: 'before' | 'after') =>
    current && (current.overId !== itemId || current.position !== position)
        ? { ...current, overId: itemId, position }
        : current;

const startDrag = <TItem extends OrderedItem>({ reorder, setDrag }: DragContext<TItem>, item: TItem, event: DragEvent<HTMLButtonElement>) => {
    if (!reorder) {
        event.preventDefault();
        return;
    }
    event.dataTransfer.setData('application/x-cratis-ordered-item', item.id);
    event.dataTransfer.effectAllowed = 'move';
    const row = event.currentTarget.closest('li');
    if (row && typeof event.dataTransfer.setDragImage === 'function') event.dataTransfer.setDragImage(row, 0, 0);
    setDrag({ id: item.id });
};

/** Adapts native handle drags to the same validated move operation as buttons and keys. */
export const orderedItemDragHandlers = <TItem extends OrderedItem>(context: DragContext<TItem>) => {
    const { items, drag, setDrag, move } = context;
    const handleDragOver = (item: TItem, event: DragEvent<HTMLLIElement>) => {
        if (!drag) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        const position = dropPosition(event);
        setDrag((current) => dragOver(current, item.id, position));
    };
    const handleDrop = (item: TItem, event: DragEvent<HTMLLIElement>) => {
        if (!drag) return;
        event.preventDefault();
        const position = dropPosition(event);
        const fromIndex = items.findIndex((candidate) => candidate.id === drag.id);
        const overIndex = items.findIndex((candidate) => candidate.id === item.id);
        setDrag(null);
        if (fromIndex < 0 || overIndex < 0) return;
        move(items[fromIndex], resolveOrderedItemDropIndex(fromIndex, overIndex, position), 'handle');
    };
    return {
        handleDragStart: (item: TItem, event: DragEvent<HTMLButtonElement>) => startDrag(context, item, event),
        handleDragOver,
        handleDrop,
    };
};
