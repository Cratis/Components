// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildBreadcrumbItems } from './schemaHelpers';

/**
 * Tracks the drill-down path of the table layout; leaving edit mode returns to the root.
 * @param eventTypeName The label of the root breadcrumb.
 * @param isEditMode Whether the editor is editing.
 * @returns The path, the breadcrumb and the navigation actions.
 */
export const useSchemaNavigation = (eventTypeName: string, isEditMode: boolean) => {
    const [currentPath, setCurrentPath] = useState<string[]>([]);

    useEffect(() => {
        if (!isEditMode) {
            setCurrentPath([]);
        }
    }, [isEditMode]);

    const breadcrumbItems = useMemo(() => buildBreadcrumbItems(eventTypeName, currentPath), [eventTypeName, currentPath]);

    const navigateToProperty = useCallback(
        (propertyName: string) => setCurrentPath([...currentPath, propertyName]),
        [currentPath],
    );

    const navigateToArrayItems = useCallback(
        (propertyName: string) => setCurrentPath([...currentPath, propertyName, '$items']),
        [currentPath],
    );

    const navigateBack = useCallback(() => {
        if (currentPath.length > 0) {
            setCurrentPath(currentPath.slice(0, -1));
        }
    }, [currentPath]);

    const navigateToBreadcrumb = useCallback(
        (index: number) => setCurrentPath(breadcrumbItems[index].path),
        [breadcrumbItems],
    );

    return { currentPath, breadcrumbItems, navigateToProperty, navigateToArrayItems, navigateBack, navigateToBreadcrumb };
};
