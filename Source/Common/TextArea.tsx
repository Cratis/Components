// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import type { ChangeHandler } from '../types/ChangeHandler';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';
import { unstable_useSlot } from '../renderer/RendererContext';
import { renderSlot } from '../renderer/renderSlot';
import type { unstable_SlotDeclaration } from '../renderer/slots';
import { TextAreaImplementation } from './TextAreaImplementation';

/** Stable Cratis-owned parts for styling a {@link TextArea}. */
export interface TextAreaParts {
    /** Native textarea element. */
    root?: TextareaHTMLAttributes<HTMLTextAreaElement>;
}

const textAreaPartsMatchManifest: ExactPartKeys<TextAreaParts, PartsOf<'TextArea'>> = true;
void textAreaPartsMatchManifest;

/** Props for {@link TextArea}. */
export interface TextAreaProps extends Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    'onChange'
> {
    /** Marks the textarea invalid and exposes the canonical invalid state. */
    invalid?: boolean;
    /** Receives the next string value and native user-event metadata. */
    onChange?: ChangeHandler<string>;
    /** Cratis-owned per-part attributes. */
    pt?: TextAreaParts;
}

const coreTextAreaDeclaration = Object.freeze({
    mode: 'presentation',
    fidelity: 'native',
    render: TextAreaImplementation,
}) satisfies unstable_SlotDeclaration<'common.textArea'>;

/** A native multi-line text control with semantic value changes and stable Components parts. */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    function TextArea(props, ref) {
        const declaration = unstable_useSlot(
            'common.textArea',
            coreTextAreaDeclaration,
        );
        return renderSlot(declaration, props, ref);
    },
);
