// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import { classNames } from '../../ClassNames/classNames';
import type { ChipsParts } from './ChipsField';

/** Props for {@link ChipsRoot}. */
export interface ChipsRootProps {
    parts?: ChipsParts;
    className?: string;
    invalid?: boolean;
    addOnBlur?: boolean;
    onBlur?: () => void;
    onCommit: () => void;
    children: ReactNode;
}

/** The field wrapper of a chips field, which commits the draft when focus leaves it. */
export const ChipsRoot = ({ parts: pt, className, invalid, addOnBlur, onBlur, onCommit, children }: ChipsRootProps) => (
    <div
        {...pt?.root}
        className={classNames('cratis-chips-field', 'cratis:w-full', pt?.root?.className, className)}
        onBlur={(event) => {
            onBlur?.();
            if (addOnBlur && !event.currentTarget.contains(event.relatedTarget))
                onCommit();
        }}
        data-cratis-part='root'
        data-cratis-component='ChipsField'
        data-disabled={pt?.input?.disabled || undefined}
        data-invalid={invalid || undefined}
        data-readonly={pt?.input?.readOnly || undefined}
    >
        {children}
    </div>
);
