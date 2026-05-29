// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';
import { Chips, type ChipsProps } from 'primereact/chips';
import React from 'react';

/**
 * Component-level props for {@link ChipsField}.
 */
interface ChipsFieldComponentProps extends WrappedFieldProps<string[]> {
    /** Placeholder text shown when the chip list is empty. */
    placeholder?: string;

    /** Maximum number of chips allowed. */
    max?: number;

    /** Character (or regex source) that splits typed input into multiple chips. */
    separator?: string;

    /** When true, the current input is committed as a chip on blur. */
    addOnBlur?: boolean;

    /** When true, the same chip value may be added multiple times. */
    allowDuplicate?: boolean;

    /** Extra CSS class name combined with the default `w-full`. */
    className?: string;

    /** PrimeReact pass-through configuration applied to the underlying Chips. */
    pt?: ChipsProps['pt'];

    /** PrimeReact pass-through options applied to the underlying Chips. */
    ptOptions?: ChipsProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the underlying Chips. */
    unstyled?: boolean;
}

/**
 * A tag/chip input field bound to a `string[]` property on a Cratis Arc
 * command. Each entered token becomes a chip; `separator` splits pasted
 * input into multiple chips at once. See {@link InputTextField} for the
 * full `value={c => c.prop}` binding model.
 *
 * ```tsx
 * <ChipsField value={c => c.tags} title="Tags" separator="," />
 * ```
 */
export const ChipsField = asCommandFormField<ChipsFieldComponentProps>(
    (props) => (
        <Chips
            value={props.value}
            onChange={(e: { value: string[] | null | undefined }) => props.onChange(e.value ?? [])}
            onBlur={props.onBlur}
            invalid={props.invalid}
            placeholder={props.placeholder}
            max={props.max}
            separator={props.separator}
            addOnBlur={props.addOnBlur}
            allowDuplicate={props.allowDuplicate}
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

            return e.filter((item): item is string => typeof item === 'string');
        }
    }
);
