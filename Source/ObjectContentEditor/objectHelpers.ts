// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Json } from '../types/JsonSchema';

/**
 * Retrieves the value at the specified path within a JSON data structure.
 * Returns null if the path cannot be followed.
 */
export function getValueAtPath(data: Json, path: string[]): Json | null {
    let current: Json = data;
    for (const segment of path) {
        if (current === null || current === undefined) return null;
        if (typeof current === 'object' && !Array.isArray(current) && current !== null) {
            current = (current as { [key: string]: Json })[segment];
        } else {
            return null;
        }
    }
    return current;
}
