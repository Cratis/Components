// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type {
    ButtonHTMLAttributes,
    CSSProperties,
    FocusEventHandler,
    HTMLAttributes,
} from 'react';
import type { ChangeHandler } from '../types/ChangeHandler';
import { unstable_useSlot } from '../renderer/RendererContext';
import { renderSlot } from '../renderer/renderSlot';
import type { unstable_SlotDeclaration } from '../renderer/slots';
import { DatePickerInputImplementation } from './DatePickerInputImplementation';

interface DatePickerPartAttributes extends Omit<
    HTMLAttributes<HTMLElement>,
    'defaultValue' | 'onChange' | 'role'
> {
    id?: string;
    className?: string;
    style?: CSSProperties;
    disabled?: boolean;
    readOnly?: boolean;
    placeholder?: string;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    [attribute: `data-${string}`]: string | number | boolean | undefined;
}

type DatePickerButtonAttributes = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'value'
>;

/** Stable Cratis-owned parts for styling a {@link DatePickerInput}. */
export interface DatePickerInputPassThrough {
    /** Outer wrapper. */
    root?: DatePickerPartAttributes;
    /** Focusable segmented-input group. */
    group?: DatePickerPartAttributes;
    /** Segmented date input. */
    input?: DatePickerPartAttributes;
    /** Visible empty-value placeholder. */
    placeholder?: DatePickerPartAttributes;
    /** Individual editable date/time segment. */
    segment?: DatePickerPartAttributes;
    /** Calendar popup trigger. */
    trigger?: DatePickerButtonAttributes;
    /** Portaled calendar popover. */
    popover?: DatePickerPartAttributes;
    /** Calendar dialog. */
    dialog?: DatePickerPartAttributes;
    /** Calendar root. */
    calendar?: DatePickerPartAttributes;
    /** Calendar navigation header. */
    header?: DatePickerPartAttributes;
    /** Current month/year heading. */
    heading?: DatePickerPartAttributes;
    /** Previous-month action. */
    previous?: DatePickerButtonAttributes;
    /** Next-month action. */
    next?: DatePickerButtonAttributes;
    /** Calendar grid. */
    grid?: DatePickerPartAttributes;
    /** One calendar cell. */
    cell?: DatePickerPartAttributes;
    /** Today/clear action row. */
    buttonBar?: DatePickerPartAttributes;
    /** Today action; disabled and non-interactive when today falls outside `minDate`/`maxDate`. */
    today?: DatePickerButtonAttributes;
    /** Clear action. */
    clear?: DatePickerButtonAttributes;
}

/** Props for {@link DatePickerInput}. */
export interface DatePickerInputProps {
    /** Controlled JavaScript date value. */
    value: Date | null;
    /** Invoked with the selected JavaScript date or `null` and optional change-origin metadata. */
    onChange: ChangeHandler<Date | null>;
    /** Invoked when focus leaves the picker wrapper. */
    onBlur?: FocusEventHandler<HTMLElement>;
    /** Marks the picker invalid. */
    invalid?: boolean;
    /** Disables every picker control. */
    disabled?: boolean;
    /** Prevents editing while retaining focus semantics. */
    readOnly?: boolean;
    /** DOM id for the segmented-input group. */
    id?: string;
    /** Shows Today and Clear actions. */
    showButtonBar?: boolean;
    /** Visible text while no date is selected. */
    placeholder?: string;
    /** Deprecated renderer mask; locale controls formatting now. */
    dateFormat?: string;
    /** Shows the calendar trigger button. Defaults to `true`. */
    showIcon?: boolean;
    /** Adds hour/minute segments. */
    showTime?: boolean;
    /** Preferred 12- or 24-hour cycle. */
    hourFormat?: '12' | '24';
    /** Earliest selectable date. */
    minDate?: Date;
    /** Latest selectable date. */
    maxDate?: Date;
    /** Extra class name for the outer wrapper. */
    className?: string;
    /** Inline style for the outer wrapper. */
    style?: CSSProperties;
    /** Cratis-owned per-part attributes. */
    pt?: DatePickerInputPassThrough;
    /**
     * @deprecated Cratis parts always merge. Remove this renderer-era option.
     */
    ptOptions?: object;
    /**
     * @deprecated Components always uses consumer-owned CSS. Customize through `pt` and CSS instead.
     */
    unstyled?: boolean;
    /** Localized label for the Today action. */
    todayLabel?: string;
    /** Localized label for the Clear action. */
    clearLabel?: string;
    /** Accessible name when no external label is supplied. */
    'aria-label'?: string;
    /** Id of the element that labels the picker. */
    'aria-labelledby'?: string;
    /** Id of the element that describes the picker. */
    'aria-describedby'?: string;
}

const coreDatePickerDeclaration = Object.freeze({
    mode: 'atomic',
    fidelity: 'native',
    render: DatePickerInputImplementation,
}) satisfies unstable_SlotDeclaration<'display.datePicker'>;

/**
 * An internationalized date or date-time picker with Cratis-owned markup parts.
 * The public boundary remains `Date | null`; React Aria's calendar values stay internal.
 */
export const DatePickerInput = (props: DatePickerInputProps) => {
    const declaration = unstable_useSlot('display.datePicker', coreDatePickerDeclaration);
    return renderSlot(declaration, props);
};
