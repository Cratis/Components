// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';
import { MultiSelect, type MultiSelectProps } from 'primereact/multiselect';
import React from 'react';

/**
 * Component-level props for {@link MultiSelectField}.
 */
interface MultiSelectFieldComponentProps extends WrappedFieldProps<Array<string | number>> {
    /** Source array of objects to populate the multi-select options. */
    options: Array<Record<string, unknown>>;

    /** Property name on each option object used as the underlying value. */
    optionValue?: string;

    /** Property name on each option object used as the visible label. */
    optionLabel?: string;

    /** Placeholder text shown when nothing is selected. */
    placeholder?: string;

    /** How the selection is displayed in the field: comma-separated or as chips. */
    display?: 'comma' | 'chip';

    /** Maximum number of selected labels to show before collapsing into a count. */
    maxSelectedLabels?: number;

    /** When true, shows a filter input in the dropdown panel. */
    filter?: boolean;

    /** When true, shows a clear icon that resets the selection. */
    showClear?: boolean;

    /** Extra CSS class name combined with the default `w-full`. */
    className?: string;

    /** PrimeReact pass-through configuration applied to the underlying MultiSelect. */
    pt?: MultiSelectProps['pt'];

    /** PrimeReact pass-through options applied to the underlying MultiSelect. */
    ptOptions?: MultiSelectProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the underlying MultiSelect. */
    unstyled?: boolean;
}

/**
 * A multi-select dropdown field for use inside a `CommandForm`. Binds to an
 * array of strings or numbers on the command. Use for "pick any subset of
 * these" controls with optional filtering inside the panel.
 *
 * ```tsx
 * <MultiSelectField value={c => c.tagIds}
 *                   options={tags} optionValue="id" optionLabel="name"
 *                   display="chip" filter title="Tags" />
 * ```
 */
export const MultiSelectField = asCommandFormField<MultiSelectFieldComponentProps>(
    (props) => (
        <MultiSelect
            value={props.value}
            onChange={(e: { value: Array<string | number> | undefined }) => props.onChange(e.value ?? [])}
            onBlur={props.onBlur}
            options={props.options}
            optionValue={props.optionValue}
            optionLabel={props.optionLabel}
            placeholder={props.placeholder}
            display={props.display}
            maxSelectedLabels={props.maxSelectedLabels}
            filter={props.filter}
            showClear={props.showClear}
            invalid={props.invalid}
            className={props.className ? `w-full ${props.className}` : 'w-full'}
            pt={props.pt}
            ptOptions={props.ptOptions}
            unstyled={props.unstyled}
        />
    ),
    {
        defaultValue: [],
        extractValue: (e: unknown) => {
            if (!Array.isArray(e)) {
                return [];
            }

            return e.filter((item): item is string | number => typeof item === 'string' || typeof item === 'number');
        }
    }
);
