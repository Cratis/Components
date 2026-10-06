// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Property } from './Property';

/** Why a property name cannot be used. */
export enum PropertyNameProblem {
    /** The name is empty or only whitespace. */
    Empty = 'empty',
    /** The name would shadow a member every JavaScript object inherits. */
    Reserved = 'reserved',
    /** A sibling already carries the name. */
    Duplicate = 'duplicate',
}

const reservedPrototypeKeys = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Derives the default name for a property typed as a concept — the concept name with a lower-cased first
 * letter, so picking the `CustomerId` concept gives a `customerId` property rather than `property3`.
 * @param concept The name of the concept.
 * @returns The property name to start from.
 */
export function conceptPropertyName(concept: string): string {
    const trimmed = concept.trim();
    return trimmed.length === 0 ? '' : trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

/**
 * Resolves a property name that no sibling already uses. Sibling names become the keys of the JSON Schema
 * object, so two properties sharing a name would silently collapse into one.
 * @param siblings The properties the new property will sit alongside.
 * @param candidate The name to use when it is free.
 * @returns The candidate, or the candidate with the lowest free number appended.
 */
export function uniquePropertyName(siblings: Property[], candidate: string): string {
    const taken = new Set(siblings.map(sibling => sibling.name));
    if (!taken.has(candidate)) {
        return candidate;
    }

    let suffix = 2;
    while (taken.has(`${candidate}${suffix}`)) {
        suffix++;
    }
    return `${candidate}${suffix}`;
}

/**
 * Checks that a name can be used for a property without losing data: names become JSON Schema keys, so an
 * empty, prototype-shadowing or duplicated name would corrupt or collapse the schema.
 * @param name The proposed name.
 * @param propertyId The id of the property being named, so it is not compared with itself.
 * @param siblings The properties that share the parent, including the one being named.
 * @returns What is wrong with the name, or `undefined` when it can be used.
 */
export function findPropertyNameProblem(
    name: string,
    propertyId: string,
    siblings: Property[],
): PropertyNameProblem | undefined {
    if (name.trim() === '') return PropertyNameProblem.Empty;
    if (reservedPrototypeKeys.has(name)) return PropertyNameProblem.Reserved;
    if (siblings.some(sibling => sibling.name === name && sibling.id !== propertyId)) return PropertyNameProblem.Duplicate;
    return undefined;
}
