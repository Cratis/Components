// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Property } from './Property';

/**
 * Finds a property anywhere in the tree by its id.
 * @param properties The root properties to search.
 * @param id The id of the property.
 * @returns The property, or `undefined` when no property has the id.
 */
export function findPropertyById(properties: Property[], id: string): Property | undefined {
    for (const property of properties) {
        if (property.id === id) return property;
        const found = property.children ? findPropertyById(property.children, id) : undefined;
        if (found) return found;
    }
    return undefined;
}

/**
 * Finds the first property with a name, searching depth first. Names are only unique among siblings, so this
 * is for callers that key by name — for example to rebind state saved by name to the freshly generated ids.
 * @param properties The root properties to search.
 * @param name The name of the property.
 * @returns The property, or `undefined` when no property has the name.
 */
export function findPropertyByName(properties: Property[], name: string): Property | undefined {
    for (const property of properties) {
        if (property.name === name) return property;
        const found = property.children ? findPropertyByName(property.children, name) : undefined;
        if (found) return found;
    }
    return undefined;
}

/**
 * Finds the properties that share a parent with a property, including the property itself.
 * @param properties The root properties to search.
 * @param id The id of the property.
 * @returns The sibling group, or `undefined` when no property has the id.
 */
export function findSiblingProperties(properties: Property[], id: string): Property[] | undefined {
    if (properties.some(property => property.id === id)) return properties;
    for (const property of properties) {
        const found = property.children ? findSiblingProperties(property.children, id) : undefined;
        if (found) return found;
    }
    return undefined;
}

/**
 * Counts every property in the tree, nested ones included. Used to generate unique default names.
 * @param properties The root properties.
 * @returns The total number of properties.
 */
export function totalPropertyCount(properties: Property[]): number {
    return properties.reduce((sum, property) => sum + 1 + totalPropertyCount(property.children ?? []), 0);
}
