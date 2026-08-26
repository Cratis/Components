// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { PropertyAccessor } from '../types';
import { getPropertyPath, getValueByPath } from '../types';

/**
 * Narrows a set of visible item ids (array indices into `data`, matching the engine's internal
 * id space) down to those matching a free-text search term across `searchFields`.
 *
 * This is a post-filter step over already-filtered ids, so it composes identically whether
 * `visibleIds` came from the worker or the synchronous fallback path. Per the documented
 * `searchFields` contract, there is no default set of searched fields: when `searchFields` is
 * omitted or empty, search remains a no-op and `visibleIds` is returned unchanged.
 */
export function filterVisibleIdsBySearch<TItem extends object>(
    data: TItem[],
    visibleIds: Uint32Array,
    searchTerm: string,
    searchFields?: PropertyAccessor<TItem>[],
): Uint32Array {
    const term = searchTerm.trim().toLowerCase();
    if (!term || !searchFields || searchFields.length === 0) {
        return visibleIds;
    }

    const matches: number[] = [];
    for (let i = 0; i < visibleIds.length; i++) {
        const id = visibleIds[i];
        const item = data[id];
        if (item !== undefined && matchesSearchFields(item, term, searchFields)) {
            matches.push(id);
        }
    }

    return new Uint32Array(matches);
}

function matchesSearchFields<TItem extends object>(
    item: TItem,
    term: string,
    searchFields: PropertyAccessor<TItem>[],
): boolean {
    for (const accessor of searchFields) {
        const propertyPath = getPropertyPath(accessor);
        const value = getValueByPath(item, propertyPath);
        if (value !== undefined && String(value).toLowerCase().indexOf(term) !== -1) {
            return true;
        }
    }

    return false;
}
