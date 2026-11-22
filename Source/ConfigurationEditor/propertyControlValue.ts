// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { PropertyDescriptor } from './PropertyDescriptor';
import type { PropertyControlsLabels } from './PropertyControlsLabels';

const isUnset = (value: unknown) => value === undefined || value === null || value === '';

/** Presents a locked value with the descriptor's label and unit conventions. */
export const displayPropertyValue = (descriptor: PropertyDescriptor, value: unknown, labels: Required<PropertyControlsLabels>): string => {
    if (isUnset(value)) return labels.unset;
    if (descriptor.kind === 'boolean') return value === true ? labels.on : labels.off;
    if (descriptor.kind === 'choice') return descriptor.options.find((option) => option.value === value)?.label ?? String(value);
    if (descriptor.kind === 'number' && descriptor.unit) return `${String(value)} ${descriptor.unit}`;
    return String(value);
};

/** Parses a number draft before it is proposed to the host. */
export const parsePropertyNumber = (
    text: string,
    descriptor: Extract<PropertyDescriptor, { kind: 'number' }>,
    labels: Required<PropertyControlsLabels>,
): { value: number | undefined } | { message: string } => {
    if (text.trim().length === 0) return descriptor.required ? { message: labels.required } : { value: undefined };
    const parsed = Number(text);
    if (!Number.isFinite(parsed)) return { message: labels.notANumber };
    if (descriptor.min !== undefined && parsed < descriptor.min) return { message: labels.belowMinimum(descriptor.min) };
    if (descriptor.max !== undefined && parsed > descriptor.max) return { message: labels.aboveMaximum(descriptor.max) };
    return { value: parsed };
};
