// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import { Dropdown, type DropdownProps } from '../../Dropdown/Dropdown';
import React from 'react';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';

/**
 * Component-level props for {@link MultiSelectField}.
 */
interface MultiSelectFieldComponentProps
    extends WrappedFieldProps<Array<string | number>>, FieldAccessibilityProps {
    /** Source array of objects to populate the multi-select options. */
    options: Array<Record<string, unknown>>;

    /** Property name on each option object used as the underlying value. */
    optionValue?: string;

    /** Property name on each option object used as the visible label. */
    optionLabel?: string;

    /** Placeholder text shown when nothing is selected. */
    placeholder?: string;

    /**
     * @deprecated Native multiple selection has one presentation. Remove this renderer-era option.
     */
    display?: 'comma' | 'chip';

    /**
     * @deprecated Native multiple selection does not collapse labels. Remove this renderer-era option.
     */
    maxSelectedLabels?: number;

    /** When true, shows a filter input in the dropdown panel. */
    filter?: boolean;

    /** When true, shows a clear icon that resets the selection. */
    showClear?: boolean;

    /** Extra CSS class name combined with the default `w-full`. */
    className?: string;

    /** Cratis-owned per-part attributes applied to the underlying Select. */
    pt?: DropdownProps['pt'];

    /**
     * @deprecated Cratis parts always merge. Remove this renderer-era option.
     */
    ptOptions?: DropdownProps['ptOptions'];

    /**
     * @deprecated Components always uses consumer-owned CSS. Customize through `pt` and CSS instead.
     */
    unstyled?: boolean;
}

/**
 * A multi-select dropdown field bound to an `Array<string | number>`
 * property on a Cratis Arc command. Use for "pick any subset of these"
 * controls with optional in-panel filtering. See {@link InputTextField}
 * for the full `value={c => c.prop}` binding model.
 *
 * ```tsx
 * <MultiSelectField value={c => c.tagIds}
 *                   options={tags} optionValue="id" optionLabel="name"
 *                   display="chip" filter title="Tags" />
 * ```
 */
export const MultiSelectField = asCommandFormField<MultiSelectFieldComponentProps>(
    (props) => {
        const accessibility = useFieldAccessibility(props, {
            id: props.pt?.input?.id,
            ariaLabel: props.pt?.input?.['aria-label'],
            ariaDescribedBy: props.pt?.input?.['aria-describedby'],
        });
        return (
            <>
                <Dropdown<Array<string | number>>
                    id={accessibility.controlId}
                    aria-label={accessibility.ariaLabel}
                    aria-describedby={accessibility.ariaDescribedBy}
                    multiple
                    value={props.value}
                    onChange={(value) => props.onChange(value ?? [])}
                    onBlur={props.onBlur}
                    options={props.options}
                    optionValue={props.optionValue}
                    optionLabel={props.optionLabel}
                    placeholder={props.placeholder}
                    filter={props.filter}
                    showClear={props.showClear}
                    invalid={props.invalid}
                    className={
                        props.className
                            ? `cratis:w-full ${props.className}`
                            : 'cratis:w-full'
                    }
                    pt={props.pt}
                    ptOptions={props.ptOptions}
                    unstyled={props.unstyled}
                />
                {accessibility.hiddenError}
            </>
        );
    },
    {
        defaultValue: [],
        extractValue: (e: unknown) => {
            if (!Array.isArray(e)) {
                return [];
            }

            return e.filter(
                (item): item is string | number =>
                    typeof item === 'string' || typeof item === 'number',
            );
        },
    },
);
