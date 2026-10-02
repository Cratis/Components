// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { defaultOrderedItemLabels } from './defaultOrderedItemLabels';
import type { OrderedItemLabels } from './OrderedItemLabels';

/** Merges the host's labels over the English defaults, ignoring any that are `undefined`. */
export const resolveOrderedItemLabels = (labels: OrderedItemLabels | undefined): Required<OrderedItemLabels> => {
    const resolved: Record<string, unknown> = { ...defaultOrderedItemLabels };
    for (const [key, value] of Object.entries(labels ?? {})) {
        if (value !== undefined) resolved[key] = value;
    }
    return resolved as unknown as Required<OrderedItemLabels>;
};
