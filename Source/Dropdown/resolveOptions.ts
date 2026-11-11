// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export type DropdownOptionValue =
    string | number | boolean | bigint | symbol | object | null | undefined;

export interface ResolvedOption {
    key: string;
    label: string;
    value: unknown;
    disabled: boolean;
}

const isRecord = (candidate: unknown): candidate is Record<string, unknown> =>
    candidate !== null && typeof candidate === 'object';

export const conventionalField = (
    options: unknown[] | undefined,
    field: 'label' | 'value',
): string | undefined => {
    const first = options?.[0];
    return isRecord(first) && field in first ? field : undefined;
};

const optionValue = (value: unknown): DropdownOptionValue => {
    if (typeof value === 'function') return String(value);
    return value as DropdownOptionValue;
};

const readField = (option: unknown, field: string | undefined): DropdownOptionValue => {
    if (!field || !isRecord(option)) return optionValue(option);
    return field in option ? optionValue(option[field]) : optionValue(option);
};

const isDisabledOption = (option: unknown): boolean =>
    isRecord(option) && 'disabled' in option ? Boolean(option.disabled) : false;

/** The keys of the options whose values appear in a multiple selection. */
export const selectedKeysOf = (value: unknown, options: ResolvedOption[]): string[] => {
    const selectedValues = Array.isArray(value) ? value : [];
    return options
        .filter((option) => selectedValues.some((selected) => Object.is(selected, option.value)))
        .map((option) => option.key);
};

export const resolveOptions = (
    options: unknown[] | undefined,
    optionLabel: string | undefined,
    optionValue: string | undefined,
): ResolvedOption[] =>
    (options ?? []).map((option, index) => {
        const value = readField(option, optionValue);
        const labelValue = readField(option, optionLabel);
        const keyValue = value ?? index;

        return {
            key: `${typeof keyValue}:${String(keyValue)}:${index}`,
            label: String(labelValue ?? value ?? ''),
            value,
            disabled: isDisabledOption(option),
        };
    });
