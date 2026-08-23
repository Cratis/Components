// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState, type HTMLAttributes, type InputHTMLAttributes } from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';

/** Stable part attributes for {@link ChipsField}. */
export interface ChipsParts {
    /** Field wrapper. */
    root?: HTMLAttributes<HTMLDivElement>;
    /** One selected chip. */
    item?: HTMLAttributes<HTMLSpanElement>;
    /** Chip removal button. */
    remove?: React.ButtonHTMLAttributes<HTMLButtonElement>;
    /** Native draft-value input. */
    input?: InputHTMLAttributes<HTMLInputElement>;
}

interface ChipsFieldComponentProps
    extends WrappedFieldProps<string[]>,
        FieldAccessibilityProps {
    placeholder?: string;
    max?: number;
    separator?: string;
    addOnBlur?: boolean;
    allowDuplicate?: boolean;
    removeAriaLabel?: string;
    className?: string;
    pt?: ChipsParts;
    ptOptions?: object;
    unstyled?: boolean;
}

const ChipsControl = (props: ChipsFieldComponentProps) => {
    const [draft, setDraft] = useState('');
    const accessibility = useFieldAccessibility(props, {
        id: props.pt?.input?.id,
        ariaLabel: props.pt?.input?.['aria-label'],
        ariaDescribedBy: props.pt?.input?.['aria-describedby'],
    });

    const commit = () => {
        const candidates = (props.separator ? draft.split(props.separator) : [draft])
            .map((value) => value.trim())
            .filter(Boolean);
        if (candidates.length === 0) return;
        const available =
            props.max === undefined
                ? candidates
                : candidates.slice(0, Math.max(0, props.max - props.value.length));
        const next = props.allowDuplicate
            ? [...props.value, ...available]
            : [
                  ...props.value,
                  ...available.filter((candidate) => !props.value.includes(candidate)),
              ];
        props.onChange(next);
        setDraft('');
    };

    return (
        <div
            {...props.pt?.root}
            className={[
                'cratis-chips-field',
                'w-full',
                props.pt?.root?.className,
                props.className,
            ]
                .filter(Boolean)
                .join(' ')}
            onBlur={(event) => {
                props.onBlur?.();
                if (props.addOnBlur && !event.currentTarget.contains(event.relatedTarget))
                    commit();
            }}
            data-cratis-part='root'
            data-invalid={props.invalid || undefined}
        >
            {props.value.map((item, index) => (
                <span
                    {...props.pt?.item}
                    key={`${item}-${index}`}
                    className={['cratis-chips-field__item', props.pt?.item?.className]
                        .filter(Boolean)
                        .join(' ')}
                    data-cratis-part='item'
                >
                    <span>{item}</span>
                    <button
                        {...props.pt?.remove}
                        type='button'
                        className={[
                            'cratis-chips-field__remove',
                            props.pt?.remove?.className,
                        ]
                            .filter(Boolean)
                            .join(' ')}
                        data-cratis-part='remove'
                        aria-label={props.removeAriaLabel ?? 'Remove'}
                        onClick={() =>
                            props.onChange(
                                props.value.filter((_, itemIndex) => itemIndex !== index),
                            )
                        }
                    >
                        ×
                    </button>
                </span>
            ))}
            <input
                {...props.pt?.input}
                id={accessibility.controlId}
                aria-label={accessibility.ariaLabel}
                aria-describedby={accessibility.ariaDescribedBy}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        commit();
                    }
                }}
                placeholder={props.placeholder}
                aria-invalid={props.invalid || undefined}
                className={['cratis-chips-field__input', props.pt?.input?.className]
                    .filter(Boolean)
                    .join(' ')}
                data-cratis-part='input'
            />
            {accessibility.hiddenError}
        </div>
    );
};

/** A token input bound to a string array property on an Arc command. */
export const ChipsField = asCommandFormField<ChipsFieldComponentProps>(ChipsControl, {
    defaultValue: [],
    extractValue: (value: unknown) =>
        Array.isArray(value)
            ? value.filter((item): item is string => typeof item === 'string')
            : [],
});
