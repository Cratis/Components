// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useLayoutEffect, useRef } from 'react';
import type { NumberInputProps } from './NumberInputProps';
import { normalizeValue, semanticValue } from './numberInputValue';

export const useControlledNumberValue = (
    { value, min, max, step, onChange }: NumberInputProps,
    maximumFractionDigits: number,
) => {
    const controlledValue = semanticValue(value);
    const latestValue = useRef<number | null>(controlledValue);
    latestValue.current = controlledValue;
    const normalizedControlledValue = normalizeValue(controlledValue, { min, max, step }, maximumFractionDigits);
    const normalizationPending = controlledValue !== null && normalizedControlledValue !== controlledValue;
    const normalizationRequest = useRef<{ value: number; normalized: number } | null>(null);

    useLayoutEffect(() => {
        if (
            controlledValue === null ||
            normalizedControlledValue === null ||
            normalizedControlledValue === controlledValue
        ) {
            normalizationRequest.current = null;
            return;
        }
        const previous = normalizationRequest.current;
        if (previous?.value === controlledValue && previous.normalized === normalizedControlledValue) return;
        normalizationRequest.current = { value: controlledValue, normalized: normalizedControlledValue };
        latestValue.current = normalizedControlledValue;
        onChange(normalizedControlledValue);
    }, [controlledValue, normalizedControlledValue, onChange]);

    const emitChange = (nextValue: number) => {
        const nextSemanticValue = normalizeValue(semanticValue(nextValue), { min, max, step }, maximumFractionDigits);
        latestValue.current = nextSemanticValue;
        onChange(nextSemanticValue);
    };

    return { controlledValue, latestValue, normalizationPending, emitChange };
};
