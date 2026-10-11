// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useState } from 'react';
import type { FilterSpec, FilterResult } from '../engine/types';
import { filterVisibleIdsBySearch } from '../utils/search';
import type { PivotViewerProps } from '../types';

/** Inputs for {@link useVisibleIds}. */
export interface UseVisibleIdsOptions<TItem extends object> {
    ready: boolean;
    data: TItem[];
    currentFilters: FilterSpec[];
    search: string;
    searchFields: PivotViewerProps<TItem>['searchFields'];
    engineApplyFilters: (filters: FilterSpec[]) => Promise<FilterResult>;
}

/** The full dataset's ids, used when the engine returns nothing while no filters are active. */
function allIds(count: number): Uint32Array {
    const ids = new Uint32Array(count);
    for (let i = 0; i < count; i++) {
        ids[i] = i;
    }
    return ids;
}

/**
 * Applies filters, then narrows the result by search - a post-filter step over the visible
 * Uint32 ids so it applies identically whether the engine result came from the worker or
 * its synchronous fallback.
 *
 * @param options - Engine, data, filters and search inputs.
 * @returns The ids currently visible.
 */
export function useVisibleIds<TItem extends object>({
    ready,
    data,
    currentFilters,
    search,
    searchFields,
    engineApplyFilters,
}: UseVisibleIdsOptions<TItem>): Uint32Array {
    const [visibleIds, setVisibleIds] = useState<Uint32Array>(new Uint32Array(0));

    useEffect(() => {
        if (!ready) return;

        let cancelled = false;
        void engineApplyFilters(currentFilters).then((result) => {
            if (cancelled) return;
            let ids = result.visibleIds;

            // If the engine failed to return any IDs while no filters are active,
            // fall back to showing the full dataset so the canvas never renders empty.
            if (ids.length === 0 && currentFilters.length === 0 && data.length > 0) {
                ids = allIds(data.length);
            }

            setVisibleIds(filterVisibleIdsBySearch(data, ids, search, searchFields));
        });
        return () => {
            cancelled = true;
        };
    }, [ready, currentFilters, engineApplyFilters, data, search, searchFields]);

    return visibleIds;
}
