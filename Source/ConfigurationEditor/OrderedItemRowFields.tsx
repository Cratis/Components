// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Dispatch, FocusEvent, KeyboardEvent, SetStateAction } from 'react';
import type { OrderedItem } from './OrderedItem';
import type { OrderedItemRowProps } from './OrderedItemRowProps';
import { OrderedItemIconField } from './OrderedItemIconField';
import { OrderedItemDestinationField } from './OrderedItemDestinationField';
import { resolveOrderedItemFieldAccess } from './resolveOrderedItemFieldAccess';

const joinClassNames = (...names: Array<string | undefined>) => names.filter(Boolean).join(' ');

type LabelDraft = { value: string | null; set: Dispatch<SetStateAction<string | null>> };
type RowFields<TItem extends OrderedItem> = OrderedItemRowProps<TItem> & { draft: LabelDraft; rowId: string; itemName: string };

const leaveLabel = <TItem extends OrderedItem>({ draft, onFieldBlur, item }: RowFields<TItem>) => {
    draft.set(null);
    onFieldBlur(item, 'label');
};

const handleLabelKey = <TItem extends OrderedItem>(event: KeyboardEvent<HTMLInputElement>, context: RowFields<TItem>) => {
    context.parts?.label?.onKeyDown?.(event);
    if (event.key === 'Escape' && context.draft.value !== null) {
        event.preventDefault();
        event.stopPropagation();
        leaveLabel(context);
    }
};

const handleLabelBlur = <TItem extends OrderedItem>(event: FocusEvent<HTMLInputElement>, context: RowFields<TItem>) => {
    context.parts?.label?.onBlur?.(event);
    leaveLabel(context);
};

const labelDescription = <TItem extends OrderedItem>({ validation, rowId }: RowFields<TItem>) => [
    validation?.label ? `${rowId}-label-message` : undefined,
    validation?.item ? `${rowId}-item-message` : undefined,
].filter(Boolean).join(' ');

const renderLabelInput = <TItem extends OrderedItem>(context: RowFields<TItem>) => {
    const { item, labels, parts, onField, draft } = context;
    const describedBy = labelDescription(context);
    const invalid = context.validation?.label ? true : undefined;
    return (
        <input
            {...parts?.label}
            type='text'
            value={draft.value ?? item.label}
            aria-label={labels.labelField}
            aria-invalid={invalid}
            aria-describedby={describedBy.length > 0 ? describedBy : undefined}
            onChange={(event) => {
                draft.set(event.target.value);
                onField(item, 'label', event.target.value);
            }}
            onBlur={(event) => handleLabelBlur(event, context)}
            onKeyDown={(event) => handleLabelKey(event, context)}
            className={joinClassNames('cratis-ordered-item__input', parts?.label?.className)}
            data-cratis-part='label'
            data-control='label'
            data-invalid={context.validation?.label ? true : undefined}
        />
    );
};

const renderEditableLabel = <TItem extends OrderedItem>(context: RowFields<TItem>) => {
    if (resolveOrderedItemFieldAccess(context.capabilities, 'label') !== 'editable' || context.locked) return null;
    return renderLabelInput(context);
};

const canReadLabel = <TItem extends OrderedItem>({ capabilities, locked }: RowFields<TItem>) => {
    const access = resolveOrderedItemFieldAccess(capabilities, 'label');
    return access === 'readonly' || (access === 'editable' && locked);
};

const renderReadonlyLabel = <TItem extends OrderedItem>(context: RowFields<TItem>) => {
    if (!canReadLabel(context)) return null;
    return (
        <span className='cratis-ordered-item__text' data-control='label'>
            <span className='cratis-ordered-item__hidden'>{context.labels.labelField}: </span>
            {context.item.label}
        </span>
    );
};

const renderLabelMessage = <TItem extends OrderedItem>({ validation, parts, rowId }: RowFields<TItem>) => {
    if (!validation?.label) return null;
    return (
        <p {...parts?.message} id={`${rowId}-label-message`} role='alert' className={joinClassNames('cratis-ordered-item__message', parts?.message?.className)} data-cratis-part='message' data-invalid>
            {validation.label}
        </p>
    );
};

const renderIcon = <TItem extends OrderedItem>(context: RowFields<TItem>) => {
    const { capabilities, locked, item, labels, validation, parts, iconCatalog, allowedIcons, iconPickerLabels, renderIconField, isIconAvailable, onField, itemName, rowId } = context;
    const access = resolveOrderedItemFieldAccess(capabilities, 'icon');
    if (access === 'hidden') return null;
    return (
        <OrderedItemIconField
            item={item}
            editable={access === 'editable' && !locked}
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
            onChange={(value) => onField(item, 'icon', value)}
        />
    );
};

const renderDestination = <TItem extends OrderedItem>({ capabilities, locked, item, labels, validation, parts, destinations, onField, rowId, itemName }: RowFields<TItem>) => {
    const access = resolveOrderedItemFieldAccess(capabilities, 'destination');
    if (access === 'hidden') return null;
    return (
        <OrderedItemDestinationField
            item={item}
            editable={access === 'editable' && !locked}
            itemName={itemName}
            labels={labels}
            destinations={destinations}
            message={validation?.destination}
            messageId={`${rowId}-destination-message`}
            parts={parts}
            onChange={(value) => onField(item, 'destination', value)}
        />
    );
};

const renderItemMessage = <TItem extends OrderedItem>({ validation, parts, rowId }: RowFields<TItem>) => {
    if (!validation?.item) return null;
    return (
        <p {...parts?.message} id={`${rowId}-item-message`} role='alert' className={joinClassNames('cratis-ordered-item__message', parts?.message?.className)} data-cratis-part='message' data-invalid>
            {validation.item}
        </p>
    );
};

/** Keeps each field in its original child slot, without adding component boundaries. */
export const renderOrderedItemFields = <TItem extends OrderedItem>(context: RowFields<TItem>) => (
    <div className='cratis-ordered-item__fields'>
        {renderEditableLabel(context)}
        {renderReadonlyLabel(context)}
        {renderLabelMessage(context)}
        {renderIcon(context)}
        {renderDestination(context)}
        {renderItemMessage(context)}
    </div>
);
