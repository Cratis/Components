// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { KeyboardEvent } from 'react';
import type { OrderedItem } from './OrderedItem';
import type { OrderedItemRowProps } from './OrderedItemRowProps';
const joinClassNames = (...names: Array<string | undefined>) => names.filter(Boolean).join(' ');

const handleReorderKey = <TItem extends OrderedItem>(event: KeyboardEvent<HTMLButtonElement>, props: OrderedItemRowProps<TItem>) => {
    props.parts?.handle?.onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        props.onMove(props.item, event.key === 'ArrowUp' ? -1 : 1, 'handle');
    }
};

const renderHandle = <TItem extends OrderedItem>(props: OrderedItemRowProps<TItem>, itemName: string) => {
    const { item, parts, labels, onDragStart, onDragEnd } = props;
    return (
        <button
            {...parts?.handle}
            type='button'
            draggable
            aria-label={labels.handle(itemName)}
            aria-keyshortcuts='ArrowUp ArrowDown'
            onKeyDown={(event) => handleReorderKey(event, props)}
            onDragStart={(event) => onDragStart(item, event)}
            onDragEnd={onDragEnd}
            className={joinClassNames('cratis-ordered-item__button cratis-ordered-item__handle', parts?.handle?.className)}
            data-cratis-part='handle'
            data-control='handle'
        >
            <span aria-hidden='true'>⠿</span>
        </button>
    );
};

const renderMoveUp = <TItem extends OrderedItem>({ parts, labels, index, item, onMove }: OrderedItemRowProps<TItem>, itemName: string) => (
    <button
        {...parts?.moveUp}
        type='button'
        aria-label={labels.moveUp(itemName)}
        aria-disabled={index === 0 || undefined}
        onClick={() => onMove(item, -1, 'moveUp')}
        className={joinClassNames('cratis-ordered-item__button', parts?.moveUp?.className)}
        data-cratis-part='moveUp'
        data-control='moveUp'
    >
        <span aria-hidden='true'>↑</span>
    </button>
);

const renderMoveDown = <TItem extends OrderedItem>({ parts, labels, index, count, item, onMove }: OrderedItemRowProps<TItem>, itemName: string) => (
    <button
        {...parts?.moveDown}
        type='button'
        aria-label={labels.moveDown(itemName)}
        aria-disabled={index === count - 1 || undefined}
        onClick={() => onMove(item, 1, 'moveDown')}
        className={joinClassNames('cratis-ordered-item__button', parts?.moveDown?.className)}
        data-cratis-part='moveDown'
        data-control='moveDown'
    >
        <span aria-hidden='true'>↓</span>
    </button>
);

/** Renders directly so the handle and move buttons keep their existing React positions. */
export const renderOrderedItemReorder = <TItem extends OrderedItem>(props: OrderedItemRowProps<TItem>, itemName: string) => {
    if (props.locked || !props.capabilities.reorder) return null;
    return (
        <div className='cratis-ordered-item__reorder'>
            {renderHandle(props, itemName)}
            {renderMoveUp(props, itemName)}
            {renderMoveDown(props, itemName)}
        </div>
    );
};
