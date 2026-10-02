// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useState, type RefObject } from 'react';

/** How many columns a grid is assumed to have until it has been measured. */
export const defaultGridColumns = 4;

/**
 * Counts the columns a CSS grid currently lays out, so Up and Down can move a whole row. The browser
 * resolves `repeat(auto-fill, …)` into real tracks, so the count is read back from the grid's computed
 * style whenever it resizes. Environments that cannot lay out - or measure - a grid keep the default.
 * @param grid The grid element.
 * @returns The grid's column count.
 */
export const useGridColumns = (grid: RefObject<HTMLElement | null>): number => {
    const [columns, setColumns] = useState(defaultGridColumns);

    useEffect(() => {
        const element = grid.current;
        if (!element || typeof ResizeObserver === 'undefined') return;
        const measure = () => {
            const tracks = getComputedStyle(element)
                .gridTemplateColumns.split(' ')
                .filter(track => track.endsWith('px')).length;
            if (tracks > 0) setColumns(tracks);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        return () => observer.disconnect();
    }, [grid]);

    return columns;
};
