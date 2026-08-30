// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type {
    FilterDefinition,
    FilterValues,
    HistogramBucket,
    RangeValues,
} from './types';

/** A histogram bucket with the tallest count in its set, so a bar can size itself. */
export interface RenderedHistogramBucket extends HistogramBucket {
    maxCount: number;
}

/** The anchor edges the filter dropdown is positioned against, in viewport coordinates. */
export interface DropdownAnchorRect {
    top: number;
    bottom: number;
    left: number;
}

/** The visible viewport the filter dropdown must stay inside. */
export interface DropdownViewport {
    width: number;
    height: number;
}

/** Fixed-position coordinates and bounds for the filter dropdown. */
export interface DropdownPosition {
    left: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
}

// These mirror `.pv-filter-dropdown` in `FilterPanel.css`, which bounds the panel at
// `width: min(320px, calc(100vw - 2rem))` and `max-height: calc(100vh - 8rem)`.
const DROPDOWN_MAX_WIDTH = 320;
const DROPDOWN_MAX_HEIGHT_INSET = 128;
const DROPDOWN_GUTTER = 16;
const DROPDOWN_ANCHOR_GAP = 8;

const clamp = (value: number, minimum: number, maximum: number) =>
    Math.min(Math.max(value, minimum), maximum);

/**
 * Place the filter dropdown against its anchor without letting it leave the viewport.
 *
 * The panel is `position: fixed`, so an anchor near the right edge would otherwise push it
 * off-screen, and an anchor near the bottom would open a panel that cannot be reached. The
 * horizontal placement is clamped into the available gutter. When the panel flips above its
 * anchor it uses `bottom`, rather than guessing its rendered height, so short content remains
 * attached to the trigger. The selected side also supplies an explicit maximum height.
 */
export function resolveDropdownPosition(
    anchor: DropdownAnchorRect,
    viewport: DropdownViewport,
): DropdownPosition {
    const viewportWidth = Math.max(0, viewport.width);
    const viewportHeight = Math.max(0, viewport.height);
    const horizontalGutter = Math.min(DROPDOWN_GUTTER, viewportWidth / 2);
    const verticalGutter = Math.min(DROPDOWN_GUTTER, viewportHeight / 2);
    const width = Math.max(
        0,
        Math.min(DROPDOWN_MAX_WIDTH, viewportWidth - horizontalGutter * 2),
    );
    const left = clamp(
        anchor.left,
        horizontalGutter,
        Math.max(horizontalGutter, viewportWidth - width - horizontalGutter),
    );

    const top = clamp(
        anchor.bottom + DROPDOWN_ANCHOR_GAP,
        verticalGutter,
        Math.max(verticalGutter, viewportHeight - verticalGutter),
    );
    const bottom = clamp(
        viewportHeight - anchor.top + DROPDOWN_ANCHOR_GAP,
        verticalGutter,
        Math.max(verticalGutter, viewportHeight - verticalGutter),
    );
    const roomBelow = Math.max(0, viewportHeight - verticalGutter - top);
    const roomAbove = Math.max(0, viewportHeight - verticalGutter - bottom);
    const configuredMaxHeight = Math.max(
        0,
        viewportHeight -
            (viewportHeight > DROPDOWN_MAX_HEIGHT_INSET
                ? DROPDOWN_MAX_HEIGHT_INSET
                : verticalGutter * 2),
    );

    if (roomBelow >= roomAbove) {
        return {
            top,
            left,
            maxHeight: Math.min(roomBelow, configuredMaxHeight),
        };
    }

    return {
        bottom,
        left,
        maxHeight: Math.min(roomAbove, configuredMaxHeight),
    };
}

/** Initialise the string/option selection map for all string/date filters. */
export function buildFilterValues(filters: FilterDefinition[] | undefined): FilterValues {
    const state: FilterValues = {};
    filters?.forEach((filter) => {
        if (!filter.type || filter.type === 'string' || filter.type === 'date') {
            state[filter.key] = new Set<string>();
        }
    });
    return state;
}

/** Initialise the numeric range map for all number filters. */
export function buildRangeValues(filters: FilterDefinition[] | undefined): RangeValues {
    const state: RangeValues = {};
    filters?.forEach((filter) => {
        if (filter.type === 'number') {
            state[filter.key] = null;
        }
    });
    return state;
}

/**
 * Build the bars a range filter renders.
 *
 * Pre-counted buckets are rendered as given - they come from a source that saw more data than the
 * browser holds, so recounting them against the loaded values would understate the real totals.
 * Otherwise the raw values are counted into `bucketCount` evenly sized buckets across the range.
 */
export function buildHistogram(
    values: number[],
    min: number,
    max: number,
    bucketCount: number,
    provided?: HistogramBucket[],
): RenderedHistogramBucket[] {
    if (provided !== undefined) {
        if (provided.length === 0) return [];
        const providedMax = Math.max(...provided.map((bucket) => bucket.count), 1);
        return provided.map((bucket) => ({ ...bucket, maxCount: providedMax }));
    }

    const range = max - min;
    if (range <= 0 || values.length === 0) return [];

    const bucketSize = range / bucketCount;
    const counts: number[] = Array(bucketCount).fill(0);

    values.forEach((value) => {
        const index = Math.min(Math.floor((value - min) / bucketSize), bucketCount - 1);
        if (index >= 0 && index < bucketCount) counts[index]++;
    });

    const maxCount = Math.max(...counts, 1);

    return counts.map((count, index) => ({
        start: min + index * bucketSize,
        end: min + (index + 1) * bucketSize,
        count,
        maxCount,
    }));
}
