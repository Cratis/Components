// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { HTMLAttributes, InputHTMLAttributes } from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';

interface ColorPickerParts {
    root?: HTMLAttributes<HTMLDivElement>;
    input?: InputHTMLAttributes<HTMLInputElement>;
    value?: HTMLAttributes<HTMLOutputElement>;
}

interface ColorPickerFieldComponentProps
    extends WrappedFieldProps<string>,
        FieldAccessibilityProps {
    inline?: boolean;
    defaultColor?: string;
    className?: string;
    pt?: ColorPickerParts;
    ptOptions?: object;
    unstyled?: boolean;
}

const normalizeHex = (value: string, fallback: string) =>
    /^[0-9a-f]{6}$/i.test(value) ? value : fallback;

/** A native color picker bound to a bare six-digit hex string on an Arc command. */
export const ColorPickerField = asCommandFormField<ColorPickerFieldComponentProps>(
    (props) => {
        const accessibility = useFieldAccessibility(props, {
            id: props.pt?.input?.id,
            ariaLabel: props.pt?.input?.['aria-label'],
            ariaDescribedBy: props.pt?.input?.['aria-describedby'],
        });
        const value = normalizeHex(
            props.value,
            normalizeHex(props.defaultColor ?? '000000', '000000'),
        );
        return (
            <div
                {...props.pt?.root}
                className={[
                    'cratis-color-field',
                    props.pt?.root?.className,
                    props.className,
                ]
                    .filter(Boolean)
                    .join(' ')}
                onBlur={props.onBlur}
                data-cratis-part='root'
                data-invalid={props.invalid || undefined}
                data-inline={props.inline || undefined}
            >
                <input
                    {...props.pt?.input}
                    id={accessibility.controlId}
                    aria-label={accessibility.ariaLabel}
                    aria-describedby={accessibility.ariaDescribedBy}
                    type='color'
                    value={`#${value}`}
                    onChange={props.onChange}
                    aria-invalid={props.invalid || undefined}
                    className={['cratis-color-field__input', props.pt?.input?.className]
                        .filter(Boolean)
                        .join(' ')}
                    data-cratis-part='input'
                />
                <output
                    {...props.pt?.value}
                    className={['cratis-color-field__value', props.pt?.value?.className]
                        .filter(Boolean)
                        .join(' ')}
                    data-cratis-part='value'
                >
                    #{value}
                </output>
                {accessibility.hiddenError}
            </div>
        );
    },
    {
        defaultValue: '',
        extractValue: (event: React.ChangeEvent<HTMLInputElement>) =>
            event.target.value.replace('#', ''),
    },
);
