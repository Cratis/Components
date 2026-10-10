// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useMemo } from 'react';
import type { PivotViewerColors } from '../types';

/** Maps each color override to the CSS variable understood by the component. */
const colorVariables: ReadonlyArray<readonly [keyof PivotViewerColors, string]> = [
    ['primaryColor', '--cratis-primary-color'],
    ['primaryColorText', '--cratis-primary-color-text'],
    ['primary500', '--cratis-primary-500'],
    ['surfaceGround', '--cratis-surface-ground'],
    ['surfaceCard', '--cratis-surface-card'],
    ['surfaceSection', '--cratis-surface-section'],
    ['surfaceOverlay', '--cratis-surface-overlay'],
    ['surfaceBorder', '--cratis-surface-border'],
    ['textColor', '--cratis-text-color'],
    ['textColorSecondary', '--cratis-text-color-secondary'],
    ['highlightBg', '--cratis-highlight-bg'],
    ['maskbg', '--cratis-maskbg'],
    ['focusRing', '--cratis-focus-ring'],
];

/**
 * Maps provided color overrides to CSS variables understood by the component.
 *
 * @param colors - Optional color overrides.
 * @returns CSS variables for the overrides that are set.
 */
export function useColorCssVariables(
    colors: Partial<PivotViewerColors> | undefined,
): Record<string, string> {
    return useMemo(() => {
        const vars: Record<string, string> = {};
        if (!colors) return vars;
        for (const [colorKey, variable] of colorVariables) {
            const value = colors[colorKey];
            if (value) vars[variable] = value;
        }
        return vars;
    }, [colors]);
}
