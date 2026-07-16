// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Rating } from 'primereact/rating';
import type { RatingRootProps, RatingRootValueChangeEvent } from '@primereact/types/primitive/rating';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';

/** Component-level props for {@link RatingField}. */
interface RatingFieldComponentProps extends WrappedFieldProps<number> {
    /** Number of stars. Defaults to `5`. */
    stars?: number;
    /** Extra CSS class name. */
    className?: string;
    /** PrimeReact pass-through configuration applied to the underlying Rating. */
    pt?: RatingRootProps['pt'];
    /** PrimeReact pass-through options applied to the underlying Rating. */
    ptOptions?: RatingRootProps['ptOptions'];
    /** When true, disables every base PrimeReact style on the underlying Rating. */
    unstyled?: boolean;
}

/**
 * A star-rating field bound to a `number` property on a Cratis Arc command.
 * See {@link InputTextField} for the full `value={c => c.prop}` binding model.
 *
 * ```tsx
 * <RatingField value={c => c.rating} title="Rating" stars={5} />
 * ```
 */
export const RatingField = asCommandFormField<RatingFieldComponentProps>(
    (props) => (
        <div onBlur={props.onBlur} className={props.className}>
            <Rating.Root
                value={props.value}
                onValueChange={props.onChange}
                invalid={props.invalid}
                pt={props.pt}
                ptOptions={props.ptOptions}
                unstyled={props.unstyled}>
                {Array.from({ length: props.stars ?? 5 }, (_, index) => (
                    <Rating.Option key={index} value={index + 1} index={index}>
                        <Rating.On><i className="pi pi-star-fill" /></Rating.On>
                        <Rating.Off><i className="pi pi-star" /></Rating.Off>
                    </Rating.Option>
                ))}
            </Rating.Root>
        </div>
    ),
    {
        defaultValue: 0,
        extractValue: (e: RatingRootValueChangeEvent) => e.value
    }
);
