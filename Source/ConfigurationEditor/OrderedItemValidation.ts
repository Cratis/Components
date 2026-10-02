// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { OrderedItemField } from './OrderedItemField';

/**
 * Validation messages for one item, by field. The `item` key holds a message about the item as a
 * whole. A field without a message is valid.
 */
export type OrderedItemValidation = Partial<Record<OrderedItemField | 'item', string>>;
