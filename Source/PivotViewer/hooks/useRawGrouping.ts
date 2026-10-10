// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useState } from 'react';
import type { GroupSpec, GroupingResult } from '../engine/types';
import type { ViewMode } from '../components/Toolbar';

/** Inputs for {@link useRawGrouping}. */
export interface UseRawGroupingOptions {
    ready: boolean;
    visibleIds: Uint32Array;
    currentGroupBy: GroupSpec;
    viewMode: ViewMode;
    activeDimensionKey: string | null;
    computeGrouping: (visibleIds: Uint32Array, groupBy: GroupSpec) => Promise<GroupingResult>;
    sortIds: (visibleIds: Uint32Array, sortBy: string) => Promise<Uint32Array>;
}

/** The single "all items" group shown in collection mode. */
function singleGroup(ids: Uint32Array): GroupingResult {
    return {
        groups: [
            {
                key: 'all',
                label: 'All Items',
                value: 'all',
                ids,
                count: ids.length,
            },
        ],
    };
}

/**
 * Computes the (unpresented) grouping of the visible ids. Every async branch ignores a result
 * after its dependencies change, so an older worker response can never overwrite a newer
 * filter/search/view selection.
 *
 * @param options - Engine, view mode and visible ids.
 * @returns The raw grouping result.
 */
export function useRawGrouping({
    ready,
    visibleIds,
    currentGroupBy,
    viewMode,
    activeDimensionKey,
    computeGrouping,
    sortIds,
}: UseRawGroupingOptions): GroupingResult {
    const [rawGrouping, setRawGrouping] = useState<GroupingResult>({ groups: [] });

    useEffect(() => {
        if (!ready || visibleIds.length === 0) {
            setRawGrouping({ groups: [] });
            return;
        }

        let cancelled = false;
        if (viewMode !== 'collection') {
            void computeGrouping(visibleIds, currentGroupBy).then((result) => {
                if (!cancelled) setRawGrouping(result);
            });
        } else if (activeDimensionKey) {
            // In collection mode, create a single group with all items.
            void sortIds(visibleIds, activeDimensionKey).then((sortedIds) => {
                if (cancelled) return;
                setRawGrouping(singleGroup(sortedIds));
            });
        } else {
            setRawGrouping(singleGroup(visibleIds));
        }

        return () => {
            cancelled = true;
        };
    }, [
        ready,
        visibleIds,
        currentGroupBy,
        viewMode,
        computeGrouping,
        sortIds,
        activeDimensionKey,
    ]);

    return rawGrouping;
}
