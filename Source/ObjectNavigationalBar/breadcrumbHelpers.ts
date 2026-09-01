// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Determines whether a navigation path segment addresses an element in an array
 * rather than a property on an object. Array elements are addressed by their
 * zero-based index, written as a plain decimal string (e.g. `'0'`).
 */
export function isArrayIndexSegment(segment: string): boolean {
    return /^\d+$/.test(segment);
}

/**
 * Builds the breadcrumb items for an object navigation bar from a navigation path.
 * Always starts with a 'Root' item at index 0. Array index segments are rendered
 * in bracket notation (`'0'` becomes `'[0]'`) so they read as elements rather than
 * as properties.
 */
export function buildNavigationBreadcrumbs(navigationPath: string[]): { name: string; index: number }[] {
    const items: { name: string; index: number }[] = [{ name: 'Root', index: 0 }];
    for (let i = 0; i < navigationPath.length; i++) {
        const segment = navigationPath[i];
        items.push({
            name: isArrayIndexSegment(segment) ? `[${segment}]` : segment,
            index: i + 1,
        });
    }
    return items;
}
