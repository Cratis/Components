// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';

/** The attribute every roving item carries, holding its index. */
const itemAttribute = 'data-roving-index';

/** What {@link useRovingFocus} hands to the container and each item. */
export interface RovingFocus {
    /** The container the items live in. */
    containerRef: RefObject<HTMLDivElement | null>;

    /** Moves focus between items; put on the container. */
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;

    /**
     * The props of the item at an index: its tab stop, its index marker, and the focus handler that
     * keeps the tab stop where focus last was.
     * @param index The item's index.
     */
    itemProps: (index: number) => {
        tabIndex: number;
        onFocus: () => void;
        [attribute: `data-${string}`]: number;
    };
}

/**
 * A roving tab stop over a row or grid of items: one item is reachable with Tab, and the arrow keys,
 * Home and End move focus among the rest. Items are located through their `data-roving-index`
 * attribute, so they can be any element.
 * @param count How many items there are.
 * @param columns How many items make a row. Zero for a single row, where only Left/Right move focus.
 * @param preferredIndex The item to make the tab stop when focus has not moved yet, such as the selection.
 * @returns What to put on the container and on each item.
 */
export const useRovingFocus = (count: number, columns: number, preferredIndex = 0): RovingFocus => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [focusedIndex, setFocusedIndex] = useState<number | undefined>();

    // The tab stop falls back to the preferred item when the focused one is no longer in the list.
    const tabStop = focusedIndex !== undefined && focusedIndex < count ? focusedIndex : Math.min(Math.max(preferredIndex, 0), Math.max(count - 1, 0));

    useEffect(() => {
        if (focusedIndex !== undefined && focusedIndex >= count) setFocusedIndex(undefined);
    }, [count, focusedIndex]);

    const focusItem = (index: number) => {
        const target = containerRef.current?.querySelector<HTMLElement>(`[${itemAttribute}="${index}"]`);
        if (!target) return;
        setFocusedIndex(index);
        target.focus();
    };

    const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        const current = (event.target as HTMLElement).closest<HTMLElement>(`[${itemAttribute}]`);
        if (!current || !containerRef.current?.contains(current)) return;
        const index = Number(current.getAttribute(itemAttribute));
        const step = columns > 0 ? columns : 0;
        let next: number | undefined;
        switch (event.key) {
            case 'ArrowRight':
                next = index + 1;
                break;
            case 'ArrowLeft':
                next = index - 1;
                break;
            case 'ArrowDown':
                if (step > 0) next = index + step;
                break;
            case 'ArrowUp':
                if (step > 0) next = index - step;
                break;
            case 'Home':
                next = 0;
                break;
            case 'End':
                next = count - 1;
                break;
            default:
                return;
        }
        if (next === undefined) return;
        event.preventDefault();
        if (next >= 0 && next < count) focusItem(next);
    };

    return {
        containerRef,
        onKeyDown,
        itemProps: index => ({
            tabIndex: index === tabStop ? 0 : -1,
            onFocus: () => setFocusedIndex(index),
            [itemAttribute]: index,
        }),
    };
};
