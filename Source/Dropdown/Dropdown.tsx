// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type {
    ButtonHTMLAttributes,
    CSSProperties,
    FocusEventHandler,
    HTMLAttributes,
    InputHTMLAttributes,
    Key,
    SelectHTMLAttributes,
    SyntheticEvent,
} from 'react';
import {
    Button as AriaButton,
    ListBox,
    ListBoxItem,
    Popover,
    Select as AriaSelect,
    SelectValue,
} from 'react-aria-components/Select';
import {
    Button as ComboBoxButton,
    ComboBox,
    Input,
    ListBox as ComboBoxListBox,
    ListBoxItem as ComboBoxListBoxItem,
    Popover as ComboBoxPopover,
} from 'react-aria-components/ComboBox';

/** Change event emitted by {@link Dropdown}. */
export interface DropdownChangeEvent<T = unknown> {
    /** Newly selected value, or an array when `multiple` is set. */
    value: T;
    /** Underlying event when the native multiple-select path produced the change. */
    originalEvent?: SyntheticEvent;
}

type DropdownTriggerAttributes = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'tabIndex' | 'value'
>;

type DropdownOptionValue =
    | string
    | number
    | boolean
    | bigint
    | symbol
    | object
    | null
    | undefined;

/** Stable Cratis-owned parts for styling a {@link Dropdown}. */
export interface DropdownParts {
    root?: HTMLAttributes<HTMLElement>;
    trigger?: DropdownTriggerAttributes;
    value?: HTMLAttributes<HTMLSpanElement>;
    clear?: ButtonHTMLAttributes<HTMLButtonElement>;
    indicator?: HTMLAttributes<HTMLSpanElement>;
    popover?: HTMLAttributes<HTMLDivElement>;
    listbox?: HTMLAttributes<HTMLDivElement>;
    option?: HTMLAttributes<HTMLDivElement>;
    filter?: InputHTMLAttributes<HTMLInputElement>;
    multiple?: SelectHTMLAttributes<HTMLSelectElement>;
}

/** Props for {@link Dropdown}. */
export interface DropdownProps<T = unknown> {
    value?: T;
    options?: unknown[];
    optionLabel?: string;
    optionValue?: string;
    placeholder?: string;
    filter?: boolean;
    filterPlaceholder?: string;
    multiple?: boolean;
    showClear?: boolean;
    invalid?: boolean;
    disabled?: boolean;
    className?: string;
    style?: CSSProperties;
    id?: string;
    name?: string;
    tabIndex?: number;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    onChange?: (event: DropdownChangeEvent<T>) => void;
    onBlur?: FocusEventHandler<HTMLElement>;
    /** Cratis-owned per-part attributes. */
    pt?: DropdownParts;
    /** Retained for source compatibility; Cratis parts always merge. */
    ptOptions?: object;
    /** Retained for source compatibility; consumers always own the CSS. */
    unstyled?: boolean;
}

interface ResolvedOption {
    key: string;
    label: string;
    value: unknown;
    disabled: boolean;
}

const conventionalField = (
    options: unknown[] | undefined,
    field: 'label' | 'value',
): string | undefined => {
    const first = options?.[0];
    return first !== null && typeof first === 'object' && field in first
        ? field
        : undefined;
};

const optionValue = (value: unknown): DropdownOptionValue => {
    if (typeof value === 'function') return String(value);
    return value as DropdownOptionValue;
};

const readField = (option: unknown, field: string | undefined): DropdownOptionValue => {
    if (!field || option === null || typeof option !== 'object') return optionValue(option);
    return field in option
        ? optionValue((option as Record<string, unknown>)[field])
        : optionValue(option);
};

const resolveOptions = (
    options: unknown[] | undefined,
    optionLabel: string | undefined,
    optionValue: string | undefined,
): ResolvedOption[] => (options ?? []).map((option, index) => {
    const value = readField(option, optionValue);
    const labelValue = readField(option, optionLabel);
    const keyValue = value ?? index;
    const disabled = option !== null && typeof option === 'object' && 'disabled' in option
        ? Boolean((option as { disabled?: unknown }).disabled)
        : false;

    return {
        key: `${typeof keyValue}:${String(keyValue)}:${index}`,
        label: String(labelValue ?? value ?? ''),
        value,
        disabled,
    };
});

