// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Dispatch, SetStateAction } from 'react';
import { isIconPickerAllowed } from '../IconPicker/isIconPickerAllowed';
import type { ConfigurationIconReference } from './ConfigurationIconReference';
import type { OrderedItem } from './OrderedItem';
import type { OrderedItemEditorProps } from './OrderedItemEditor';
import type { OrderedItemField } from './OrderedItemField';
import type { OrderedItemLabels } from './OrderedItemLabels';
import type { OrderedItemValidation } from './OrderedItemValidation';
import { resolveOrderedItemFieldAccess } from './resolveOrderedItemFieldAccess';
import { hasOrderedItemValidation, validateOrderedItem } from './validateOrderedItem';

type FieldValue = string | ConfigurationIconReference | undefined;
type FieldContext<TItem extends OrderedItem> = Pick<OrderedItemEditorProps<TItem>, 'items' | 'capabilities' | 'allowedIcons' | 'iconCatalog' | 'validate' | 'onChange'> & {
    labels: Required<OrderedItemLabels>;
    setLocalValidation: Dispatch<SetStateAction<Record<string, OrderedItemValidation>>>;
};

const matchesIcon = (left: ConfigurationIconReference, right: ConfigurationIconReference) =>
    left.library === right.library && left.key === right.key && left.variant === right.variant;

const sameIcon = (left: ConfigurationIconReference | undefined, right: ConfigurationIconReference | undefined) =>
    left === right || (left !== undefined && right !== undefined && matchesIcon(left, right));

const withField = <TItem extends OrderedItem>(item: TItem, field: OrderedItemField, value: FieldValue): TItem => {
    const next = { ...item, [field]: value };
    if (value === undefined) delete (next as Record<string, unknown>)[field];
    return next;
};

const iconAllowed = <TItem extends OrderedItem>({ allowedIcons, iconCatalog }: FieldContext<TItem>, value: FieldValue) => {
    if (allowedIcons === undefined || iconCatalog === undefined || value === undefined) return true;
    const entry = iconCatalog.icons.find((candidate) => matchesIcon(candidate, value as ConfigurationIconReference));
    return entry === undefined || isIconPickerAllowed(entry, allowedIcons);
};

const canEdit = <TItem extends OrderedItem>(context: FieldContext<TItem>, field: OrderedItemField, value: FieldValue) => {
    if (resolveOrderedItemFieldAccess(context.capabilities, field) !== 'editable') return false;
    return field !== 'icon' || iconAllowed(context, value);
};

const unchangedField = (previous: OrderedItem, field: OrderedItemField, value: FieldValue) => field === 'icon'
    ? sameIcon(previous.icon, value as ConfigurationIconReference | undefined)
    : previous[field] === value;

const clearValidation = (current: Record<string, OrderedItemValidation>, itemId: string) => {
    if (!(itemId in current)) return current;
    const { [itemId]: _cleared, ...rest } = current;
    return rest;
};

/** Builds field callbacks without introducing hooks or changing the editor's state order. */
export const orderedItemFieldHandlers = <TItem extends OrderedItem>(context: FieldContext<TItem>) => {
    const { items, capabilities, labels, validate, onChange, setLocalValidation } = context;
    const handleFieldBlur = (item: TItem) => {
        setLocalValidation((current) => clearValidation(current, item.id));
    };
    const handleField = (item: TItem, field: OrderedItemField, value: FieldValue) => {
        if (!canEdit(context, field, value)) return;
        const index = items.findIndex((candidate) => candidate.id === item.id);
        if (index < 0) return;
        const previous = items[index];
        if (unchangedField(previous, field, value)) return;
        const next = withField(previous, field, value);
        const nextItems = items.map((candidate, position) => (position === index ? next : candidate));
        const messages = validateOrderedItem(next, nextItems, capabilities, labels, validate);
        if (hasOrderedItemValidation(messages)) {
            setLocalValidation((current) => ({ ...current, [item.id]: messages }));
            return;
        }
        handleFieldBlur(item);
        onChange({ kind: 'update', item: next, previous, field, items: nextItems });
    };
    return { handleField, handleFieldBlur };
};
