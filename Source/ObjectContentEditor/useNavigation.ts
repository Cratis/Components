// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';
import type { Json, JsonSchema } from '../types/JsonSchema';
import { getValueAtPath } from './objectHelpers';

interface NavigationOptions {
    object: Json;
    schema: JsonSchema;
    navigationPath: string[];
    setNavigationPath: Dispatch<SetStateAction<string[]>>;
}

export function useNavigation({ object, schema, navigationPath, setNavigationPath }: NavigationOptions) {
    const navigateTo = useCallback(
        (segments: string[]) => {
            setNavigationPath([...navigationPath, ...segments]);
        },
        [navigationPath, setNavigationPath],
    );

    const navigateToBreadcrumb = useCallback(
        (index: number) => {
            if (index === 0) {
                setNavigationPath([]);
            } else {
                setNavigationPath(navigationPath.slice(0, index));
            }
        },
        [navigationPath, setNavigationPath],
    );

    const currentData = useMemo(() => {
        if (navigationPath.length === 0) {
            return object;
        }
        const value = getValueAtPath(object, navigationPath);
        return value !== null && typeof value === 'object' ? value : null;
    }, [object, navigationPath]);

    useEffect(() => {
        if (navigationPath.length > 0 && currentData === null) {
            setNavigationPath([]);
        }
    }, [currentData, navigationPath, setNavigationPath]);

    const currentProperties = useMemo(() => {
        const properties = schema.properties || {};
        if (navigationPath.length === 0) {
            return properties;
        }
        return {};
    }, [schema, navigationPath]);

    return { navigateTo, navigateToBreadcrumb, currentData, currentProperties };
}
