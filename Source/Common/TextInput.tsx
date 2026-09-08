// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, type InputHTMLAttributes } from 'react';
import type { ChangeHandler } from '../types/ChangeHandler';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';
import { unstable_useSlot } from '../renderer/RendererContext';
import { renderSlot } from '../renderer/renderSlot';
import type { unstable_SlotDeclaration } from '../renderer/slots';
import { TextInputImplementation } from './TextInputImplementation';

/** Native text-like input types supported by {@link TextInput}. */
export type TextInputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';

/** Stable Cratis-owned parts for styling a {@link TextInput}. */
export interface TextInputParts {
    /** Native input element. */
    root?: InputHTMLAttributes<HTMLInputElement>;
}

const textInputPartsMatchManifest: ExactPartKeys<
    TextInputParts,
    PartsOf<'TextInput'>
> = true;
void textInputPartsMatchManifest;

/** Props for {@link TextInput}. */
export interface TextInputProps extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'type'
> {
    /** Native text-like input type. Defaults to `text`. */
    type?: TextInputType;
    /** Marks the input invalid and exposes the canonical invalid state. */
    invalid?: boolean;
    /** Receives the next string value and native user-event metadata. */
    onChange?: ChangeHandler<string>;
    /** Cratis-owned per-part attributes. */
    pt?: TextInputParts;
}

const coreTextInputDeclaration = Object.freeze({
    mode: 'presentation',
    fidelity: 'native',
    render: TextInputImplementation,
}) satisfies unstable_SlotDeclaration<'common.textInput'>;

/** A native text input with semantic value changes and stable Components parts. */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
    function TextInput(props, ref) {
        const declaration = unstable_useSlot(
            'common.textInput',
            coreTextInputDeclaration,
        );
        return renderSlot(declaration, props, ref);
    },
);
