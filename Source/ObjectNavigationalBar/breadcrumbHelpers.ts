// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Builds the breadcrumb items for an object navigation bar from a navigation path.
 * Always starts with a 'Root' item at index 0.
 */
export function buildNavigationBreadcrumbs(navigationPath: string[]): { name: string; index: number }[] {
    const items: { name: string; index: number }[] = [{ name: 'Root', index: 0 }];
    for (let i = 0; i < navigationPath.length; i++) {
        items.push({
            name: navigationPath[i],
            index: i + 1,
        });
    }
    return items;
}
