// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { PivotViewerColors } from '../../types';
import {
    createCssColorResolver,
    observeColorEnvironment,
    resolveCardColors,
} from './colorResolver';
import { DEFAULT_COLORS, type CardColors } from './constants';

/**
 * Resolves the card colors from the viewport's CSS and refreshes them when the color environment
 * or the overrides change.
 * @param parentContainerRef The viewport whose CSS supplies the colors.
 * @param colorOverrides The public color overrides; a change triggers a refresh.
 * @param needsRenderRef Set when the colors change, so the stage renders again.
 * @returns The current card colors and a revision that changes with them.
 */
export const usePivotCardColors = (
    parentContainerRef: RefObject<HTMLDivElement | null>,
    colorOverrides: Partial<PivotViewerColors> | undefined,
    needsRenderRef: RefObject<boolean>,
) => {
    const [colorRevision, setColorRevision] = useState(0);
    const cardColorsRef = useRef<CardColors>(DEFAULT_COLORS);
    const cssColorResolver = useMemo(() => createCssColorResolver(), []);

    useEffect(() => {
        const element = parentContainerRef.current;
        if (!element) return;

        const refreshColors = () => {
            cardColorsRef.current = resolveCardColors(cssColorResolver, element);
            needsRenderRef.current = true;
            setColorRevision((revision) => revision + 1);
        };

        refreshColors();
        return observeColorEnvironment(element, refreshColors);
    }, [cssColorResolver, parentContainerRef, colorOverrides, needsRenderRef]);

    return { cardColorsRef, colorRevision };
};
