// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Checkbox, type CheckboxProps } from 'primereact/checkbox';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';

/**
 * Component-level props for {@link CheckboxField}.
 */
interface CheckboxFieldComponentProps extends WrappedFieldProps<boolean> {
    /** Optional label displayed next to the checkbox. */
    label?: string;

    /** Extra CSS class name forwarded to the underlying Checkbox. */
    className?: string;

    /** PrimeReact pass-through configuration applied to the underlying Checkbox. */
    pt?: CheckboxProps['pt'];

    /** PrimeReact pass-through options applied to the underlying Checkbox. */
    ptOptions?: CheckboxProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the underlying Checkbox. */
    unstyled?: boolean;
}

/**
 * A single boolean checkbox field for use inside a `CommandForm`. Binds to
 * a boolean property on the command.
 *
 * ```tsx
 * <CheckboxField value={c => c.acceptedTerms} label="I agree to the terms" />
 * ```
 */
export const CheckboxField = asCommandFormField<CheckboxFieldComponentProps>(
    (props) => (
        <div className="flex align-items-center">
            <Checkbox
                checked={props.value}
                onChange={props.onChange}
                onBlur={props.onBlur}
                invalid={props.invalid}
                className={props.className}
                pt={props.pt}
                ptOptions={props.ptOptions}
                unstyled={props.unstyled}
            />
            {props.label && <label className="ml-2">{props.label}</label>}
        </div>
    ),
    {
        defaultValue: false,
        extractValue: (e: { checked: boolean }) => e.checked
    }
);
