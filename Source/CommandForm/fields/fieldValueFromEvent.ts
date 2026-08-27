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
 * `CommandFormFieldConfig.extractValue` is declared `(event: unknown) => TValue` so every
 * field type shares one contract regardless of its underlying control. Under strict
 * TypeScript a field can no longer declare its `extractValue` against a concrete
 * `React.ChangeEvent<...>` — the narrower parameter type fails contravariant function
 * assignability against `(event: unknown) => TValue`. This helper keeps field components
 * strictly typed by doing the one runtime-checked narrowing every field needs, with an
 * overload per property so callers still get a precise return type.
 * Internal to the command-field implementation.
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