const classNames = (...values: Array<string | undefined>) => values.filter(Boolean).join(' ');

/** A renderer-independent single or multiple select with stable Cratis parts. */
export const Dropdown = <T = unknown,>({
    value,
    options,
    optionLabel = conventionalField(options, 'label'),
    optionValue = conventionalField(options, 'value'),
    placeholder,
    filter,
    filterPlaceholder,
    multiple,
    showClear,
    invalid,
    disabled,
    className,
    style,
    id,
    name,
    tabIndex,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    onChange,
    onBlur,
    pt,
}: DropdownProps<T>) => {
    const resolvedOptions = resolveOptions(options, optionLabel, optionValue);
    const selectedOption = resolvedOptions.find(option => Object.is(option.value, value));
    const selectedKey = selectedOption?.key ?? null;
    const rootClassName = classNames('cratis-dropdown', pt?.root?.className, className);
    const triggerId = id ?? pt?.trigger?.id;

    const selectOption = (key: Key | null) => {
        const option = resolvedOptions.find(candidate => candidate.key === String(key));
        onChange?.({ value: (option?.value ?? null) as T });
    };

    if (multiple) {
        const selectedValues = Array.isArray(value) ? value : [];
        const selectedKeys = resolvedOptions
            .filter(option => selectedValues.some(selected => Object.is(selected, option.value)))
            .map(option => option.key);

        return (
            <span
                {...pt?.root}
                className={rootClassName}
                data-cratis-part='root'
                data-invalid={invalid || undefined}
                data-disabled={disabled || undefined}
                style={{ ...pt?.root?.style, ...style }}
                onBlur={onBlur}
            >
                <select
                    {...pt?.multiple}
                    id={id ?? pt?.multiple?.id}
                    name={name}
                    multiple
                    disabled={disabled}
                    value={selectedKeys}
                    tabIndex={tabIndex}
                    aria-label={ariaLabel}
                    aria-labelledby={ariaLabelledby}
                    aria-describedby={ariaDescribedby}
                    aria-invalid={invalid || undefined}
                    className={classNames('cratis-dropdown__multiple', pt?.multiple?.className)}
                    data-cratis-part='multiple'
                    onChange={event => {
                        const keys = Array.from(event.currentTarget.selectedOptions, option => option.value);
                        const values = resolvedOptions
                            .filter(option => keys.includes(option.key))
                            .map(option => option.value);
                        onChange?.({ value: values as T, originalEvent: event });
                    }}
                >
                    {resolvedOptions.map(option => (
                        <option key={option.key} value={option.key} disabled={option.disabled}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </span>
        );
    }

    if (filter) {
        return (
            <span
                {...pt?.root}
                className={rootClassName}
                data-cratis-part='root'
                data-invalid={invalid || undefined}
                data-disabled={disabled || undefined}
                style={{ ...pt?.root?.style, ...style }}
                onBlur={onBlur}
            >
                <ComboBox
                    selectedKey={selectedKey}
                    onSelectionChange={selectOption}
                    isDisabled={disabled}
                    name={name}
                    aria-label={ariaLabel}
                    aria-labelledby={ariaLabelledby}
                    aria-describedby={ariaDescribedby}
                    allowsEmptyCollection
                    className='cratis-dropdown__combobox'
                >
                    <Input
                        {...pt?.filter}
                        id={triggerId}
                        placeholder={filterPlaceholder ?? placeholder}
                        tabIndex={tabIndex}
                        aria-invalid={invalid || undefined}
                        className={classNames('cratis-dropdown__filter', pt?.filter?.className)}
                        data-cratis-part='filter'
                    />
                    <ComboBoxButton
                        {...pt?.trigger}
                        className={classNames('cratis-dropdown__indicator', pt?.trigger?.className)}
                        data-cratis-part='trigger'
                        aria-label={pt?.trigger?.['aria-label'] ?? 'Show options'}
                    >
                        <span aria-hidden='true'>⌄</span>
                    </ComboBoxButton>
                    {showClear && selectedKey !== null && (
                        <button
                            {...pt?.clear}
                            type='button'
                            className={classNames('cratis-dropdown__clear', pt?.clear?.className)}
                            data-cratis-part='clear'
                            aria-label={pt?.clear?.['aria-label'] ?? 'Clear selection'}
                            onClick={() => onChange?.({ value: null as T })}
                        >
                            <span aria-hidden='true'>×</span>
                        </button>
                    )}
                    <ComboBoxPopover
                        {...pt?.popover}
                        className={classNames('cratis-dropdown__popover', pt?.popover?.className)}
                        data-cratis-part='popover'
                    >
                        <ComboBoxListBox
                            items={resolvedOptions}
                            className={classNames('cratis-dropdown__listbox', pt?.listbox?.className)}
                            data-cratis-part='listbox'
                        >
                            {option => (
                                <ComboBoxListBoxItem
                                    id={option.key}
                                    textValue={option.label}
                                    isDisabled={option.disabled}
                                    className={classNames('cratis-dropdown__option', pt?.option?.className)}
                                    data-cratis-part='option'
                                >
                                    {option.label}
                                </ComboBoxListBoxItem>
                            )}
                        </ComboBoxListBox>
                    </ComboBoxPopover>
                </ComboBox>
            </span>
        );
    }

    return (
        <span
            {...pt?.root}
            className={rootClassName}
            data-cratis-part='root'
            data-invalid={invalid || undefined}
            data-disabled={disabled || undefined}
            style={{ ...pt?.root?.style, ...style }}
            onBlur={onBlur}
        >
            <AriaSelect
                selectedKey={selectedKey}
                onSelectionChange={selectOption}
                isDisabled={disabled}
                name={name}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledby}
                aria-describedby={ariaDescribedby}
                className='cratis-dropdown__select'
            >
                <AriaButton
                    {...pt?.trigger}
                    id={triggerId}
                    excludeFromTabOrder={tabIndex === -1}
                    aria-invalid={invalid || undefined}
                    className={classNames('cratis-dropdown__trigger', pt?.trigger?.className)}
                    data-cratis-part='trigger'
                >
                    <SelectValue
                        {...pt?.value}
                        className={classNames('cratis-dropdown__value', pt?.value?.className)}
                        data-cratis-part='value'
                    >
                        {selectedOption?.label ?? placeholder}
                    </SelectValue>
                    <span
                        {...pt?.indicator}
                        className={classNames('cratis-dropdown__indicator', pt?.indicator?.className)}
                        data-cratis-part='indicator'
                        aria-hidden='true'
                    >
                        ⌄
                    </span>
                </AriaButton>
                {showClear && selectedKey !== null && (
                    <button
                        {...pt?.clear}
                        type='button'
                        className={classNames('cratis-dropdown__clear', pt?.clear?.className)}
                        data-cratis-part='clear'
                        aria-label={pt?.clear?.['aria-label'] ?? 'Clear selection'}
                        onClick={() => onChange?.({ value: null as T })}
                    >
                        <span aria-hidden='true'>×</span>
                    </button>
                )}
                <Popover
                    {...pt?.popover}
                    className={classNames('cratis-dropdown__popover', pt?.popover?.className)}
                    data-cratis-part='popover'
                >
                    <ListBox
                        items={resolvedOptions}
                        className={classNames('cratis-dropdown__listbox', pt?.listbox?.className)}
                        data-cratis-part='listbox'
                    >
                        {option => (
                            <ListBoxItem
                                id={option.key}
                                textValue={option.label}
                                isDisabled={option.disabled}
                                className={classNames('cratis-dropdown__option', pt?.option?.className)}
                                data-cratis-part='option'
                            >
                                {option.label}
                            </ListBoxItem>
                        )}
                    </ListBox>
                </Popover>
            </AriaSelect>
        </span>
    );
};

Dropdown.displayName = 'Dropdown';
