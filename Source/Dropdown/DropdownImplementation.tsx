// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { JSX, Key, MouseEvent, RefObject } from 'react';
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
    ComboBoxStateContext,
    ComboBoxValue,
    Input,
    ListBox as ComboBoxListBox,
    ListBoxItem as ComboBoxListBoxItem,
    Popover as ComboBoxPopover,
} from 'react-aria-components/ComboBox';
import { UNSAFE_PortalProvider } from 'react-aria';
import { unstable_useOverlayEnvironment } from '../renderer/RendererContext';
import { useCratisComponentsConfig } from '../Common/CratisComponentsProvider';
import { useCratisIcon } from '../configuration/useCratisIcon';
import { OVERLAY_OFFSET, zIndexAboveDialog } from '../renderer/dialogStack';
import { useNearestDialogZIndex } from '../renderer/DialogStackContext';
import type { DropdownProps } from './Dropdown';
import { useExternalLabel } from './useExternalLabel';
import {
    asReactAriaButtonProps,
    asReactAriaListBoxItemProps,
    asReactAriaListBoxProps,
} from '../Common/reactAriaProps';

type DropdownOptionValue =
    string | number | boolean | bigint | symbol | object | null | undefined;

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

/** The part of the ComboBox lifecycle a commit has to reach, from outside the ComboBox subtree. */
interface CommittableComboBox {
    close: () => void;
}

/**
 * Publishes the ComboBox state to the commit handler, which is declared outside the ComboBox and so
 * cannot read the context itself. Renders nothing.
 */
