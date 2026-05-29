// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';
import { ColorPicker, type ColorPickerProps } from 'primereact/colorpicker';
import React from 'react';

/**
 * Component-level props for {@link ColorPickerField}.
 */
interface ColorPickerFieldComponentProps extends WrappedFieldProps<string> {
    /** When true, renders the color picker inline rather than as a popover. */
    inline?: boolean;

    /** Initial color shown when the bound property is empty. Defaults to `'000000'`. */
    defaultColor?: string;

    /** Extra CSS class name forwarded to the underlying ColorPicker. */
    className?: string;

    /** PrimeReact pass-through configuration applied to the underlying ColorPicker. */
    pt?: ColorPickerProps['pt'];

    /** PrimeReact pass-through options applied to the underlying ColorPicker. */
    ptOptions?: ColorPickerProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the underlying ColorPicker. */
    unstyled?: boolean;
}

/**
 * A color picker field bound to a `string` property on a Cratis Arc command,
 * holding a hex color value without the leading `#` (e.g. `"60a5fa"`). Set
 * `inline` to render the picker inline rather than as a popover. See
 * {@link InputTextField} for the full `value={c => c.prop}` binding model.
 *
 * ```tsx
 * <ColorPickerField value={c => c.accentColor} title="Accent" inline />
 * ```
 */
export const ColorPickerField = asCommandFormField<ColorPickerFieldComponentProps>(
    (props) => {
        const defaultColor = props.defaultColor ?? '000000';
        const value = typeof props.value === 'string' && props.value.length > 0 ? props.value : defaultColor;
        const invalidClass = props.invalid ? 'p-invalid' : undefined;
        const className = [invalidClass, props.className].filter(Boolean).join(' ') || undefined;

        return (
            <ColorPicker
                value={value}
                onChange={(e: { value: unknown }) => props.onChange(typeof e.value === 'string' ? e.value : '')}
                onBlur={props.onBlur}
                inline={props.inline}
                defaultColor={defaultColor}
                className={className}
                pt={props.pt}
                ptOptions={props.ptOptions}
                unstyled={props.unstyled}
            />
        );
    },
    {
        defaultValue: '',
        extractValue: (e: unknown) => typeof e === 'string' ? e : ''
    }
);
