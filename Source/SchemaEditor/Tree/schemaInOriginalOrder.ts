// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Retains the positions of surviving schema keywords and appends new keywords. */
export function schemaInOriginalOrder(schema: Record<string, unknown>, order: readonly string[] = []): Record<string, unknown> {
    const names = new Set([...order, ...Object.keys(schema)]);
    return Object.fromEntries([...names].filter(name => Object.hasOwn(schema, name)).map(name => [name, schema[name]]));
}
