// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { FilterValue } from './types';
import type { RenderedHistogramBucket } from './utils';

/** One of the two range handles. */
export type RangeHandle = 'left' | 'right';

/** What the user is dragging: a handle or the whole selected range. */
export type RangeDragTarget = RangeHandle | 'range';

/** A numeric range as `[start, end]`. */
export type NumericRange = [number, number];

/** The bounds a range lives within. */
export interface RangeBounds {
    min: number;
    max: number;
}

/** What a keyboard step on a handle works from. */
export interface RangeKeyboardContext extends RangeBounds {
    currentRange: NumericRange;
    minimumGap: number;
    keyboardStep: number;
}

const toNumericValue = (value: FilterValue): number | null => {
    if (typeof value === 'number') return value;
    if (value instanceof Date) return value.getTime();
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};

/** Converts filter values to numbers, dropping values that are not numeric. */
export const toNumericValues = (values: FilterValue[] | undefined) =>
    (values ?? []).map((value) => toNumericValue(value)).filter((value): value is number => value !== null);

/** The percentage position of a value between the bounds, or `0` when the bounds are empty. */
export const positionOfValue = (value: number, { min, max }: RangeBounds) => {
    const range = max - min;
    if (range <= 0) return 0;
    return ((value - min) / range) * 100;
};

const dragLeft = (start: NumericRange, deltaValue: number, { min, max }: RangeBounds): NumericRange => {
    const range = max - min;
    return [Math.max(min, Math.min(start[0] + deltaValue, start[1] - range * 0.01)), start[1]];
};

const dragRight = (start: NumericRange, deltaValue: number, { min, max }: RangeBounds): NumericRange => {
    const range = max - min;
    return [start[0], Math.min(max, Math.max(start[1] + deltaValue, start[0] + range * 0.01))];
};

const slideRange = (start: NumericRange, deltaValue: number, { min, max }: RangeBounds): NumericRange => {
    const rangeWidth = start[1] - start[0];
    let newStart = start[0] + deltaValue;
    let newEnd = start[1] + deltaValue;

    if (newStart < min) {
        newStart = min;
        newEnd = min + rangeWidth;
    }
    if (newEnd > max) {
        newEnd = max;
        newStart = max - rangeWidth;
    }

    return [newStart, newEnd];
};

const dragTransforms = new Map<string, (start: NumericRange, deltaValue: number, bounds: RangeBounds) => NumericRange>([
    ['left', dragLeft],
    ['right', dragRight],
    ['range', slideRange],
]);

/** The range after dragging the target by a value delta from where the drag started. */
export const draggedRange = (
    target: RangeDragTarget,
    start: NumericRange,
    deltaValue: number,
    bounds: RangeBounds,
): NumericRange => {
    const transform = dragTransforms.get(target);
    return transform ? transform(start, deltaValue, bounds) : [...start];
};

type KeyTarget = (handle: RangeHandle, current: number, context: RangeKeyboardContext) => number;

const stepDown: KeyTarget = (_handle, current, { keyboardStep }) => current - keyboardStep;
const stepUp: KeyTarget = (_handle, current, { keyboardStep }) => current + keyboardStep;
const lowestTarget: KeyTarget = (handle, _current, { min, currentRange, minimumGap }) =>
    handle === 'left' ? min : currentRange[0] + minimumGap;
const highestTarget: KeyTarget = (handle, _current, { max, currentRange, minimumGap }) =>
    handle === 'left' ? currentRange[1] - minimumGap : max;

const keyTargets = new Map<string, KeyTarget>([
    ['ArrowLeft', stepDown],
    ['ArrowDown', stepDown],
    ['ArrowRight', stepUp],
    ['ArrowUp', stepUp],
    ['Home', lowestTarget],
    ['End', highestTarget],
]);

/** The value a key moves the handle towards, or `undefined` when the key does not move handles. */
export const keyboardTarget = (key: string, handle: RangeHandle, context: RangeKeyboardContext) => {
    const current = handle === 'left' ? context.currentRange[0] : context.currentRange[1];
    return keyTargets.get(key)?.(handle, current, context);
};

/** The range after moving the handle to the target, kept within the bounds and the minimum gap. */
export const steppedRange = (
    handle: RangeHandle,
    next: number,
    { min, max, currentRange, minimumGap }: RangeKeyboardContext,
): NumericRange => {
    const rounded = Number(next.toFixed(10));
    if (handle === 'left') {
        return [Math.max(min, Math.min(rounded, currentRange[1] - minimumGap)), currentRange[1]];
    }
    return [currentRange[0], Math.min(max, Math.max(rounded, currentRange[0] + minimumGap))];
};

/** Whether the bucket intersects the current range. */
export const isPartiallyInRange = (bucket: RenderedHistogramBucket, currentRange: NumericRange) =>
    bucket.end > currentRange[0] && bucket.start < currentRange[1];

/** The class name of a histogram bar for its place in the current range. */
export const histogramBarClassName = (bucket: RenderedHistogramBucket, currentRange: NumericRange) => {
    const isInRange = bucket.start >= currentRange[0] && bucket.end <= currentRange[1];
    const isPartial = isPartiallyInRange(bucket, currentRange) && !isInRange;
    return `pv-histogram-bar ${isInRange ? 'in-range' : ''} ${isPartial ? 'partial' : ''}`;
};
