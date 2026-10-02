// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { OrderedItem } from './OrderedItem';
import type { OrderedItemCapabilities } from './OrderedItemCapabilities';
import type { OrderedItemLabels } from './OrderedItemLabels';
import type { OrderedItemValidation } from './OrderedItemValidation';
import { resolveOrderedItemFieldAccess } from './resolveOrderedItemFieldAccess';

/**
 * Validates an item as it would be after a change: first the rules the editor owns, then the host's.
 * The result is empty when the item is valid.
 *
 * @param item The item as it would be.
 * @param items The collection as it would be.
 * @param capabilities What the host allows.
 * @param labels The strings to report with.
 * @param validate The host's rules, if any.
 */
export const validateOrderedItem = <TItem extends OrderedItem>(
    item: TItem,
    items: ReadonlyArray<TItem>,
    capabilities: OrderedItemCapabilities,
    labels: Required<OrderedItemLabels>,
    validate?: (item: TItem, items: ReadonlyArray<TItem>) => OrderedItemValidation | undefined,
): OrderedItemValidation => {
    const messages: OrderedItemValidation = {};
    if (resolveOrderedItemFieldAccess(capabilities, 'label') === 'editable' && item.label.trim().length === 0) {
        messages.label = labels.labelRequired;
    }
    const supplied = validate?.(item, items);
    if (supplied) {
        for (const [key, message] of Object.entries(supplied)) {
            if (typeof message === 'string' && message.length > 0 && messages[key as keyof OrderedItemValidation] === undefined) {
                messages[key as keyof OrderedItemValidation] = message;
            }
        }
    }
    return messages;
};

/** Whether a validation result holds any message. */
export const hasOrderedItemValidation = (validation: OrderedItemValidation | undefined): boolean =>
    validation !== undefined && Object.values(validation).some((message) => typeof message === 'string' && message.length > 0);
