// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';
import { InputTags } from 'primereact/inputtags';
import type { InputTagsRootProps, InputTagsRootValueChangeEvent } from '@primereact/types/primitive/inputtags';
import React from 'react';

/**
 * Component-level props for {@link ChipsField}.
 */
interface ChipsFieldComponentProps extends WrappedFieldProps<string[]> {
    /** Placeholder text shown when the chip list is empty. */
    placeholder?: string;

    /** Maximum number of chips allowed. */
    max?: number;

    /**
     * Character (or regex source) that splits typed input into multiple chips.
     *
     * PrimeReact 11's `InputTags` commits one tag per Enter rather than exposing
     * v10 Chips' `separator`; accepted for API compatibility, not applied.
     */
    separator?: string;

    /** When true, the current input is committed as a chip on blur. */
    addOnBlur?: boolean;

    /** When true, the same chip value may be added multiple times. */
    allowDuplicate?: boolean;

    /** Accessible name for each chip's remove button. Override to localize. Defaults to `'Remove'`. */
    removeAriaLabel?: string;

    /** Extra CSS class name combined with the default `w-full`. */
    className?: string;

    /** PrimeReact pass-through configuration applied to the underlying InputTags. */
    pt?: InputTagsRootProps['pt'];

    /** PrimeReact pass-through options applied to the underlying InputTags. */
    ptOptions?: InputTagsRootProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the underlying InputTags. */
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
        // PrimeReact 11's InputTags is compositional with render-prop parts: Items
        // renders one node per tag, Control renders the text-entry input. `onBlur`
        // rides the wrapping div because React blur bubbles (focusout).
        <div className={props.className ? `w-full ${props.className}` : 'w-full'} onBlur={props.onBlur}>
            <InputTags.Root
                value={props.value}
                onValueChange={(e: InputTagsRootValueChangeEvent) => props.onChange(e.value ?? [])}
                invalid={props.invalid}
                max={props.max}
                addOnBlur={props.addOnBlur}
                allowDuplicate={props.allowDuplicate}
                pt={props.pt}
                ptOptions={props.ptOptions}
                unstyled={props.unstyled}>
                <InputTags.Items>
                    {({ item, index, remove, itemProps }) => (
                        <span key={index} {...itemProps} className="cratis-inputtags-item">
                            <span>{item}</span>
                            <button type="button" aria-label={props.removeAriaLabel ?? 'Remove'} onClick={remove}>
                                <i className="pi pi-times-circle" />
                            </button>
                        </span>
                    )}
                </InputTags.Items>
                <InputTags.Control>
                    {({ controlProps }) => <input {...controlProps} placeholder={props.placeholder} />}
                </InputTags.Control>
            </InputTags.Root>
        </div>
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
