// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { JsonSchemaProperty, NavigationItem } from '../types/JsonSchema';
import { isKeywordApplicable, jsonTypeFamily } from './Tree/keywordApplicability';
import { schemaPropertyType } from './Tree/schemaConversion';

const modelledKeywords = new Set(['type', 'format', 'items', 'properties', 'required']);

/**
 * Removes the standard keywords that no longer apply after a property's type changed, in place. The type,
 * format, items, properties and `required` keywords and every `x-` keyword are left to the caller. A change
 * that keeps the property type, as the editor models it, keeps everything.
 * @param node The property node after the type change.
 * @param previous The property node before the type change.
 */
export function dropInapplicableKeywords(node: Record<string, unknown>, previous: Record<string, unknown>): void {
    const kindOf = (candidate: Record<string, unknown>) => schemaPropertyType({ ...candidate, items: undefined });
    if (kindOf(node) === kindOf(previous)) return;

    const from = jsonTypeFamily(previous.type);
    const to = jsonTypeFamily(node.type);
    for (const keyword of Object.keys(node)) {
        if (modelledKeywords.has(keyword) || keyword.startsWith('x-')) continue;
        if (!isKeywordApplicable(keyword, from, to)) delete node[keyword];
    }
}

const reservedPrototypeKeys = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Validates a property name, returning an error string or undefined if valid.
 */
export function validatePropertyName(
    name: string,
    propertyId: string,
    allProperties: JsonSchemaProperty[],
): string | undefined {
    if (!name || name.trim() === '') {
        return 'Property name cannot be empty';
    }

    if (reservedPrototypeKeys.has(name)) {
        return 'Property name cannot be a reserved prototype key';
    }

    const validIdentifierPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!validIdentifierPattern.test(name)) {
        return 'Property name must start with a letter or underscore and contain only letters, numbers, and underscores';
    }

    const duplicates = allProperties.filter(
        (p) => p.name === name && p.id !== propertyId,
    );
    if (duplicates.length > 0) {
        return 'Property name must be unique';
    }

    return undefined;
}

/**
 * Builds the list of breadcrumb navigation items from a path, using the event type name as the root.
 */
export function buildBreadcrumbItems(
    eventTypeName: string,
    currentPath: string[],
): NavigationItem[] {
    const items: NavigationItem[] = [{ name: eventTypeName, path: [] }];

    for (let i = 0; i < currentPath.length; i++) {
        const segment = currentPath[i];
        if (segment === '$items') {
            items.push({ name: '[items]', path: currentPath.slice(0, i + 1) });
        } else {
            items.push({ name: segment, path: currentPath.slice(0, i + 1) });
        }
    }

    return items;
}
