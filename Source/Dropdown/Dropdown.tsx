// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import type {
    ButtonHTMLAttributes,
    CSSProperties,
    FocusEventHandler,
    HTMLAttributes,
    InputHTMLAttributes,
    JSX,
    Key,
    SelectHTMLAttributes,
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
    ComboBoxValue,
    Input,
    ListBox as ComboBoxListBox,
    ListBoxItem as ComboBoxListBoxItem,
    Popover as ComboBoxPopover,
} from 'react-aria-components/ComboBox';
import { useCratisComponentsConfig } from '../Common/CratisComponentsProvider';
import type { ChangeHandler } from '../types/ChangeHandler';
import {
    asReactAriaButtonProps,
    asReactAriaListBoxItemProps,
    asReactAriaListBoxProps,
} from '../Common/reactAriaProps';

type DropdownTriggerAttributes = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'tabIndex' | 'value'
>;

type DropdownOptionValue =
    string | number | boolean | bigint | symbol | object | null | undefined;

/** Narrow migration aliases shared by the legacy `input` and `select` keys. */
interface DropdownLegacyControlAttributes {
    id?: string;
    className?: string;
    style?: CSSProperties;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling';
}

/** Stable Cratis-owned parts for styling a {@link Dropdown}. */
export interface DropdownParts {
    /** Outer Dropdown wrapper. */
    root?: HTMLAttributes<HTMLElement>;
    /** Legacy visible-control part, mapped onto the current trigger/filter input. */
    input?: DropdownLegacyControlAttributes;
    /** Legacy select-root alias for class, style, identity, and ARIA migration. */
    select?: DropdownLegacyControlAttributes;
    /** Single-select trigger or filtered options button. */
    trigger?: DropdownTriggerAttributes;
    /** Selected value display. */
    value?: HTMLAttributes<HTMLSpanElement>;
    /** Selection clear button. */
    clear?: ButtonHTMLAttributes<HTMLButtonElement>;
    /** Dropdown indicator. */
    indicator?: HTMLAttributes<HTMLSpanElement>;
    /** Portaled options popover. */
    popover?: HTMLAttributes<HTMLDivElement>;
    /** Options listbox. */
    listbox?: HTMLAttributes<HTMLDivElement>;
    /** One option. */
    option?: HTMLAttributes<HTMLDivElement>;
    /** Filter input. */
    filter?: InputHTMLAttributes<HTMLInputElement>;
    /** Native multiple-select element used when filtering is off. */
    multiple?: SelectHTMLAttributes<HTMLSelectElement>;
}

/** Props for {@link Dropdown}. */
export interface DropdownProps<T = unknown> {
    /** Controlled selected value, or selected-value array in multiple mode. */
    value?: T;
    /** Available scalar values or option objects. */
    options?: unknown[];
    /** Property containing an option object's visible label. */
    optionLabel?: string;
    /** Property containing an option object's bound value. */
    optionValue?: string;
    /** Empty-selection text. */
    placeholder?: string;
    /** Enables the filterable combobox path. */
    filter?: boolean;
    /** Filter-input placeholder. */
    filterPlaceholder?: string;
    /** Enables multiple selection. */
    multiple?: boolean;
    /** Shows a clear-selection action. */
    showClear?: boolean;
    /** Marks the control invalid. */
    invalid?: boolean;
    /** Disables every control and clear action. */
    disabled?: boolean;
    /** Extra class name for the outer wrapper. */
    className?: string;
    /** Inline style for the outer wrapper. */
    style?: CSSProperties;
    /** DOM identity of the focusable primary control. */
    id?: string;
    /** Legacy identity alias mapped to {@link id}. */
    inputId?: string;
    /** Legacy popup class alias mapped to the `popover` part. */
    panelClassName?: string;
    /** Native form field name. */
    name?: string;
    /** Primary-control tab order. */
    tabIndex?: number;
    /** Accessible control name. */
    'aria-label'?: string;
    /** Id of an external labeling element. */
    'aria-labelledby'?: string;
    /** Id(s) of external descriptions. */
    'aria-describedby'?: string;
    /** Camel-case aliases retained for existing product wrappers. */
    ariaLabel?: string;
    /** Legacy camel-case alias for `aria-labelledby`. */
    ariaLabelledBy?: string;
    /** Legacy camel-case alias for `aria-describedby`. */
    ariaDescribedBy?: string;
    /** Legacy invalid-state alias. */
    ariaInvalid?: boolean;
    /** Invoked with the selected value(s) and optional change-origin metadata. */
    onChange?: ChangeHandler<T>;
    /** Invoked when focus leaves the Dropdown wrapper. */
    onBlur?: FocusEventHandler<HTMLElement>;
    /** Cratis-owned per-part attributes. */
    pt?: DropdownParts;
    /**
     * @deprecated Cratis parts always merge. Remove this renderer-era option.
     */
    ptOptions?: object;
    /**
     * @deprecated Components always uses consumer-owned CSS. Customize through `pt` and CSS instead.
     */
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
    if (!field || option === null || typeof option !== 'object')
        return optionValue(option);
    return field in option
        ? optionValue((option as Record<string, unknown>)[field])
        : optionValue(option);
};

