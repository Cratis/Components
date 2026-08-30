// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type {
    ButtonHTMLAttributes,
    CSSProperties,
    FocusEventHandler,
    HTMLAttributes,
    InputHTMLAttributes,
    SelectHTMLAttributes,
} from 'react';
import type { ChangeHandler } from '../types/ChangeHandler';
import { unstable_useSlot } from '../renderer/RendererContext';
import { renderSlot } from '../renderer/renderSlot';
import type { unstable_SlotDeclaration } from '../renderer/slots';
import { DropdownImplementation } from './DropdownImplementation';

type DropdownTriggerAttributes = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'tabIndex' | 'value'
>;

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

const coreDropdownDeclaration = Object.freeze({
    mode: 'atomic',
    fidelity: 'native',
    render: DropdownImplementation,
}) satisfies unstable_SlotDeclaration<'dropdown.select'>;

/** A renderer-independent single or multiple select with stable Cratis parts. */
export const Dropdown = <T = unknown,>(props: DropdownProps<T>) => {
    const declaration = unstable_useSlot('dropdown.select', coreDropdownDeclaration);
    return renderSlot(declaration, props as DropdownProps<unknown>);
};

Dropdown.displayName = 'Dropdown';
