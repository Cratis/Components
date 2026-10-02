// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { OrderedItemCapabilities } from './OrderedItemCapabilities';
import type { OrderedItemField } from './OrderedItemField';
import type { OrderedItemFieldAccess } from './OrderedItemFieldAccess';

/** Resolves a field's access; a field the host leaves out is hidden. */
export const resolveOrderedItemFieldAccess = (
    capabilities: OrderedItemCapabilities,
    field: OrderedItemField,
): OrderedItemFieldAccess => capabilities.fields[field] ?? 'hidden';
