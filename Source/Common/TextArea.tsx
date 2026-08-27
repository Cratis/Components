// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { TextareaHTMLAttributes } from 'react';
import type { ChangeHandler } from '../types/ChangeHandler';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';

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

/** A native multi-line text control with semantic value changes and stable Components parts. */
export { TextAreaImplementation as TextArea } from './TextAreaImplementation';
