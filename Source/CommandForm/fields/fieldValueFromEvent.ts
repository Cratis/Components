// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object';

const eventTargetOf = (event: unknown): Record<string, unknown> => {
    if (!isRecord(event) || !isRecord(event.target)) {
        throw new TypeError('Expected a field event with an object target');
    }

    return event.target;
};

/**
 * Extracts a primitive value from a native form field's change event target.
 *
 * Retained as an internal safety helper for custom or legacy Arc field adapters whose
 * `CommandFormFieldConfig.extractValue` still receives `unknown`. Components-owned fields
 * now extract semantic values at their DOM or React Aria boundaries before invoking Arc,
 * so no production field relies on event-shaped values. The overloads remain available to
 * relative-imported adapters and keep runtime narrowing explicit.
 */
export function fieldValueFromEvent(event: unknown, property: 'checked'): boolean;
export function fieldValueFromEvent(event: unknown, property: 'value'): string;
export function fieldValueFromEvent(event: unknown, property: 'valueAsNumber'): number;
export function fieldValueFromEvent(
    event: unknown,
    property: 'checked' | 'value' | 'valueAsNumber',
): boolean | string | number {
    const value = eventTargetOf(event)[property];

    if (property === 'checked' && typeof value === 'boolean') return value;
    if (property === 'value' && typeof value === 'string') return value;
    if (property === 'valueAsNumber' && typeof value === 'number') return value;

    throw new TypeError(
        `Expected field event target.${property} to have the matching primitive type`,
    );
}
