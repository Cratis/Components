// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FilterValue, HistogramBucket } from './types';
import { buildHistogram } from './utils';
import type { RenderedHistogramBucket } from './utils';
import type { ChangeHandler } from '../types/ChangeHandler';
import {
    draggedRange,
    histogramBarClassName,
    isPartiallyInRange,
    keyboardTarget,
    positionOfValue,
    steppedRange,
    toNumericValues,
    type NumericRange,
    type RangeDragTarget,
    type RangeHandle,
} from './rangeHistogramMath';

/**
 * Props for {@link RangeHistogramFilter}.
 *
 * Describes the data to histogram, the numeric bounds, the selected range,
 * and the callback invoked when the user drags the range handles or clicks
 * a histogram bar.
 */
export interface RangeHistogramFilterProps {
    /**
     * The raw values to count into buckets in the browser. Ignored when `histogram` is supplied.
     */
    values?: FilterValue[];
    /**
     * Pre-counted buckets to render instead of counting `values`. Use this when the counts come from
     * somewhere that can see more data than the browser holds - a server aggregating over a large
     * table, for instance - so the picker reflects everything rather than the loaded page.
     */
    histogram?: HistogramBucket[];
    /** The minimum value of the range. */
    min: number;
    /** The maximum value of the range. */
    max: number;
    /** Number of histogram buckets to divide the range into. Defaults to 20. */
    buckets?: number;
    /** The currently selected range, or `null` when no range is selected. */
    selectedRange: [number, number] | null;
    /** Called with the selected range and optional user-interaction metadata. Pass `null` to clear. */
    onChange: ChangeHandler<[number, number] | null>;
    /**
     * Optional formatter for endpoint labels and bar tooltips. Defaults to a numeric formatter.
     * Use this to display ms timestamps as dates, currency, etc.
     */
    formatValue?: (value: number) => string;
    /** Unit shown after a histogram bar count. Override to localize. Defaults to `'items'`. */
    itemsLabel?: string;
    /** Accessible name for the lower-bound slider. Defaults to `'Minimum value'`. */
    minimumAriaLabel?: string;
    /** Accessible name for the upper-bound slider. Defaults to `'Maximum value'`. */
    maximumAriaLabel?: string;
}

const defaultFormatValue = (value: number) => {
    if (Number.isInteger(value)) return value.toString();
    return value.toFixed(1);
};

interface DragStart {
    x: number;
    range: NumericRange;
}

interface FollowDragOptions {
    container: HTMLDivElement;
    target: RangeDragTarget;
    dragStart: DragStart;
    min: number;
    max: number;
    onChange: ChangeHandler<NumericRange | null>;
    onRelease: () => void;
}

/** Follows the mouse on the document until released. Returns the cleanup that stops following. */
const followDrag = ({ container, target, dragStart, min, max, onChange, onRelease }: FollowDragOptions) => {
    const rect = container.getBoundingClientRect();
    const range = max - min;

    const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - dragStart.x;
        const deltaPercent = (deltaX / rect.width) * 100;
        const deltaValue = (deltaPercent / 100) * range;

        onChange(draggedRange(target, dragStart.range, deltaValue, { min, max }), { source: 'user', nativeEvent: e });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', onRelease);

    return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', onRelease);
    };
};

interface HistogramBarOptions {
    bucket: RenderedHistogramBucket;
    index: number;
    currentRange: NumericRange;
    rangeSelected: boolean;
    formatValue: (value: number) => string;
    itemsLabel: string;
    onBarClick: (bucket: RenderedHistogramBucket, event: React.MouseEvent<HTMLButtonElement>) => void;
}

const renderHistogramBar = ({ bucket, index, currentRange, rangeSelected, formatValue, itemsLabel, onBarClick }: HistogramBarOptions) => {
    const heightPercent = (bucket.count / bucket.maxCount) * 100;
    const isSelected = rangeSelected && isPartiallyInRange(bucket, currentRange);

    return (
        <button
            key={index}
            className={histogramBarClassName(bucket, currentRange)}
            style={{ height: `${heightPercent}%` }}
            onClick={(event) => onBarClick(bucket, event)}
            title={`${formatValue(bucket.start)} - ${formatValue(bucket.end)}: ${bucket.count} ${itemsLabel}`}
            type='button'
            data-selected={isSelected || undefined}
        />
    );
};

interface RangeHandleOptions {
    handle: RangeHandle;
    position: number;
    ariaLabel: string;
    valueMin: number;
    valueMax: number;
    valueNow: number;
    formatValue: (value: number) => string;
    selected: true | undefined;
    pressed: true | undefined;
    onMouseDown: (e: React.MouseEvent, handle: RangeHandle) => void;
    onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>, handle: RangeHandle) => void;
}

const renderRangeHandle = (options: RangeHandleOptions) => {
    const { handle, onMouseDown, onKeyDown } = options;
    return (
        <div
            className={`pv-range-handle pv-range-handle-${handle}`}
            style={{ left: `${options.position}%` }}
            role='slider'
            tabIndex={0}
            aria-label={options.ariaLabel}
            aria-valuemin={options.valueMin}
            aria-valuemax={options.valueMax}
            aria-valuenow={options.valueNow}
            aria-valuetext={options.formatValue(options.valueNow)}
            data-selected={options.selected}
            data-pressed={options.pressed}
            onMouseDown={(e) => onMouseDown(e, handle)}
            onKeyDown={(event) => onKeyDown(event, handle)}
        />
    );
};

