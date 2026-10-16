// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Retains the positions of surviving schema keywords and appends new keywords. */
export function schemaInOriginalOrder(schema: Record<string, unknown>, order: readonly string[] = []): Record<string, unknown> {
    const names = new Set([...order, ...Object.keys(schema)]);
    return Object.fromEntries([...names].filter(name => Object.hasOwn(schema, name)).map(name => [name, schema[name]]));
}

/** Lists the names that remain in the order they had, followed by new names in their given order. */
export function requiredInOriginalOrder(required: readonly string[], order: readonly string[] = []): string[] {
    return [...order.filter(name => required.includes(name)), ...required.filter(name => !order.includes(name))];
}
