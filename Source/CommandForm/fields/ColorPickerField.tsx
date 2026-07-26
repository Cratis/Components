// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';
import { InputColor } from 'primereact/inputcolor';
import { parseColor } from '@primereact/headless/inputcolor';
import type { InputColorRootProps, InputColorRootChangeEvent } from '@primereact/types/primitive/inputcolor';
import React from 'react';

/** Parse a bare hex string (no leading `#`) into a color, falling back on invalid input. */
const toColor = (hex: string, fallback: string) => {
    const candidate = typeof hex === 'string' && hex.length > 0 ? hex : fallback;
    try {
        return parseColor(`#${candidate}`);
    } catch {
        return parseColor(`#${fallback}`);
    }
};

/**
 * Component-level props for {@link ColorPickerField}.
 */
interface ColorPickerFieldComponentProps extends WrappedFieldProps<string> {
    /**
     * When true, renders the color picker inline rather than as a popover.
     *
     * PrimeReact 11's InputColor is composed inline (area + sliders + swatch); the
     * v10 popover mode is not reproduced here. Accepted for API compatibility.
     */
    inline?: boolean;

    /** Initial color shown when the bound property is empty. Defaults to `'000000'`. */
    defaultColor?: string;

    /** Extra CSS class name forwarded to the underlying InputColor. */
    className?: string;

    /** PrimeReact pass-through configuration applied to the underlying InputColor. */
    pt?: InputColorRootProps['pt'];

    /** PrimeReact pass-through options applied to the underlying InputColor. */
    ptOptions?: InputColorRootProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the underlying InputColor. */
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
        // InputColor exposes no `invalid` prop, so surface the invalid state as a class on the
        // wrapper — the same `p-invalid` token the other fields emit; it no-ops when unstyled.
        const invalidClass = props.invalid ? 'p-invalid' : undefined;
        const className = [invalidClass, props.className].filter(Boolean).join(' ') || undefined;

        return (
            // PrimeReact 11's InputColor is compositional (area + hue slider + swatch).
            // `onBlur` rides the wrapping div because React blur bubbles (focusout).
            <div className={className} onBlur={props.onBlur}>
                <InputColor.Root
                    value={toColor(props.value, defaultColor)}
                    onValueChange={(e: InputColorRootChangeEvent) => props.onChange(e.value.toString('hex').replace('#', ''))}
                    pt={props.pt}
                    ptOptions={props.ptOptions}
                    unstyled={props.unstyled}>
                    <InputColor.Area>
                        <InputColor.AreaBackground />
                        <InputColor.AreaHandle />
                    </InputColor.Area>
                    <InputColor.Slider>
                        <InputColor.SliderTrack />
                        <InputColor.SliderHandle />
                    </InputColor.Slider>
                    <InputColor.Swatch>
                        <InputColor.SwatchBackground />
                    </InputColor.Swatch>
                </InputColor.Root>
            </div>
        );
    },
    {
        defaultValue: '',
        extractValue: (e: unknown) => typeof e === 'string' ? e : ''
    }
);
