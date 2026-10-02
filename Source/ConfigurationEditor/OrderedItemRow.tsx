// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useState, type KeyboardEvent } from 'react';
import type { OrderedItem } from './OrderedItem';
import { resolveOrderedItemFieldAccess } from './resolveOrderedItemFieldAccess';
import type { OrderedItemRowProps } from './OrderedItemRowProps';
import { OrderedItemIconField } from './OrderedItemIconField';
import { OrderedItemDestinationField } from './OrderedItemDestinationField';

const joinClassNames = (...names: Array<string | undefined>) => names.filter(Boolean).join(' ');

/** One item of an {@link OrderedItemEditor}, either editable or locked. */
export const OrderedItemRow = <TItem extends OrderedItem>({
    item,
    index,
    count,
    locked,
    capabilities,
    labels,
    destinations,
    validation,
    baseId,
    parts,
    renderIconField,
    isIconAvailable,
    iconCatalog,
    allowedIcons,
    iconPickerLabels,
    dragging,
    dropPosition,
    onField,
    onFieldBlur,
    onMove,
    onRemove,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
}: OrderedItemRowProps<TItem>) => {
    const [labelDraft, setLabelDraft] = useState<string | null>(null);
    const rowId = `${baseId}-${item.id.replace(/[^A-Za-z0-9_-]/gu, '_')}`;
    const itemName = item.label.trim().length > 0 ? item.label : labels.untitled;
    const labelAccess = resolveOrderedItemFieldAccess(capabilities, 'label');
    const iconAccess = resolveOrderedItemFieldAccess(capabilities, 'icon');
    const destinationAccess = resolveOrderedItemFieldAccess(capabilities, 'destination');
    const canReorder = !locked && capabilities.reorder;
    const canRemove = !locked && capabilities.remove;
    const labelMessage = validation?.label;
    const itemMessage = validation?.item;
    const labelMessageId = `${rowId}-label-message`;
    const itemMessageId = `${rowId}-item-message`;
    const labelDescribedBy = [labelMessage ? labelMessageId : undefined, itemMessage ? itemMessageId : undefined]
        .filter(Boolean)
        .join(' ');

    useEffect(() => {
        setLabelDraft(null);
    }, [item.label]);

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        parts?.handle?.onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            onMove(item, -1, 'handle');
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            onMove(item, 1, 'handle');
        }
    };

    return (
        <li
            {...parts?.item}
            id={rowId}
            tabIndex={-1}
            className={joinClassNames('cratis-ordered-item', parts?.item?.className)}
            onDragOver={canReorder ? (event) => onDragOver(item, event) : undefined}
            onDrop={canReorder ? (event) => onDrop(item, event) : undefined}
            data-cratis-part='item'
            data-item-id={item.id}
            data-locked={locked || undefined}
            data-dragging={dragging || undefined}
            data-drop-position={dropPosition}
        >
            {canReorder && (
                <div className='cratis-ordered-item__reorder'>
                    <button
                        {...parts?.handle}
                        type='button'
                        draggable
                        aria-label={labels.handle(itemName)}
                        aria-keyshortcuts='ArrowUp ArrowDown'
                        onKeyDown={handleKeyDown}
                        onDragStart={(event) => onDragStart(item, event)}
                        onDragEnd={onDragEnd}
                        className={joinClassNames('cratis-ordered-item__button cratis-ordered-item__handle', parts?.handle?.className)}
                        data-cratis-part='handle'
                        data-control='handle'
                    >
                        <span aria-hidden='true'>⠿</span>
                    </button>
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
                </div>
            )}
            <div className='cratis-ordered-item__fields'>
                {labelAccess === 'editable' && !locked && (
                    <input
                        {...parts?.label}
                        type='text'
                        value={labelDraft ?? item.label}
                        aria-label={labels.labelField}
                        aria-invalid={labelMessage ? true : undefined}
                        aria-describedby={labelDescribedBy.length > 0 ? labelDescribedBy : undefined}
                        onChange={(event) => {
                            setLabelDraft(event.target.value);
                            onField(item, 'label', event.target.value);
                        }}
                        onBlur={(event) => {
                            parts?.label?.onBlur?.(event);
                            setLabelDraft(null);
                            onFieldBlur(item, 'label');
                        }}
                        onKeyDown={(event) => {
                            parts?.label?.onKeyDown?.(event);
                            if (event.key === 'Escape' && labelDraft !== null) {
                                event.preventDefault();
                                event.stopPropagation();
                                setLabelDraft(null);
                                onFieldBlur(item, 'label');
                            }
                        }}
                        className={joinClassNames('cratis-ordered-item__input', parts?.label?.className)}
                        data-cratis-part='label'
                        data-control='label'
                        data-invalid={labelMessage ? true : undefined}
                    />
                )}
                {(labelAccess === 'readonly' || (labelAccess === 'editable' && locked)) && (
                    <span className='cratis-ordered-item__text' data-control='label'>
                        <span className='cratis-ordered-item__hidden'>{labels.labelField}: </span>
                        {item.label}
                    </span>
                )}
                {labelMessage && (
                    <p {...parts?.message} id={labelMessageId} role='alert' className={joinClassNames('cratis-ordered-item__message', parts?.message?.className)} data-cratis-part='message' data-invalid>
                        {labelMessage}
                    </p>
                )}
                {iconAccess !== 'hidden' && (
                    <OrderedItemIconField
                        item={item}
                        editable={iconAccess === 'editable' && !locked}
                        itemName={itemName}
                        labels={labels}
                        message={validation?.icon}
                        messageId={`${rowId}-icon-message`}
                        parts={parts}
                        renderIconField={renderIconField}
                        isIconAvailable={isIconAvailable}
                        iconCatalog={iconCatalog}
                        allowedIcons={allowedIcons}
                        iconPickerLabels={iconPickerLabels}
                        onChange={(icon) => onField(item, 'icon', icon)}
                    />
                )}
                {destinationAccess !== 'hidden' && (
                    <OrderedItemDestinationField
                        item={item}
                        editable={destinationAccess === 'editable' && !locked}
                        itemName={itemName}
                        labels={labels}
                        destinations={destinations}
                        message={validation?.destination}
                        messageId={`${rowId}-destination-message`}
                        parts={parts}
                        onChange={(destination) => onField(item, 'destination', destination)}
                    />
                )}
                {itemMessage && (
                    <p {...parts?.message} id={itemMessageId} role='alert' className={joinClassNames('cratis-ordered-item__message', parts?.message?.className)} data-cratis-part='message' data-invalid>
                        {itemMessage}
                    </p>
                )}
            </div>
            {locked && (
                <span {...parts?.state} className={joinClassNames('cratis-ordered-item__state', parts?.state?.className)} data-cratis-part='state'>
                    {labels.locked}
                </span>
            )}
            {canRemove && (
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
            )}
        </li>
    );
};
