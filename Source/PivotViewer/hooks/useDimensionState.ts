// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useMemo, useState, useEffect, useCallback } from 'react';
import type { PivotDimension } from '../types';

export function useDimensionState<TItem extends object>(
    dimensions: PivotDimension<TItem>[],
    defaultDimensionKey?: string
) {
    const dimensionMap = useMemo(() => {
        const map = new Map<string, PivotDimension<TItem>>();
        dimensions.forEach((dimension) => map.set(dimension.key, dimension));
        return map;
    }, [dimensions]);

    const initialDimension = useMemo(() => {
        if (defaultDimensionKey && dimensionMap.has(defaultDimensionKey)) {
            return defaultDimensionKey;
        }
        return dimensions[0]?.key ?? '';
    }, [defaultDimensionKey, dimensionMap, dimensions]);

    const [activeDimensionKey, setActiveDimensionKey] = useState(initialDimension);
    const [dimensionFilter, setDimensionFilter] = useState<string | null>(null);

    useEffect(() => {
        setActiveDimensionKey((previous) => {
            if (previous && dimensionMap.has(previous)) {
                return previous;
            }
            return initialDimension;
        });
        setDimensionFilter(null);
    }, [dimensionMap, initialDimension]);

    const activeDimension = dimensionMap.get(activeDimensionKey) ?? dimensions[0];

    const handleAxisLabelClick = useCallback((groupKey: string) => {
        setDimensionFilter((prev) => (prev === groupKey ? null : groupKey));
    }, []);

    return {
        dimensionMap,
        activeDimensionKey,
        setActiveDimensionKey,
        activeDimension,
        dimensionFilter,
        handleAxisLabelClick,
    };
}
