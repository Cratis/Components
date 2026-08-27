// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useId, type HTMLAttributes, type InputHTMLAttributes } from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';
import type { ExactPartKeys } from '../../types/ExactPartKeys';
import type { PartsOf } from '../../types/parts';

/** Stable part attributes for {@link RatingField}. */
export interface RatingParts {
    /** Semantic radiogroup wrapper. */
    root?: HTMLAttributes<HTMLDivElement>;
    /** One rating option label. */
    option?: HTMLAttributes<HTMLLabelElement>;
    /** Native radio input. */
    input?: InputHTMLAttributes<HTMLInputElement>;
    /** Visual star. */
    star?: HTMLAttributes<HTMLSpanElement>;
}

const ratingPartsMatchManifest: ExactPartKeys<RatingParts, PartsOf<'RatingField'>> = true;
void ratingPartsMatchManifest;

interface RatingFieldComponentProps
    extends WrappedFieldProps<number>,
        FieldAccessibilityProps {
    stars?: number;
    /** Native radio-group name. Generated automatically when omitted. */
    name?: string;
    starAriaLabel?: (starValue: number) => string;
    className?: string;
    pt?: RatingParts;
    ptOptions?: object;
    unstyled?: boolean;
}

/** A star rating bound to a number property on an Arc command. */
export const RatingField = asCommandFormField<RatingFieldComponentProps>(
    (props) => {
        const generatedName = useId();
        const name = props.name ?? generatedName;
        const accessibility = useFieldAccessibility(props, {
            id: props.pt?.root?.id,
            ariaLabel: props.pt?.root?.['aria-label'],
            ariaDescribedBy: props.pt?.root?.['aria-describedby'],
        });

        return (
            <div
                {...props.pt?.root}
                id={accessibility.controlId}
                role='radiogroup'
                aria-label={accessibility.ariaLabel}
                aria-describedby={accessibility.ariaDescribedBy}
                aria-invalid={props.invalid || undefined}
                className={[
                    'cratis-rating-field',
                    props.pt?.root?.className,
                    props.className,
                ]
                    .filter(Boolean)
                    .join(' ')}
                onBlur={props.onBlur}
                data-cratis-part='root'
                data-invalid={props.invalid || undefined}
            >
                {Array.from({ length: props.stars ?? 5 }, (_, index) => {
                    const starValue = index + 1;
                    const label = (
                        props.starAriaLabel ??
                        ((value: number) => `${value} ${value === 1 ? 'star' : 'stars'}`)
                    )(starValue);
                    return (
                        <label
                            {...props.pt?.option}
                            key={starValue}
                            className={[
                                'cratis-rating-field__option',
                                props.pt?.option?.className,
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            data-cratis-part='option'
                        >
                            <input
                                {...props.pt?.input}
                                type='radio'
                                name={name}
                                checked={props.value === starValue}
                                onChange={(event) => {
                                    if (event.target.checked) props.onChange(starValue);
                                }}
                                aria-label={label}
                                className={[
                                    'cratis-choice-field__native',
                                    props.pt?.input?.className,
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                                data-cratis-part='input'
                            />
                            <span
                                {...props.pt?.star}
                                className={[
                                    'cratis-rating-field__star',
                                    props.pt?.star?.className,
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                                data-cratis-part='star'
                                data-selected={starValue <= props.value || undefined}
                                aria-hidden='true'
                            >
                                ★
                            </span>
                        </label>
                    );
                })}
                {accessibility.hiddenError}
            </div>
        );
    },
    {
        defaultValue: 0,
        extractValue: (value: unknown) => (typeof value === 'number' ? value : 0),
    },
);
