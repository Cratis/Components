// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { OrderedItemField } from './OrderedItemField';
import type { OrderedItemFieldAccess } from './OrderedItemFieldAccess';
import type { OrderedItemOperation } from './OrderedItemOperation';

/**
 * What the host allows on the collection. The editor enforces it twice: a restricted control is not
 * offered, and a proposal for a restricted operation or field is never emitted. The host stays
 * responsible for authoritative permission checks, persistence and template resolution.
 */
export interface OrderedItemCapabilities {
    /** Whether items can be added. */
    add: boolean;

    /** Whether items can be removed. */
    remove: boolean;

    /** Whether items can be reordered. */
    reorder: boolean;

    /** Access to each field. A field that is left out is hidden. */
    fields: Partial<Record<OrderedItemField, OrderedItemFieldAccess>>;

    /** The most items the collection may hold. Adding is unavailable once it is reached. */
    maxItems?: number;

    /** Why an operation or field is restricted. Shown as text next to the restricted control. */
    reasons?: Partial<Record<OrderedItemOperation | OrderedItemField, string>>;
}
