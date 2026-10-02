// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { classNames } from '../ClassNames/classNames';
import type { IconPickerBrowserGroup } from './IconPickerBrowserGroup';
import type { IconPickerParts } from './IconPickerParts';
import { useRovingFocus } from './useRovingFocus';

/** Props for {@link IconPickerCategoryFilter}. */
export interface IconPickerCategoryFilterProps {
    /** The categories that have a match, with their icons. */
    categories: readonly IconPickerBrowserGroup[];

    /** The active category - an empty string meaning icons with no category - or undefined for all. */
    selected: string | undefined;

    /** Changes the category filter. */
    onSelect: (category: string | undefined) => void;

    /** Accessible name of the filter. */
    label: string;

    /** The text of the option that shows every category. */
    allLabel: string;

    /** The name shown for icons that list no category. */
    uncategorizedLabel: string;

    /** Pass-through attributes for the filter and its options. */
    parts?: Pick<IconPickerParts, 'categories' | 'category'>;
}

/**
 * The row of category options, a group of toggle buttons with one Tab stop and arrow-key movement. The
 * active option is marked `aria-pressed`, and by a heavier border, not by color alone.
 */
export const IconPickerCategoryFilter = ({
    categories,
    selected,
    onSelect,
    label,
    allLabel,
    uncategorizedLabel,
    parts,
}: IconPickerCategoryFilterProps) => {
    const options: { category: string | undefined; text: string; count?: number }[] = [
        { category: undefined, text: allLabel },
        ...categories.map(group => ({
            category: group.category,
            text: group.category === '' ? uncategorizedLabel : group.category,
            count: group.entries.length,
        })),
    ];
    const activeIndex = Math.max(
        options.findIndex(option => option.category === selected),
        0,
    );
    const roving = useRovingFocus(options.length, 0, activeIndex);

    return (
        <div
            {...parts?.categories}
            ref={roving.containerRef}
            role='group'
            aria-label={label}
            className={classNames('cratis-icon-picker__categories', parts?.categories?.className)}
            data-cratis-part='categories'
            onKeyDown={roving.onKeyDown}
        >
            {options.map((option, index) => {
                const isSelected = option.category === selected;
                return (
                    <button
                        key={option.category === undefined ? 'all' : `category:${option.category}`}
                        {...parts?.category}
                        {...roving.itemProps(index)}
                        type='button'
                        aria-pressed={isSelected}
                        className={classNames('cratis-icon-picker__category', parts?.category?.className)}
                        data-cratis-part='category'
                        data-selected={isSelected || undefined}
                        onClick={() => onSelect(option.category)}
                    >
                        {option.text}
                        {option.count !== undefined && <span className='cratis-icon-picker__count'>{option.count}</span>}
                    </button>
                );
            })}
        </div>
    );
};
