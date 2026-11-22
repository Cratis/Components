// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { HTMLAttributes, ReactNode } from 'react';
import { ComboBox as AriaComboBox } from 'react-aria-components/ComboBox';
import { classNames } from '../ClassNames/classNames';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';
import { partAttributes } from './comboBoxAttributes';
import { useComboBoxState } from './useComboBoxState';
import { useComboBoxPresentation } from './useComboBoxPresentation';
import { renderComboBoxControl } from './renderComboBoxControl';
import { renderComboBoxPopover } from './renderComboBoxPopover';
import { renderComboBoxSupportingText } from './renderComboBoxSupportingText';
import { describeComponent } from '../configuration/identity/describeComponent';
import { useComponentPresentation } from '../configuration/identity/useComponentPresentation';

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
    /** The row's text; it is also the row's accessible name. */
    label: string;
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

const comboBoxDescriptor = describeComponent<ComboBoxProps>('ComboBox', [
    { name: 'placeholder', label: 'Placeholder', type: 'string' },
    { name: 'aria-label', label: 'Accessible label', type: 'string' },
    { name: 'invalid', label: 'Invalid', type: 'boolean', defaultValue: false },
]);

/**
 * A single-selection, text-searching combobox for picking an entity from options that may still be
 * loading, may have failed to load, and may need an "add new" escape hatch. The input owns the
 * `combobox` role; the list is a `listbox` of `option`s; arrow keys move, Enter selects, Escape
 * closes. Components owns the markup, parts and tokens; React Aria supplies the interaction internally.
 */
export const ComboBox = (props: ComboBoxProps) => {
    const [presented, marker] = useComponentPresentation(comboBoxDescriptor, props, props.id ?? props.name);
    const {
        value, disabled = false, readOnly = false, invalid = false, required = false,
        loading = false, openOnFocus = false, name, className, pt,
        'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy,
    } = presented;
    const presentation = useComboBoxPresentation(presented);
    const state = useComboBoxState(presented);
    const { describedBy } = presentation;
    const { inputValue, setInputValue, select, openChanged, setEditing, items } = state;

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
            onOpenChange={openChanged}
            onFocusChange={setEditing}
            menuTrigger={openOnFocus ? 'focus' : 'input'}
            allowsEmptyCollection
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={describedBy}
            className={classNames('cratis-combobox', pt?.root?.className, className)}
            data-cratis-part='root'
            {...marker}
            data-disabled={disabled || undefined}
            data-invalid={invalid || undefined}
            data-readonly={readOnly || undefined}
            data-loading={loading || undefined}
        >
            {({ isOpen }) => (
                <>
                    {renderComboBoxControl(presented, presentation, isOpen)}
                    {renderComboBoxPopover(presented, state, presentation)}
                    {renderComboBoxSupportingText(presented, presentation)}
                </>
            )}
        </AriaComboBox>
    );
};

ComboBox.displayName = 'ComboBox';
