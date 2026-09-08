// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { isArrayIndexSegment } from '../ObjectNavigationalBar/breadcrumbHelpers';
import { Json } from '../types/JsonSchema';

/**
 * Retrieves the value at the specified path within a JSON data structure.
 * Object properties are addressed by name and array elements by their
 * zero-based index (e.g. `['causation', '0', 'properties']`).
 * Returns null if the path cannot be followed.
 */
export function getValueAtPath(data: Json, path: string[]): Json | null {
    let current: Json = data;
    for (const segment of path) {
        if (current === null || current === undefined) return null;
        if (Array.isArray(current)) {
            if (!isArrayIndexSegment(segment)) return null;
            const index = Number(segment);
            if (index >= current.length) return null;
            current = current[index];
        } else if (typeof current === 'object') {
            current = (current as { [key: string]: Json })[segment];
        } else {
            return null;
        }
    }
    return current ?? null;
}
