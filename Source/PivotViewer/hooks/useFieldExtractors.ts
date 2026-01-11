// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useMemo } from 'react';
import type { FieldValue } from '../engine/types';
import type { PivotDimension, PivotFilter } from '../types';

export function useFieldExtractors<TItem extends object>(
    dimensions: PivotDimension<TItem>[],
    filters?: PivotFilter<TItem>[],
) {
    const fieldExtractors = useMemo(() => {
        const extractors = new Map<string, (item: TItem) => FieldValue>();

        for (const dim of dimensions) {
            extractors.set(dim.key, (item) => {
                const val = dim.getValue(item);
                if (val instanceof Date) return val.getTime();
                if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean' || val === null) {
                    return val;
                }
                return String(val);
            });
        }

        if (filters) {
            for (const filter of filters) {
                extractors.set(filter.key, (item) => {
                    const val = filter.getValue(item);
                    if (val instanceof Date) return val.getTime();
                    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean' || val === null) {
                        return val;
                    }
                    return String(val);
                });
            }
        }

        return extractors;
    }, [dimensions, filters]);

    const indexFields = useMemo(() => {
        const fields = new Set<string>();

        for (const dim of dimensions) {
            fields.add(dim.key);
        }

        if (filters) {
            for (const filter of filters) {
                fields.add(filter.key);
            }
        }

        return Array.from(fields);
    }, [dimensions, filters]);

    return { fieldExtractors, indexFields };
}