const resolveOptions = (
    options: unknown[] | undefined,
    optionLabel: string | undefined,
    optionValue: string | undefined,
): ResolvedOption[] =>
    (options ?? []).map((option, index) => {
        const value = readField(option, optionValue);
        const labelValue = readField(option, optionLabel);
        const keyValue = value ?? index;
        const disabled =
            option !== null && typeof option === 'object' && 'disabled' in option
                ? Boolean((option as { disabled?: unknown }).disabled)
                : false;

        return {
            key: `${typeof keyValue}:${String(keyValue)}:${index}`,
            label: String(labelValue ?? value ?? ''),
            value,
            disabled,
        };
    });

const classNames = (...values: Array<string | undefined>) =>
    values.filter(Boolean).join(' ');

const renderTriggerWithOpenState = (props: JSX.IntrinsicElements['button']) => (
    <button
        {...props}
        data-open={
            props['aria-expanded'] === true || props['aria-expanded'] === 'true'
                ? true
                : undefined
        }
    />
);

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
    inputId,
    panelClassName,
    name,
    tabIndex,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    ariaLabel: ariaLabelAlias,
    ariaLabelledBy,
    ariaDescribedBy,
    ariaInvalid,
    onChange,
    onBlur,
    pt,
}: DropdownProps<T>) => {
    const [isOpen, setIsOpen] = useState(false);
    const { messages } = useCratisComponentsConfig();
    const dropdownMessages = messages?.dropdown;
    const showOptionsLabel =
        pt?.trigger?.['aria-label'] ??
        pt?.select?.['aria-label'] ??
        dropdownMessages?.showOptions ??
        'Show options';
    const clearSelectionLabel =
        pt?.clear?.['aria-label'] ??
        dropdownMessages?.clearSelection ??
        'Clear selection';
    const resolvedOptions = resolveOptions(options, optionLabel, optionValue);
    const selectedOption = resolvedOptions.find((option) =>
        Object.is(option.value, value),
    );
    const selectedKey = selectedOption?.key ?? null;
    const effectiveAriaLabel =
        ariaLabel ??
        ariaLabelAlias ??
        pt?.input?.['aria-label'] ??
        pt?.select?.['aria-label'];
    const effectiveAriaLabelledby =
        ariaLabelledby ??
        ariaLabelledBy ??
        pt?.input?.['aria-labelledby'] ??
        pt?.select?.['aria-labelledby'];
    const effectiveAriaDescribedby =
        ariaDescribedby ??
        ariaDescribedBy ??
        pt?.input?.['aria-describedby'] ??
        pt?.select?.['aria-describedby'];
    const inputAriaInvalid = pt?.input?.['aria-invalid'] ?? pt?.select?.['aria-invalid'];
    const effectiveInvalid =
        invalid ??
        ariaInvalid ??
        (inputAriaInvalid === true ||
            inputAriaInvalid === 'true' ||
            inputAriaInvalid === 'grammar' ||
            inputAriaInvalid === 'spelling');
    const rootClassName = classNames(
        'cratis-dropdown',
        pt?.root?.className,
        pt?.select?.className,
        className,
    );
    const triggerId = id ?? inputId ?? pt?.trigger?.id ?? pt?.input?.id ?? pt?.select?.id;

    const selectOption = (key: Key | null) => {
        const option = resolvedOptions.find((candidate) => candidate.key === String(key));
        onChange?.((option?.value ?? null) as T, { source: 'user' });
    };
    const selectOptions = (keys: readonly Key[]) => {
        const selectedKeys = new Set(keys.map(String));
        const values = resolvedOptions
            .filter((option) => selectedKeys.has(option.key))
            .map((option) => option.value);
        onChange?.(values as T, { source: 'user' });
    };
    // React Aria's Select trigger context does not forward aria-invalid from its Button child.
    // Keep the Cratis validation contract on the actual focusable control after context props merge.
    const applyTriggerState = (element: HTMLButtonElement | null) => {
        if (!element) return;
        if (effectiveInvalid) element.setAttribute('aria-invalid', 'true');
        else element.removeAttribute('aria-invalid');
        if (tabIndex !== undefined) element.tabIndex = tabIndex;
    };

    if (multiple) {
        const selectedValues = Array.isArray(value) ? value : [];
        const selectedKeys = resolvedOptions
            .filter((option) =>
                selectedValues.some((selected) => Object.is(selected, option.value)),
            )
            .map((option) => option.key);

        if (filter) {
            return (
                <span
                    {...pt?.root}
                    className={rootClassName}
                    data-cratis-part='root'
                    data-invalid={effectiveInvalid || undefined}
                    data-disabled={disabled || undefined}
                    data-open={isOpen || undefined}
                    data-selected={selectedKeys.length > 0 || undefined}
                    style={{ ...pt?.root?.style, ...pt?.select?.style, ...style }}
                    onBlur={onBlur}
                >
                    <ComboBox
                        selectionMode='multiple'
                        onOpenChange={setIsOpen}
                        value={selectedKeys}
                        onChange={selectOptions}
                        isDisabled={disabled}
                        isInvalid={effectiveInvalid}
                        name={name}
                        aria-label={effectiveAriaLabel}
                        aria-labelledby={effectiveAriaLabelledby}
                        aria-describedby={effectiveAriaDescribedby}
                        allowsEmptyCollection
                        className='cratis-dropdown__combobox'
                    >
                        <ComboBoxValue
                            {...pt?.value}
                            placeholder={placeholder}
                            className={classNames(
                                'cratis-dropdown__value',
                                pt?.value?.className,
                            )}
                            data-cratis-part='value'
                            data-disabled={disabled || undefined}
                            data-invalid={effectiveInvalid || undefined}
                            data-open={isOpen || undefined}
                            data-selected={selectedKeys.length > 0 || undefined}
                        />
                        <Input
                            {...pt?.filter}
                            id={triggerId}
                            placeholder={filterPlaceholder ?? placeholder}
                            tabIndex={tabIndex}
                            aria-invalid={effectiveInvalid || undefined}
                            className={classNames(
                                'cratis-dropdown__filter',
                                pt?.input?.className,
                                pt?.filter?.className,
                            )}
                            style={{ ...pt?.input?.style, ...pt?.filter?.style }}
                            data-cratis-part='filter'
                            data-disabled={disabled || undefined}
                            data-invalid={effectiveInvalid || undefined}
                            data-open={isOpen || undefined}
                        />
                        <ComboBoxButton
                            {...asReactAriaButtonProps(pt?.trigger)}
                            className={classNames(
                                'cratis-dropdown__indicator',
                                pt?.trigger?.className,
                            )}
                            data-cratis-part='trigger'
                            data-disabled={disabled || undefined}
                            data-invalid={effectiveInvalid || undefined}
                            data-selected={selectedKeys.length > 0 || undefined}
                            render={renderTriggerWithOpenState}
                            aria-label={showOptionsLabel}
                        >
                            <span aria-hidden='true'>⌄</span>
                        </ComboBoxButton>
                        {showClear && selectedKeys.length > 0 && (
                            <button
                                {...pt?.clear}
                                type='button'
                                disabled={disabled}
                                className={classNames(
                                    'cratis-dropdown__clear',
                                    pt?.clear?.className,
                                )}
                                data-cratis-part='clear'
                                data-disabled={disabled || undefined}
                                aria-label={clearSelectionLabel}
                                onClick={(event) =>
                                    onChange?.([] as T, {
                                        source: 'user',
                                        nativeEvent: event.nativeEvent,
                                    })
                                }
                            >
                                <span aria-hidden='true'>×</span>
                            </button>
                        )}
                        <ComboBoxPopover
                            {...pt?.popover}
                            className={classNames(
                                'cratis-dropdown__popover',
                                pt?.popover?.className,
                                panelClassName,
                            )}
                            style={{
                                zIndex: 'var(--cratis-z-index-overlay)',
                                ...pt?.popover?.style,
                            }}
                            data-cratis-part='popover'
                            data-open
                        >
                            <ComboBoxListBox
                                {...asReactAriaListBoxProps<ResolvedOption>(pt?.listbox)}
                                items={resolvedOptions}
                                className={classNames(
                                    'cratis-dropdown__listbox',
                                    pt?.listbox?.className,
                                )}
                                data-cratis-part='listbox'
                                data-open
                            >
                                {(option) => (
                                    <ComboBoxListBoxItem
                                        {...asReactAriaListBoxItemProps<ResolvedOption>(
                                            pt?.option,
                                        )}
                                        id={option.key}
                                        textValue={option.label}
                                        isDisabled={option.disabled}
                                        className={classNames(
                                            'cratis-dropdown__option',
                                            pt?.option?.className,
                                        )}
                                        data-cratis-part='option'
                                        data-disabled={option.disabled || undefined}
                                        data-selected={
                                            selectedKeys.includes(option.key) || undefined
                                        }
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
                data-invalid={effectiveInvalid || undefined}
                data-disabled={disabled || undefined}
                data-selected={selectedKeys.length > 0 || undefined}
                style={{ ...pt?.root?.style, ...pt?.select?.style, ...style }}
                onBlur={onBlur}
            >
                <select
                    {...pt?.multiple}
                    id={triggerId ?? pt?.multiple?.id}
                    name={name}
                    multiple
                    disabled={disabled}
                    value={selectedKeys}
                    tabIndex={tabIndex}
                    aria-label={effectiveAriaLabel}
                    aria-labelledby={effectiveAriaLabelledby}
                    aria-describedby={effectiveAriaDescribedby}
                    aria-invalid={effectiveInvalid || undefined}
                    className={classNames(
                        'cratis-dropdown__multiple',
                        pt?.input?.className,
                        pt?.multiple?.className,
                    )}
                    data-cratis-part='multiple'
                    data-disabled={disabled || undefined}
                    data-invalid={effectiveInvalid || undefined}
                    data-selected={selectedKeys.length > 0 || undefined}
                    onChange={(event) => {
                        const keys = Array.from(
                            event.currentTarget.selectedOptions,
                            (option) => option.value,
                        );
                        const values = resolvedOptions
                            .filter((option) => keys.includes(option.key))
                            .map((option) => option.value);
                        onChange?.(values as T, {
                            source: 'user',
                            nativeEvent: event.nativeEvent,
                        });
                    }}
                >
                    {resolvedOptions.map((option) => (
                        <option
                            key={option.key}
                            value={option.key}
                            disabled={option.disabled}
                            data-disabled={option.disabled || undefined}
                            data-selected={selectedKeys.includes(option.key) || undefined}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
                {showClear && selectedKeys.length > 0 && (
                    <button
                        {...pt?.clear}
                        type='button'
                        disabled={disabled}
                        className={classNames(
                            'cratis-dropdown__clear',
                            pt?.clear?.className,
                        )}
                        data-cratis-part='clear'
                        data-disabled={disabled || undefined}
                        aria-label={clearSelectionLabel}
                        onClick={(event) =>
                            onChange?.([] as T, {
                                source: 'user',
                                nativeEvent: event.nativeEvent,
                            })
                        }
                    >
                        <span aria-hidden='true'>×</span>
                    </button>
                )}
            </span>
        );
    }

    if (filter) {
        return (
            <span
                {...pt?.root}
                className={rootClassName}
                data-cratis-part='root'
                data-invalid={effectiveInvalid || undefined}
                data-disabled={disabled || undefined}
                data-open={isOpen || undefined}
                data-selected={selectedKey !== null || undefined}
                style={{ ...pt?.root?.style, ...pt?.select?.style, ...style }}
                onBlur={onBlur}
            >
                <ComboBox
                    onOpenChange={setIsOpen}
                    value={selectedKey}
                    onChange={selectOption}
                    isDisabled={disabled}
                    isInvalid={effectiveInvalid}
                    name={name}
                    aria-label={effectiveAriaLabel}
                    aria-labelledby={effectiveAriaLabelledby}
                    aria-describedby={effectiveAriaDescribedby}
                    allowsEmptyCollection
                    className='cratis-dropdown__combobox'
                >
                    <Input
                        {...pt?.filter}
                        id={triggerId}
                        placeholder={filterPlaceholder ?? placeholder}
                        tabIndex={tabIndex}
                        aria-invalid={effectiveInvalid || undefined}
                        className={classNames(
                            'cratis-dropdown__filter',
                            pt?.input?.className,
                            pt?.filter?.className,
                        )}
                        style={{ ...pt?.input?.style, ...pt?.filter?.style }}
                        data-cratis-part='filter'
                        data-disabled={disabled || undefined}
                        data-invalid={effectiveInvalid || undefined}
                        data-open={isOpen || undefined}
                    />
                    <ComboBoxButton
                        {...asReactAriaButtonProps(pt?.trigger)}
                        className={classNames(
                            'cratis-dropdown__indicator',
                            pt?.trigger?.className,
                        )}
                        data-cratis-part='trigger'
                        data-disabled={disabled || undefined}
                        data-invalid={effectiveInvalid || undefined}
                        data-selected={selectedKey !== null || undefined}
                        render={renderTriggerWithOpenState}
                        aria-label={showOptionsLabel}
                    >
                        <span aria-hidden='true'>⌄</span>
                    </ComboBoxButton>
                    {showClear && selectedKey !== null && (
                        <button
                            {...pt?.clear}
                            type='button'
                            disabled={disabled}
                            className={classNames(
                                'cratis-dropdown__clear',
                                pt?.clear?.className,
                            )}
                            data-cratis-part='clear'
                            data-disabled={disabled || undefined}
                            aria-label={clearSelectionLabel}
                            onClick={(event) =>
                                onChange?.(null as T, {
                                    source: 'user',
                                    nativeEvent: event.nativeEvent,
                                })
                            }
                        >
                            <span aria-hidden='true'>×</span>
                        </button>
                    )}
                    <ComboBoxPopover
                        {...pt?.popover}
                        className={classNames(
                            'cratis-dropdown__popover',
                            pt?.popover?.className,
                            panelClassName,
                        )}
                        style={{
                            zIndex: 'var(--cratis-z-index-overlay)',
                            ...pt?.popover?.style,
                        }}
                        data-cratis-part='popover'
                        data-open
                    >
                        <ComboBoxListBox
                            {...asReactAriaListBoxProps<ResolvedOption>(pt?.listbox)}
                            items={resolvedOptions}
                            className={classNames(
                                'cratis-dropdown__listbox',
                                pt?.listbox?.className,
                            )}
                            data-cratis-part='listbox'
                            data-open
                        >
                            {(option) => (
                                <ComboBoxListBoxItem
                                    {...asReactAriaListBoxItemProps<ResolvedOption>(
                                        pt?.option,
                                    )}
                                    id={option.key}
                                    textValue={option.label}
                                    isDisabled={option.disabled}
                                    className={classNames(
                                        'cratis-dropdown__option',
                                        pt?.option?.className,
                                    )}
                                    data-cratis-part='option'
                                    data-disabled={option.disabled || undefined}
                                    data-selected={
                                        option.key === selectedKey || undefined
                                    }
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
            data-invalid={effectiveInvalid || undefined}
            data-disabled={disabled || undefined}
            data-open={isOpen || undefined}
            data-selected={selectedKey !== null || undefined}
            style={{ ...pt?.root?.style, ...pt?.select?.style, ...style }}
            onBlur={onBlur}
        >
            <AriaSelect
                onOpenChange={setIsOpen}
                value={selectedKey}
                onChange={selectOption}
                isDisabled={disabled}
                isInvalid={effectiveInvalid}
                name={name}
                aria-label={effectiveAriaLabel}
                aria-labelledby={effectiveAriaLabelledby}
                aria-describedby={effectiveAriaDescribedby}
                className='cratis-dropdown__select'
            >
                <AriaButton
                    {...asReactAriaButtonProps(pt?.trigger)}
                    ref={applyTriggerState}
                    id={triggerId}
                    excludeFromTabOrder={tabIndex === -1}
                    aria-invalid={effectiveInvalid || undefined}
                    className={classNames(
                        'cratis-dropdown__trigger',
                        pt?.input?.className,
                        pt?.trigger?.className,
                    )}
                    style={{ ...pt?.input?.style, ...pt?.trigger?.style }}
                    data-cratis-part='trigger'
                    data-disabled={disabled || undefined}
                    data-invalid={effectiveInvalid || undefined}
                    data-selected={selectedKey !== null || undefined}
                    render={renderTriggerWithOpenState}
                >
                    <SelectValue
                        {...pt?.value}
                        className={classNames(
                            'cratis-dropdown__value',
                            pt?.value?.className,
                        )}
                        data-cratis-part='value'
                        data-disabled={disabled || undefined}
                        data-invalid={effectiveInvalid || undefined}
                        data-open={isOpen || undefined}
                        data-selected={selectedKey !== null || undefined}
                    >
                        {selectedOption?.label ?? placeholder}
                    </SelectValue>
                    <span
                        {...pt?.indicator}
                        className={classNames(
                            'cratis-dropdown__indicator',
                            pt?.indicator?.className,
                        )}
                        data-cratis-part='indicator'
                        data-disabled={disabled || undefined}
                        data-invalid={effectiveInvalid || undefined}
                        data-open={isOpen || undefined}
                        aria-hidden='true'
                    >
                        ⌄
                    </span>
                </AriaButton>
                {showClear && selectedKey !== null && (
                    <button
                        {...pt?.clear}
                        type='button'
                        disabled={disabled}
                        className={classNames(
                            'cratis-dropdown__clear',
                            pt?.clear?.className,
                        )}
                        data-cratis-part='clear'
                        data-disabled={disabled || undefined}
                        aria-label={clearSelectionLabel}
                        onClick={(event) =>
                            onChange?.(null as T, {
                                source: 'user',
                                nativeEvent: event.nativeEvent,
                            })
                        }
                    >
                        <span aria-hidden='true'>×</span>
                    </button>
                )}
                <Popover
                    {...pt?.popover}
                    className={classNames(
                        'cratis-dropdown__popover',
                        pt?.popover?.className,
                        panelClassName,
                    )}
                    style={{
                        zIndex: 'var(--cratis-z-index-overlay)',
                        ...pt?.popover?.style,
                    }}
                    data-cratis-part='popover'
                    data-open
                >
                    <ListBox
                        {...asReactAriaListBoxProps<ResolvedOption>(pt?.listbox)}
                        items={resolvedOptions}
                        className={classNames(
                            'cratis-dropdown__listbox',
                            pt?.listbox?.className,
                        )}
                        data-cratis-part='listbox'
                        data-open
                    >
                        {(option) => (
                            <ListBoxItem
                                {...asReactAriaListBoxItemProps<ResolvedOption>(
                                    pt?.option,
                                )}
                                id={option.key}
                                textValue={option.label}
                                isDisabled={option.disabled}
                                className={classNames(
                                    'cratis-dropdown__option',
                                    pt?.option?.className,
                                )}
                                data-cratis-part='option'
                                data-disabled={option.disabled || undefined}
                                data-selected={option.key === selectedKey || undefined}
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
