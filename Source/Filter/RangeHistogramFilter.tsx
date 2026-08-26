// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FilterValue, HistogramBucket } from './types';
import { buildHistogram } from './utils';
import type { RenderedHistogramBucket } from './utils';

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
    /** Called when the user drags a handle or clicks a bar to select a new range. Pass `null` to clear. */
    onChange: (range: [number, number] | null) => void;
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

    const numericValues = useMemo(() => {
        return (values ?? [])
            .map((v) => {
                if (typeof v === 'number') return v;
                if (v instanceof Date) return v.getTime();
                const parsed = Number(v);
                return Number.isNaN(parsed) ? null : parsed;
            })
            .filter((v): v is number => v !== null);
    }, [values]);

    const histogram = useMemo(
        () => buildHistogram(numericValues, min, max, buckets, providedHistogram),
        [providedHistogram, numericValues, min, max, buckets],
    );

    const currentRange = selectedRange ?? [min, max];

    const getPositionFromValue = useCallback(
        (value: number) => {
            const range = max - min;
            if (range <= 0) return 0;
            return ((value - min) / range) * 100;
        },
        [min, max],
    );

    const handleMouseDown = (e: React.MouseEvent, handle: 'left' | 'right' | 'range') => {
        e.preventDefault?.();
        setIsDragging(handle);
        setDragStart({ x: e.clientX, range: [...currentRange] as [number, number] });
    };

    useEffect(() => {
        if (!isDragging || !dragStart || !containerRef.current) return;

        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const range = max - min;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - dragStart.x;
            const deltaPercent = (deltaX / rect.width) * 100;
            const deltaValue = (deltaPercent / 100) * range;

            let newRange: [number, number] = [...dragStart.range];

            if (isDragging === 'left') {
                newRange[0] = Math.max(
                    min,
                    Math.min(dragStart.range[0] + deltaValue, newRange[1] - range * 0.01),
                );
            } else if (isDragging === 'right') {
                newRange[1] = Math.min(
                    max,
                    Math.max(dragStart.range[1] + deltaValue, newRange[0] + range * 0.01),
                );
            } else if (isDragging === 'range') {
                const rangeWidth = dragStart.range[1] - dragStart.range[0];
                let newStart = dragStart.range[0] + deltaValue;
                let newEnd = dragStart.range[1] + deltaValue;

                if (newStart < min) {
                    newStart = min;
                    newEnd = min + rangeWidth;
                }
                if (newEnd > max) {
                    newEnd = max;
                    newStart = max - rangeWidth;
                }

                newRange = [newStart, newEnd];
            }

            onChange(newRange);
        };

        const handleMouseUp = () => {
            setIsDragging(null);
            setDragStart(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart, min, max, onChange]);

    const handleBarClick = (bucket: RenderedHistogramBucket) => {
        onChange([bucket.start, bucket.end]);
    };

    const rangeSpan = max - min;
    const minimumGap = rangeSpan * 0.01;
    const keyboardStep = rangeSpan / Math.max(1, buckets);

    const handleHandleKeyDown = (
        event: React.KeyboardEvent<HTMLDivElement>,
        handle: 'left' | 'right',
    ) => {
        if (keyboardStep <= 0) return;

        let next: number | undefined;
        const current = handle === 'left' ? currentRange[0] : currentRange[1];
        if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
            next = current - keyboardStep;
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
            next = current + keyboardStep;
        } else if (event.key === 'Home') {
            next = handle === 'left' ? min : currentRange[0] + minimumGap;
        } else if (event.key === 'End') {
            next = handle === 'left' ? currentRange[1] - minimumGap : max;
        } else return;

        event.preventDefault();
        const rounded = Number(next.toFixed(10));
        if (handle === 'left') {
            onChange([
                Math.max(min, Math.min(rounded, currentRange[1] - minimumGap)),
                currentRange[1],
            ]);
        } else {
            onChange([
                currentRange[0],
                Math.min(max, Math.max(rounded, currentRange[0] + minimumGap)),
            ]);
        }
    };

    const leftPos = getPositionFromValue(currentRange[0]);
    const rightPos = getPositionFromValue(currentRange[1]);

    return (
        <div className='pv-range-histogram' ref={containerRef}>
            <div className='pv-histogram-bars'>
                {histogram.map((bucket, i) => {
                    const heightPercent = (bucket.count / bucket.maxCount) * 100;
                    const isInRange =
                        bucket.start >= currentRange[0] && bucket.end <= currentRange[1];
                    const isPartiallyInRange =
                        bucket.end > currentRange[0] && bucket.start < currentRange[1];

                    return (
                        <button
                            key={i}
                            className={`pv-histogram-bar ${isInRange ? 'in-range' : ''} ${isPartiallyInRange && !isInRange ? 'partial' : ''}`}
                            style={{ height: `${heightPercent}%` }}
                            onClick={() => handleBarClick(bucket)}
                            title={`${formatValue(bucket.start)} - ${formatValue(bucket.end)}: ${bucket.count} ${itemsLabel}`}
                            type='button'
                        />
                    );
                })}
            </div>

            <div className='pv-range-slider'>
                <div className='pv-range-track' />
                <div
                    className='pv-range-selection'
                    style={{
                        left: `${leftPos}%`,
                        width: `${rightPos - leftPos}%`,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'range')}
                />
                <div
                    className='pv-range-handle pv-range-handle-left'
                    style={{ left: `${leftPos}%` }}
                    role='slider'
                    tabIndex={0}
                    aria-label={minimumAriaLabel}
                    aria-valuemin={min}
                    aria-valuemax={currentRange[1] - minimumGap}
                    aria-valuenow={currentRange[0]}
                    aria-valuetext={formatValue(currentRange[0])}
                    onMouseDown={(e) => handleMouseDown(e, 'left')}
                    onKeyDown={(event) => handleHandleKeyDown(event, 'left')}
                />
                <div
                    className='pv-range-handle pv-range-handle-right'
                    style={{ left: `${rightPos}%` }}
                    role='slider'
                    tabIndex={0}
                    aria-label={maximumAriaLabel}
                    aria-valuemin={currentRange[0] + minimumGap}
                    aria-valuemax={max}
                    aria-valuenow={currentRange[1]}
                    aria-valuetext={formatValue(currentRange[1])}
                    onMouseDown={(e) => handleMouseDown(e, 'right')}
                    onKeyDown={(event) => handleHandleKeyDown(event, 'right')}
                />
            </div>

            <div className='pv-range-labels'>
                <span className='pv-range-value'>{formatValue(currentRange[0])}</span>
                <span className='pv-range-value'>{formatValue(currentRange[1])}</span>
            </div>
        </div>
    );
}
