// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useMemo, useRef } from 'react';
import type { FieldValue } from '../engine/types';
import type { PivotDimension, PivotFilter } from '../types';

export function useFieldExtractors<TItem extends object>(
    dimensions: PivotDimension<TItem>[],
    filters?: PivotFilter<TItem>[],
) {
    // Presentation callbacks can change without changing the engine's columns.
    // Preserve the extractor and index identities when only labels, formatters, or sorters change.
    const sources = [...dimensions, ...(filters ?? [])];
    const previousSources = useRef(sources);
    if (sources.length !== previousSources.current.length || sources.some((source, index) =>
        source.key !== previousSources.current[index].key || source.getValue !== previousSources.current[index].getValue
    )) {
        previousSources.current = sources;
    }
    const extractorSources = previousSources.current;

    const fieldExtractors = useMemo(() => {
        const extractors = new Map<string, (item: TItem) => FieldValue>();

        for (const source of extractorSources) {
            extractors.set(source.key, (item) => {
                const value = source.getValue(item);
                // Dates are numeric timestamps in the engine, retaining numeric-range bucketing.
                if (value instanceof Date) return value.getTime();
                if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined) {
                    return value;
                }
                return String(value);
            });
        }

        return extractors;
    }, [extractorSources]);

    const indexFields = useMemo(() => Array.from(new Set(extractorSources.map(source => source.key))), [extractorSources]);

    return { fieldExtractors, indexFields };
}
