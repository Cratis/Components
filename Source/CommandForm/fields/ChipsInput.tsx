// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { classNames } from '../../ClassNames/classNames';
import type { ChipsParts } from './ChipsField';

/** Props for {@link ChipsInput}. */
export interface ChipsInputProps {
    id?: string;
    ariaLabel?: string;
    ariaDescribedBy?: string;
    draft: string;
    onDraftChange: (draft: string) => void;
    /** Called when Enter is pressed in the input. */
    onCommit: () => void;
    placeholder?: string;
    invalid?: boolean;
    /** The field's part attributes. */
    parts?: ChipsParts;
}

/** The native draft-value input of a chips field. */
export const ChipsInput = ({
    id,
    ariaLabel,
    ariaDescribedBy,
    draft,
    onDraftChange,
    onCommit,
    placeholder,
    invalid,
    parts: pt,
}: ChipsInputProps) => (
    <input
        {...pt?.input}
        id={id}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={(event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                onCommit();
            }
        }}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        data-disabled={pt?.input?.disabled || undefined}
        data-invalid={invalid || undefined}
        data-readonly={pt?.input?.readOnly || undefined}
        className={classNames('cratis-chips-field__input', pt?.input?.className)}
        data-cratis-part='input'
    />
);
