// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { NumberInputProps } from './NumberInputProps';

export const semanticValue = (value: number | null): number | null =>
    value !== null && Number.isFinite(value) ? value : null;

const finiteBound = (value: number | undefined): number | undefined =>
    value !== undefined && Number.isFinite(value) ? value : undefined;

const stepPrecision = (step: number): number => {
    const text = String(step).toLowerCase();
    const [coefficient, exponentText] = text.split('e');
    const decimals = coefficient.split('.')[1]?.length ?? 0;
    const exponent = Number(exponentText ?? 0);
    return Math.max(0, Math.min(20, decimals - exponent));
};

export const normalizeValue = (
    value: number | null,
    { min, max, step }: Pick<NumberInputProps, 'min' | 'max' | 'step'>,
    maximumFractionDigits: number,
): number | null => {
    if (value === null) return null;
    const minimum = finiteBound(min);
    const maximum = finiteBound(max);
    let normalized = Math.min(
        maximum ?? Number.POSITIVE_INFINITY,
        Math.max(minimum ?? Number.NEGATIVE_INFINITY, value),
    );
    if (step !== undefined && Number.isFinite(step) && step > 0) {
        const base = minimum ?? 0;
        normalized = base + Math.round((normalized - base) / step) * step;
        if (maximum !== undefined && normalized > maximum)
            normalized = base + Math.floor((maximum - base) / step) * step;
        normalized = Math.min(
            maximum ?? Number.POSITIVE_INFINITY,
            Math.max(minimum ?? Number.NEGATIVE_INFINITY, normalized),
        );
        normalized = Number(normalized.toFixed(stepPrecision(step)));
    }
    return Number(
        new Intl.NumberFormat('en-US-u-nu-latn', {
            useGrouping: false,
            maximumFractionDigits,
        }).format(normalized),
    );
};
