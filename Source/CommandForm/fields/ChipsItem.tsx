// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { classNames } from '../../ClassNames/classNames';
import { useCratisIcon } from '../../configuration/useCratisIcon';
import type { ChipsParts } from './ChipsField';

/** Props for {@link ChipsItem}. */
export interface ChipsItemProps {
    item: string;
    index: number;
    /** Builds a remove-button label, or supplies one shared localized label. */
    removeAriaLabel?: string | ((item: string, index: number) => string);
    /** The field's part attributes. */
    parts?: ChipsParts;
    onRemove: () => void;
}

const removeLabel = (
    { item, index, removeAriaLabel }: Pick<ChipsItemProps, 'item' | 'index' | 'removeAriaLabel'>,
) =>
    typeof removeAriaLabel === 'function'
        ? removeAriaLabel(item, index)
        : (removeAriaLabel ?? `Remove ${item}`);

/** One selected chip with its remove button. */
export const ChipsItem = ({ item, index, removeAriaLabel, parts: pt, onRemove }: ChipsItemProps) => {
    const icon = useCratisIcon();
    return (
        <span
            {...pt?.item}
            className={classNames('cratis-chips-field__item', pt?.item?.className)}
            data-cratis-part='item'
            data-selected
        >
            <span>{item}</span>
            <button
                {...pt?.remove}
                type='button'
                className={classNames('cratis-chips-field__remove', pt?.remove?.className)}
                data-cratis-part='remove'
                data-disabled={pt?.remove?.disabled || undefined}
                data-selected
                aria-label={removeLabel({ item, index, removeAriaLabel })}
                onClick={onRemove}
            >
                {icon('remove', '×')}
            </button>
        </span>
    );
};