const ComboBoxCommitBridge = ({
    handle,
}: {
    handle: RefObject<CommittableComboBox | null>;
}) => {
    const state = useContext(ComboBoxStateContext);
    useEffect(() => {
        handle.current = state;
        return () => {
            handle.current = null;
        };
    });
    return null;
};

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
export const DropdownImplementation = <T = unknown,>({
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
    const comboBox = useRef<CommittableComboBox | null>(null);
    const { ref: attachExternalLabel, labelledBy: externalLabelledBy } = useExternalLabel();
    const overlayEnvironment = unstable_useOverlayEnvironment();
    const nearestDialogZIndex = useNearestDialogZIndex();
    const resolvedPopoverZIndex =
        nearestDialogZIndex === null
            ? 'var(--cratis-z-index-overlay)'
            : zIndexAboveDialog(nearestDialogZIndex, OVERLAY_OFFSET);
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
    const icon = useCratisIcon();
    const expandIcon = icon('expand', '⌄');
    const clearIcon = icon('clear', '×');
    const resolvedOptions = resolveOptions(options, optionLabel, optionValue);
    // React Aria decides that a selection happened - and only then closes the overlay and syncs the
    // filter text - by watching the key handed to it change. Deriving that key from `value` alone
    // means a consumer that does not feed the emitted value straight back gets a committed selection
    // the Dropdown never acts on: the popup stays open over an unchanged filter. Remembering what the
    // user just committed keeps the commit whole on its own, while an incoming `value` still wins and
    // still drops the memory the moment the consumer answers.
    const [committed, setCommitted] = useState<{
        key: string | null;
        observedValue: unknown;
    } | null>(null);
    const remembered =
        committed !== null && Object.is(committed.observedValue, value)
            ? committed
            : null;
    const remember = (key: string | null) => setCommitted({ key, observedValue: value });
    const selectedOption =
        resolvedOptions.find((option) => Object.is(option.value, value)) ??
        (remembered?.key == null
            ? undefined
            : resolvedOptions.find((option) => option.key === remembered.key));
    const selectedKey = selectedOption?.key ?? null;
    const controlPart = filter ? pt?.filter : multiple ? pt?.multiple : pt?.trigger;
    const effectiveAriaLabel =
        ariaLabel ??
        ariaLabelAlias ??
        pt?.input?.['aria-label'] ??
        pt?.select?.['aria-label'] ??
        controlPart?.['aria-label'];
    const effectiveAriaLabelledby =
        ariaLabelledby ??
        ariaLabelledBy ??
        pt?.input?.['aria-labelledby'] ??
        pt?.select?.['aria-labelledby'] ??
        controlPart?.['aria-labelledby'] ??
        (effectiveAriaLabel ? undefined : externalLabelledBy);
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
        remember(option?.key ?? null);
        onChange?.((option?.value ?? null) as T, { source: 'user' });
        // React Aria hands the closing of a filtered overlay to whoever owns the value, and stands
        // down when that value does not come back as one of the options. Nothing about a committed
        // option is the consumer's to close, so close it here and let the filter text follow the
        // selection the Dropdown ends up showing.
        comboBox.current?.close();
    };
    const clearSelection = (event: MouseEvent<HTMLButtonElement>) => {
        remember(null);
        onChange?.(null as T, { source: 'user', nativeEvent: event.nativeEvent });
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
    const applyTriggerState = useCallback((element: HTMLButtonElement | null) => {
        attachExternalLabel(element);
        if (!element) return;
        // React Aria puts the selected value first. Keep the field label first while
        // preserving the selected-value reference and all other context-generated ids.
        if (effectiveAriaLabelledby) {
            const references = [
                ...effectiveAriaLabelledby.split(/\s+/u),
                ...(element.getAttribute('aria-labelledby') ?? '').split(/\s+/u),
            ].filter(Boolean);
            element.setAttribute('aria-labelledby', [...new Set(references)].join(' '));
        }
        if (effectiveInvalid) element.setAttribute('aria-invalid', 'true');
        else element.removeAttribute('aria-invalid');
        if (tabIndex !== undefined) element.tabIndex = tabIndex;
    }, [effectiveAriaLabelledby, effectiveInvalid, attachExternalLabel, tabIndex]);

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
                    <UNSAFE_PortalProvider getContainer={overlayEnvironment.getContainer}>
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
                                ref={attachExternalLabel}
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
                                <span aria-hidden='true'>{expandIcon}</span>
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
                                    <span aria-hidden='true'>{clearIcon}</span>
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
                                    zIndex: resolvedPopoverZIndex,
                                    ...pt?.popover?.style,
                                }}
                                data-cratis-part='popover'
                                data-open
                            >
                                <ComboBoxListBox
                                    {...asReactAriaListBoxProps<ResolvedOption>(
                                        pt?.listbox,
                                    )}
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
                                                selectedKeys.includes(option.key) ||
                                                undefined
                                            }
                                        >
                                            {option.label}
                                        </ComboBoxListBoxItem>
                                    )}
                                </ComboBoxListBox>
                            </ComboBoxPopover>
                        </ComboBox>
                    </UNSAFE_PortalProvider>
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
                    ref={attachExternalLabel}
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
                        <span aria-hidden='true'>{clearIcon}</span>
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
                <UNSAFE_PortalProvider getContainer={overlayEnvironment.getContainer}>
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
                        <ComboBoxCommitBridge handle={comboBox} />
                        <Input
                            {...pt?.filter}
                            ref={attachExternalLabel}
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
                            <span aria-hidden='true'>{expandIcon}</span>
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
                                onClick={clearSelection}
                            >
                                <span aria-hidden='true'>{clearIcon}</span>
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
                                zIndex: resolvedPopoverZIndex,
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
                </UNSAFE_PortalProvider>
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
            <UNSAFE_PortalProvider getContainer={overlayEnvironment.getContainer}>
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
                            {expandIcon}
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
                            onClick={clearSelection}
                        >
                            <span aria-hidden='true'>{clearIcon}</span>
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
                            zIndex: resolvedPopoverZIndex,
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
                                    data-selected={
                                        option.key === selectedKey || undefined
                                    }
                                >
                                    {option.label}
                                </ListBoxItem>
                            )}
                        </ListBox>
                    </Popover>
                </AriaSelect>
            </UNSAFE_PortalProvider>
        </span>
    );
};

DropdownImplementation.displayName = 'DropdownImplementation';
