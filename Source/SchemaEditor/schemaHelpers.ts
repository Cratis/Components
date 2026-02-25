// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { JsonSchemaProperty, NavigationItem } from '../types/JsonSchema';

/**
 * Validates a property name, returning an error string or undefined if valid.
 */
export function validatePropertyName(name: string, propertyId: string, allProperties: JsonSchemaProperty[]): string | undefined {
    if (!name || name.trim() === '') {
        return 'Property name cannot be empty';
    }

    const validIdentifierPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!validIdentifierPattern.test(name)) {
        return 'Property name must start with a letter or underscore and contain only letters, numbers, and underscores';
    }

    const duplicates = allProperties.filter(p => p.name === name && p.id !== propertyId);
    if (duplicates.length > 0) {
        return 'Property name must be unique';
    }

    return undefined;
}

/**
 * Builds the list of breadcrumb navigation items from a path, using the event type name as the root.
 */
export function buildBreadcrumbItems(eventTypeName: string, currentPath: string[]): NavigationItem[] {
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