/**
 * A draggable numeric range selector rendered over a histogram. The user can
 * drag the left and right handles to select a range, drag the range bar to
 * slide the entire range, or click a histogram bar to snap the selection to
 * that bar's bounds.
 *
 * Use this for numeric and date-range filters inside {@link FilterPanel}. The
 * panel wires it automatically for `type: 'number'` or `type: 'date'` filters
 * that supply a `numericRange`.
 *
 * ```tsx
 * <RangeHistogramFilter
 *   min={0}
 *   max={1000}
 *   buckets={20}
 *   selectedRange={range}
 *   onChange={setRange}
 *   values={allValues}  // counted in the browser
 * />
 * ```
 *
 * For large datasets, pass pre-computed `histogram` buckets from the server
 * instead of `values`, so the histogram reflects everything rather than the
 * loaded page.
 *
 * @param props - {@link RangeHistogramFilterProps}.
 */
export function RangeHistogramFilter({
    values,
    histogram: providedHistogram,
    min,
    max,
    buckets = 20,
    selectedRange,
    onChange,
    formatValue = defaultFormatValue,
    itemsLabel = 'items',
    minimumAriaLabel = 'Minimum value',
    maximumAriaLabel = 'Maximum value',
}: RangeHistogramFilterProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState<'left' | 'right' | 'range' | null>(null);
    const [dragStart, setDragStart] = useState<{
        x: number;
        range: [number, number];
    } | null>(null);

    const numericValues = useMemo(() => toNumericValues(values), [values]);

    const histogram = useMemo(
        () => buildHistogram(numericValues, min, max, buckets, providedHistogram),
        [providedHistogram, numericValues, min, max, buckets],
    );

    const currentRange: NumericRange = selectedRange ?? [min, max];

    const getPositionFromValue = useCallback(
        (value: number) => positionOfValue(value, { min, max }),
        [min, max],
    );

    const handleMouseDown = (e: React.MouseEvent, handle: 'left' | 'right' | 'range') => {
        e.preventDefault?.();
        setIsDragging(handle);
        setDragStart({ x: e.clientX, range: [...currentRange] as [number, number] });
    };

    useEffect(() => {
        if (!isDragging || !dragStart) return;
        const container = containerRef.current;
        if (!container) return;

        const handleMouseUp = () => {
            setIsDragging(null);
            setDragStart(null);
        };

        return followDrag({ container, target: isDragging, dragStart, min, max, onChange, onRelease: handleMouseUp });
    }, [isDragging, dragStart, min, max, onChange]);

    const handleBarClick = (
        bucket: RenderedHistogramBucket,
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        onChange([bucket.start, bucket.end], {
            source: 'user',
            nativeEvent: event.nativeEvent,
        });
    };

    const rangeSpan = max - min;
    const minimumGap = rangeSpan * 0.01;
    const keyboardStep = rangeSpan / Math.max(1, buckets);

    const handleHandleKeyDown = (
        event: React.KeyboardEvent<HTMLDivElement>,
        handle: 'left' | 'right',
    ) => {
        if (keyboardStep <= 0) return;

        const keyboard = { min, max, currentRange, minimumGap, keyboardStep };
        const next = keyboardTarget(event.key, handle, keyboard);
        if (next === undefined) return;

        event.preventDefault();
        onChange(steppedRange(handle, next, keyboard), { source: 'user', nativeEvent: event.nativeEvent });
    };

    const leftPos = getPositionFromValue(currentRange[0]);
    const rightPos = getPositionFromValue(currentRange[1]);
    const rangeSelected = selectedRange !== null;
    const selected = rangeSelected || undefined;

    return (
        <div
            className='pv-range-histogram'
            ref={containerRef}
            data-selected={selected}
            data-cratis-component='RangeHistogramFilter'
        >
            <div className='pv-histogram-bars'>
                {histogram.map((bucket, index) =>
                    renderHistogramBar({ bucket, index, currentRange, rangeSelected, formatValue, itemsLabel, onBarClick: handleBarClick }),
                )}
            </div>

            <div
                className='pv-range-slider'
                data-selected={selected}
            >
                <div className='pv-range-track' />
                <div
                    className='pv-range-selection'
                    style={{
                        left: `${leftPos}%`,
                        width: `${rightPos - leftPos}%`,
                    }}
                    data-selected={selected}
                    data-pressed={isDragging === 'range' || undefined}
                    onMouseDown={(e) => handleMouseDown(e, 'range')}
                />
                {renderRangeHandle({
                    handle: 'left',
                    position: leftPos,
                    ariaLabel: minimumAriaLabel,
                    valueMin: min,
                    valueMax: currentRange[1] - minimumGap,
                    valueNow: currentRange[0],
                    formatValue,
                    selected,
                    pressed: isDragging === 'left' || undefined,
                    onMouseDown: handleMouseDown,
                    onKeyDown: handleHandleKeyDown,
                })}
                {renderRangeHandle({
                    handle: 'right',
                    position: rightPos,
                    ariaLabel: maximumAriaLabel,
                    valueMin: currentRange[0] + minimumGap,
                    valueMax: max,
                    valueNow: currentRange[1],
                    formatValue,
                    selected,
                    pressed: isDragging === 'right' || undefined,
                    onMouseDown: handleMouseDown,
                    onKeyDown: handleHandleKeyDown,
                })}
            </div>

            <div className='pv-range-labels'>
                <span className='pv-range-value'>{formatValue(currentRange[0])}</span>
                <span className='pv-range-value'>{formatValue(currentRange[1])}</span>
            </div>
        </div>
    );
}
