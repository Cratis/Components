// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Checkbox } from 'primereact/checkbox';
import type { CheckboxRootProps, CheckboxRootChangeEvent } from '@primereact/types/primitive/checkbox';
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
    pt?: CheckboxRootProps['pt'];

    /** PrimeReact pass-through options applied to the underlying Checkbox. */
    ptOptions?: CheckboxRootProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the underlying Checkbox. */
    unstyled?: boolean;
}

/**
 * A single boolean checkbox field bound to a `boolean` property on a Cratis
 * Arc command. See {@link InputTextField} for the full `value={c => c.prop}`
 * binding model.
 *
 * ```tsx
 * <CheckboxField value={c => c.acceptedTerms} label="I agree to the terms" />
 * ```
 */
export const CheckboxField = asCommandFormField<CheckboxFieldComponentProps>(
    (props) => (
        // PrimeReact 11's Checkbox is compositional (Root → Box → Indicator). A real
        // <label> wraps the control so the visible text is its accessible name
        // (implicit association) and doubles the click target. `onBlur` rides on the
        // label because React blur bubbles (focusout), so the CommandForm's blur-timed
        // validation still fires from the inner input.
        <label className="flex items-center" onBlur={props.onBlur}>
            <Checkbox.Root
                checked={props.value}
                onCheckedChange={props.onChange}
                invalid={props.invalid}
                className={props.className}
                pt={props.pt}
                ptOptions={props.ptOptions}
                unstyled={props.unstyled}>
                <Checkbox.Box>
                    <Checkbox.Indicator />
                </Checkbox.Box>
            </Checkbox.Root>
            {props.label && <span className="ml-2">{props.label}</span>}
        </label>
    ),
    {
        defaultValue: false,
        extractValue: (e: CheckboxRootChangeEvent) => e.checked
    }
);
