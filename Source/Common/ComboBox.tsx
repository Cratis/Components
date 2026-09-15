// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    useId,
    useMemo,
    useState,
    type CSSProperties,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import type { Key } from 'react';
import {
    Button as AriaButton,
    ComboBox as AriaComboBox,
    Input as AriaInput,
    ListBox as AriaListBox,
    ListBoxItem as AriaListBoxItem,
    Popover as AriaPopover,
} from 'react-aria-components/ComboBox';
import { UNSAFE_PortalProvider } from 'react-aria';
import { unstable_useOverlayEnvironment } from '../renderer/RendererContext';
import { OVERLAY_OFFSET, zIndexAboveDialog } from '../renderer/dialogStack';
import { useNearestDialogZIndex } from '../renderer/DialogStackContext';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';
import {
    asReactAriaButtonProps,
    asReactAriaListBoxItemProps,
    asReactAriaListBoxProps,
} from './reactAriaProps';

/** Attributes a consumer may hand to one {@link ComboBox} part: class, style, title and data attributes. */
export type ComboBoxPartAttributes = Pick<
    HTMLAttributes<HTMLElement>,
    'className' | 'style' | 'title'
> & {
    [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
};

/** One selectable entry of a {@link ComboBox}. */
export interface ComboBoxOption {
    /** Stable identity, reported through `onChange`. */
    key: string;
    /** Primary text; also what typing filters against. */
    label: string;
    /** Secondary text rendered beside or under the label. */
    description?: ReactNode;
    /** Prevents selection while keeping the option visible. */
    disabled?: boolean;
}

/** Stable Cratis-owned parts for styling a {@link ComboBox}. */
export interface ComboBoxParts {
    /** Complete combobox wrapper. */
    root?: ComboBoxPartAttributes;
    /** The text input that owns the `combobox` role. */
    input?: ComboBoxPartAttributes;
    /** The button that opens the list. */
    trigger?: ComboBoxPartAttributes;
    /** Portaled options popover. */
    popover?: ComboBoxPartAttributes;
    /** Options listbox. */
    listbox?: ComboBoxPartAttributes;
    /** One option. */
    option?: ComboBoxPartAttributes;
    /** The label text inside an option. */
    optionLabel?: ComboBoxPartAttributes;
    /** The description text inside an option, when supplied. */
    optionDescription?: ComboBoxPartAttributes;
    /** The message shown while `loading`. */
    loading?: ComboBoxPartAttributes;
    /** The message shown when nothing matches. */
    empty?: ComboBoxPartAttributes;
    /** The inline failure content replacing the list. */
    failure?: ComboBoxPartAttributes;
    /** The footer action row. */
    action?: ComboBoxPartAttributes;
    /** Supporting description, when supplied. */
    description?: ComboBoxPartAttributes;
    /** Validation message, when supplied while invalid. */
    error?: ComboBoxPartAttributes;
}

const comboBoxPartsMatchManifest: ExactPartKeys<
    ComboBoxParts,
    PartsOf<'ComboBox'>
> = true;
void comboBoxPartsMatchManifest;

/** How typed text narrows the options. `none` shows `options` as given, for a consumer that filters itself. */
export type ComboBoxFilter = 'contains' | 'startsWith' | 'none';

/** The footer action of a {@link ComboBox}, offered after the options and reachable by keyboard. */
export interface ComboBoxAction {
    /** The row's content. */
    label: ReactNode;
    /** Called with the current input text when the row is chosen. */
    onAction: (inputValue: string) => void | Promise<void>;
}

/** Props for {@link ComboBox}. */
export interface ComboBoxProps {
    /** The options to offer, before filtering. */
    options: ComboBoxOption[];
    /** The selected option key, or `null` for none. */
    value: string | null;
    /** Receives the selected key, or `null` when the selection is cleared. */
    onChange: (key: string | null) => void;
    /** Controlled input text; omit for internal text state. */
    inputValue?: string;
    /** Receives the input text as it is typed. */
    onInputChange?: (inputValue: string) => void;
    /** How typed text narrows `options`. Defaults to `contains`. */
    filter?: ComboBoxFilter;
    /** Opens the list when the input receives focus, not only when typing. */
    openOnFocus?: boolean;
    /** Shows `loadingMessage` instead of options while the consumer fetches them. */
    loading?: boolean;
    /** Content shown while `loading`. */
    loadingMessage?: ReactNode;
    /** Content shown when no option matches the input. */
    emptyMessage?: ReactNode;
    /** Inline failure content replacing the options, for a query that could not answer. */
    failure?: ReactNode;
    /** A footer row after the options, receiving the input text. */
    action?: ComboBoxAction;
    /** Lays the description beside (`inline`) or under (`stacked`) the label. Defaults to `inline`. */
    optionLayout?: 'inline' | 'stacked';
    /** Empty edit hint. */
    placeholder?: string;
    /** Disables the control. */
    disabled?: boolean;
    /** Prevents editing while keeping the value readable. */
    readOnly?: boolean;
    /** Marks the control invalid. */
    invalid?: boolean;
    /** Requires a selection using native form and accessibility semantics. */
    required?: boolean;
    /** DOM identity of the input, for an external `<label htmlFor>`. */
    id?: string;
    /** Native form field name carrying the selected key. */
    name?: string;
    /** Accessible name when no visible label names the input. */
    'aria-label'?: string;
    /** Id(s) of external labeling elements. */
    'aria-labelledby'?: string;
    /** Id(s) of external descriptions, merged with the built-in description and error. */
    'aria-describedby'?: string;
    /** Supporting description rendered under the control. */
    description?: ReactNode;
    /** Validation message rendered while `invalid`. */
    errorMessage?: ReactNode;
    /** Extra class name for the root. */
    className?: string;
    /** Renderer-independent part classes, styles, titles and data attributes. */
    pt?: ComboBoxParts;
}

const ACTION_KEY = '\u0000cratis-combobox-action';

const partAttributes = (part: ComboBoxPartAttributes | undefined) => ({
    ...part,
    style: part?.style as CSSProperties | undefined,
});

const classNames = (...values: Array<string | undefined | false>) =>
    values.filter(Boolean).join(' ');

const matches = (option: ComboBoxOption, text: string, filter: ComboBoxFilter) => {
    if (filter === 'none' || text === '') return true;
    const haystack = option.label.toLocaleLowerCase();
    const needle = text.toLocaleLowerCase();
    return filter === 'startsWith'
        ? haystack.startsWith(needle)
        : haystack.includes(needle);
};

/**
 * A single-selection, text-searching combobox for picking an entity from options that may still be
 * loading, may have failed to load, and may need an "add new" escape hatch. The input owns the
 * `combobox` role; the list is a `listbox` of `option`s; arrow keys move, Enter selects, Escape
 * closes. Components owns the markup, parts and tokens; React Aria supplies the interaction internally.
 */
export const ComboBox = ({
    options,
    value,
    onChange,
    inputValue: controlledInputValue,
    onInputChange,
    filter = 'contains',
    openOnFocus = false,
    loading = false,
    loadingMessage,
    emptyMessage,
    failure,
    action,
    optionLayout = 'inline',
    placeholder,
    disabled = false,
    readOnly = false,
    invalid = false,
    required = false,
    id,
    name,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    description,
    errorMessage,
    className,
    pt,
}: ComboBoxProps) => {
    const generatedId = useId();
    const inputId = id ?? `cratis-combobox-${generatedId}`;
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = invalid && errorMessage ? `${inputId}-error` : undefined;
    const describedBy =
        [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(' ') || undefined;

    const [uncontrolledInputValue, setUncontrolledInputValue] = useState(
        () => options.find((option) => option.key === value)?.label ?? '',
    );
    const inputValue = controlledInputValue ?? uncontrolledInputValue;
    const setInputValue = (text: string) => {
        if (controlledInputValue === undefined) setUncontrolledInputValue(text);
        onInputChange?.(text);
    };

    const overlayEnvironment = unstable_useOverlayEnvironment();
    const nearestDialogZIndex = useNearestDialogZIndex();
    const popoverZIndex =
        nearestDialogZIndex === null
            ? 'var(--cratis-z-index-overlay)'
            : zIndexAboveDialog(nearestDialogZIndex, OVERLAY_OFFSET);

    const showsMessage = loading || failure !== undefined;
    const visibleOptions = useMemo(
        () =>
            showsMessage
                ? []
                : options.filter((option) => matches(option, inputValue, filter)),
        [options, inputValue, filter, showsMessage],
    );
    const items = useMemo(
        () =>
            action && !showsMessage
                ? [
                      ...visibleOptions,
                      {
                          key: ACTION_KEY,
                          label: '',
                          description: undefined,
                          disabled: false,
                      },
                  ]
                : visibleOptions,
        [visibleOptions, action, showsMessage],
    );

    const select = (key: Key | null) => {
        if (key === ACTION_KEY) {
            void action?.onAction(inputValue);
            return;
        }
        const next = key === null ? null : String(key);
        onChange(next);
        setInputValue(
            next === null
                ? ''
                : (options.find((option) => option.key === next)?.label ?? ''),
        );
    };

    const renderMessage = () =>
        loading ? (
            <div
                {...partAttributes(pt?.loading)}
                role='status'
                aria-busy='true'
                className={classNames(
                    'cratis-combobox__message',
                    'cratis-combobox__loading',
                    pt?.loading?.className,
                )}
                data-cratis-part='loading'
            >
                {loadingMessage}
            </div>
        ) : failure !== undefined ? (
            <div
                {...partAttributes(pt?.failure)}
                role='alert'
                className={classNames(
                    'cratis-combobox__message',
                    'cratis-combobox__failure',
                    pt?.failure?.className,
                )}
                data-cratis-part='failure'
            >
                {failure}
            </div>
        ) : (
            <div
                {...partAttributes(pt?.empty)}
                role='status'
                className={classNames(
                    'cratis-combobox__message',
                    'cratis-combobox__empty',
                    pt?.empty?.className,
                )}
                data-cratis-part='empty'
            >
                {emptyMessage}
            </div>
        );

    return (
        <AriaComboBox
            {...partAttributes(pt?.root)}
            selectedKey={value}
            onSelectionChange={select}
            inputValue={inputValue}
            onInputChange={setInputValue}
            items={items}
            isDisabled={disabled}
            isReadOnly={readOnly}
            isInvalid={invalid}
            isRequired={required}
            name={name}
            menuTrigger={openOnFocus ? 'focus' : 'input'}
            allowsEmptyCollection
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={describedBy}
            className={classNames('cratis-combobox', pt?.root?.className, className)}
            data-cratis-part='root'
            data-disabled={disabled || undefined}
            data-invalid={invalid || undefined}
            data-readonly={readOnly || undefined}
            data-loading={loading || undefined}
        >
            {({ isOpen }) => (
                <>
                    <div className='cratis-combobox__control'>
                        <AriaInput
                            {...partAttributes(pt?.input)}
                            id={inputId}
                            placeholder={placeholder}
                            aria-errormessage={errorId}
                            className={classNames(
                                'cratis-combobox__input',
                                pt?.input?.className,
                            )}
                            data-cratis-part='input'
                            data-disabled={disabled || undefined}
                            data-invalid={invalid || undefined}
                            data-readonly={readOnly || undefined}
                            data-open={isOpen || undefined}
                        />
                        <AriaButton
                            {...asReactAriaButtonProps(partAttributes(pt?.trigger))}
                            className={classNames(
                                'cratis-combobox__trigger',
                                pt?.trigger?.className,
                            )}
                            data-cratis-part='trigger'
                            data-disabled={disabled || undefined}
                            data-open={isOpen || undefined}
                        >
                            <span aria-hidden='true'>▾</span>
                        </AriaButton>
                    </div>
                    <UNSAFE_PortalProvider getContainer={overlayEnvironment.getContainer}>
                        <AriaPopover
                            {...partAttributes(pt?.popover)}
                            className={classNames(
                                'cratis-combobox__popover',
                                pt?.popover?.className,
                            )}
                            style={{
                                zIndex: popoverZIndex,
                                ...(pt?.popover?.style as CSSProperties | undefined),
                            }}
                            data-cratis-part='popover'
                            data-open
                        >
                            <AriaListBox<ComboBoxOption>
                                {...asReactAriaListBoxProps<ComboBoxOption>(
                                    partAttributes(pt?.listbox),
                                )}
                                items={items}
                                className={classNames(
                                    'cratis-combobox__listbox',
                                    pt?.listbox?.className,
                                )}
                                data-cratis-part='listbox'
                                data-option-layout={optionLayout}
                                renderEmptyState={renderMessage}
                            >
                                {(option) =>
                                    option.key === ACTION_KEY ? (
                                        <AriaListBoxItem
                                            {...asReactAriaListBoxItemProps<ComboBoxOption>(
                                                partAttributes(pt?.action),
                                            )}
                                            id={ACTION_KEY}
                                            textValue={
                                                typeof action?.label === 'string'
                                                    ? action.label
                                                    : 'action'
                                            }
                                            className={classNames(
                                                'cratis-combobox__action',
                                                pt?.action?.className,
                                            )}
                                            data-cratis-part='action'
                                        >
                                            {action?.label}
                                        </AriaListBoxItem>
                                    ) : (
                                        <AriaListBoxItem
                                            {...asReactAriaListBoxItemProps<ComboBoxOption>(
                                                partAttributes(pt?.option),
                                            )}
                                            id={option.key}
                                            textValue={option.label}
                                            isDisabled={option.disabled}
                                            className={classNames(
                                                'cratis-combobox__option',
                                                pt?.option?.className,
                                            )}
                                            data-cratis-part='option'
                                            data-disabled={option.disabled || undefined}
                                            data-selected={
                                                option.key === value || undefined
                                            }
                                        >
                                            <span
                                                {...partAttributes(pt?.optionLabel)}
                                                className={classNames(
                                                    'cratis-combobox__option-label',
                                                    pt?.optionLabel?.className,
                                                )}
                                                data-cratis-part='optionLabel'
                                            >
                                                {option.label}
                                            </span>
                                            {option.description !== undefined && (
                                                <span
                                                    {...partAttributes(
                                                        pt?.optionDescription,
                                                    )}
                                                    className={classNames(
                                                        'cratis-combobox__option-description',
                                                        pt?.optionDescription?.className,
                                                    )}
                                                    data-cratis-part='optionDescription'
                                                >
                                                    {option.description}
                                                </span>
                                            )}
                                        </AriaListBoxItem>
                                    )
                                }
                            </AriaListBox>
                        </AriaPopover>
                    </UNSAFE_PortalProvider>
                    {descriptionId && (
                        <span
                            {...partAttributes(pt?.description)}
                            id={descriptionId}
                            className={classNames(
                                'cratis-combobox__description',
                                pt?.description?.className,
                            )}
                            data-cratis-part='description'
                        >
                            {description}
                        </span>
                    )}
                    {errorId && (
                        <span
                            {...partAttributes(pt?.error)}
                            id={errorId}
                            className={classNames(
                                'cratis-combobox__error',
                                pt?.error?.className,
                            )}
                            data-cratis-part='error'
                            data-invalid='true'
                        >
                            {errorMessage}
                        </span>
                    )}
                </>
            )}
        </AriaComboBox>
    );
};

ComboBox.displayName = 'ComboBox';
