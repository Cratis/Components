// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { PaginatorPageItem } from './PaginatorPageItem';

const nonNegativeInteger = (value: number, fallback = 0) =>
    Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : fallback;

const appendGap = (
    items: PaginatorPageItem[],
    first: number,
    last: number,
    key: 'start' | 'end',
) => {
    if (last < first) return;
    items.push(
        first === last ? { kind: 'page', page: first } : { kind: 'ellipsis', key },
    );
};

/**
 * Selects zero-based numbered pages, preserving boundary pages and the current page's siblings.
 * Single-page gaps render as a page; larger gaps render as a stable start/end ellipsis.
 * Short ranges (at most `2 * boundaries + 2 * siblings + 3` pages) render every page.
 *
 * @param page - Current zero-based page; clamped to the available pages.
 * @param pageCount - Total page count; non-finite or negative counts produce no items.
 * @param siblings - Pages on each side of the current page. Defaults to 1.
 * @param boundaries - Pages at each end of the range. Defaults to 1.
 * @returns The ordered numbered pages and gaps. Numeric inputs are truncated to integers;
 * negative window sizes become zero and non-finite window sizes use their defaults.
 */
export const paginatorPages = (
    page: number,
    pageCount: number,
    siblings = 1,
    boundaries = 1,
): PaginatorPageItem[] => {
    const count = nonNegativeInteger(pageCount);
    if (count === 0) return [];
    const current = Math.min(nonNegativeInteger(page), count - 1);
    const siblingCount = Math.min(nonNegativeInteger(siblings, 1), count);
    const boundaryCount = Math.min(nonNegativeInteger(boundaries, 1), count);
    if (count <= 2 * boundaryCount + 2 * siblingCount + 3) {
        return Array.from({ length: count }, (_, index) => ({
            kind: 'page',
            page: index,
        }));
    }

    const selected = new Set<number>();
    for (let index = 0; index < boundaryCount; index++) {
        selected.add(index);
        selected.add(count - index - 1);
    }
    for (
        let index = Math.max(0, current - siblingCount);
        index <= Math.min(count - 1, current + siblingCount);
        index++
    ) {
        selected.add(index);
    }

    const items: PaginatorPageItem[] = [];
    let previous = -1;
    for (const selectedPage of [...selected].sort((left, right) => left - right)) {
        appendGap(
            items,
            previous + 1,
            selectedPage - 1,
            selectedPage <= current ? 'start' : 'end',
        );
        items.push({ kind: 'page', page: selectedPage });
        previous = selectedPage;
    }
    appendGap(items, previous + 1, count - 1, 'end');
    return items;
};
