// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useState } from 'react';
import type { OrderedItem } from './OrderedItem';
import type { OrderedItemRowProps } from './OrderedItemRowProps';
import { renderOrderedItemReorder } from './OrderedItemRowControls';
import { renderOrderedItemFields } from './OrderedItemRowFields';

const joinClassNames = (...names: Array<string | undefined>) => names.filter(Boolean).join(' ');

const renderLockedState = <TItem extends OrderedItem>({ locked, parts, labels }: OrderedItemRowProps<TItem>) => {
    if (!locked) return null;
    return (
        <span {...parts?.state} className={joinClassNames('cratis-ordered-item__state', parts?.state?.className)} data-cratis-part='state'>
            {labels.locked}
        </span>
    );
};

const renderRemove = <TItem extends OrderedItem>({ locked, capabilities, parts, labels, item, onRemove }: OrderedItemRowProps<TItem>, itemName: string) => {
    if (locked || !capabilities.remove) return null;
    return (
        <button
            {...parts?.remove}
            type='button'
            aria-label={labels.remove(itemName)}
            onClick={() => onRemove(item)}
            className={joinClassNames('cratis-ordered-item__button cratis-ordered-item__remove', parts?.remove?.className)}
            data-cratis-part='remove'
            data-control='remove'
        >
            <span aria-hidden='true'>×</span>
        </button>
    );
};

const rowState = <TItem extends OrderedItem>({ locked, dragging, dropPosition }: OrderedItemRowProps<TItem>) => ({
    'data-locked': locked || undefined,
    'data-dragging': dragging || undefined,
    'data-drop-position': dropPosition,
});

const rowDropHandlers = <TItem extends OrderedItem>({ locked, capabilities, item, onDragOver, onDrop }: OrderedItemRowProps<TItem>) => {
    const canReorder = !locked && capabilities.reorder;
    return {
        onDragOver: canReorder ? (event: Parameters<typeof onDragOver>[1]) => onDragOver(item, event) : undefined,
        onDrop: canReorder ? (event: Parameters<typeof onDrop>[1]) => onDrop(item, event) : undefined,
    };
};

/** One item of an {@link OrderedItemEditor}, either editable or locked. */
export const OrderedItemRow = <TItem extends OrderedItem>(props: OrderedItemRowProps<TItem>) => {
    const { item, labels, baseId, parts } = props;
    const [labelDraft, setLabelDraft] = useState<string | null>(null);
    const rowId = `${baseId}-${item.id.replace(/[^A-Za-z0-9_-]/gu, '_')}`;
    const itemName = item.label.trim().length > 0 ? item.label : labels.untitled;

    useEffect(() => {
        setLabelDraft(null);
    }, [item.label]);

    return (
        <li
            {...parts?.item}
            id={rowId}
            tabIndex={-1}
            className={joinClassNames('cratis-ordered-item', parts?.item?.className)}
            {...rowDropHandlers(props)}
            data-cratis-part='item'
            data-item-id={item.id}
            {...rowState(props)}
        >
            {renderOrderedItemReorder(props, itemName)}
            {renderOrderedItemFields({ ...props, draft: { value: labelDraft, set: setLabelDraft }, rowId, itemName })}
            {renderLockedState(props)}
            {renderRemove(props, itemName)}
        </li>
    );
};
