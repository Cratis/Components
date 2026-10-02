// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useId, type ReactNode } from 'react';
import { classNames } from '../ClassNames/classNames';
import type { IconPickerBrowser } from './IconPickerBrowser';
import type { IconPickerCatalogStatus } from './IconPickerCatalogStatus';
import { IconPickerGrid, type IconPickerGridProps } from './IconPickerGrid';
import type { IconPickerLabels } from './IconPickerLabels';
import type { IconPickerParts } from './IconPickerParts';

/** Props for {@link IconPickerResults}. */
export interface IconPickerResultsProps {
    /** What the popout is showing. */
    browser: IconPickerBrowser;

    /** How many icons the catalog holds in all, before any search or filter. */
    totalCount: number;

    /** Whether the catalog is complete. */
    status: IconPickerCatalogStatus;

    /** What went wrong, when `status` is `error`. */
    error?: string;

    /** The resolved labels. */
    labels: Required<IconPickerLabels>;

    /** How many icons a compact category group lists before offering to show them all. */
    compactGroupSize: number;

    /** The props shared by every grid. */
    grid: Omit<IconPickerGridProps, 'entries' | 'label'>;

    /** Pass-through attributes. */
    parts?: IconPickerParts;
}

const State = ({ role, loading, children, parts }: { role: 'status' | 'alert'; loading?: boolean; children: ReactNode; parts?: IconPickerParts }) => (
    <div
        {...parts?.status}
        role={role}
        className={classNames('cratis-icon-picker__status', parts?.status?.className)}
        data-cratis-part='status'
        data-loading={loading || undefined}
    >
        {children}
    </div>
);

/**
 * The popout's body: the loading, error, empty and no-results states, and the icons themselves -
 * compact category groups while browsing, or one grid while searching or inside a chosen category.
 * Icons already loaded stay listed, and stay selectable, while a catalog is still loading or has failed.
 */
export const IconPickerResults = ({ browser, totalCount, status, error, labels, compactGroupSize, grid, parts }: IconPickerResultsProps) => {
    const baseId = useId();
    const categoryName = (category: string) => (category === '' ? labels.uncategorized : category);
    const showGroups = browser.isGrouped && browser.matchCount > 0;
    const showFlat = !browser.isGrouped && browser.matchCount > 0;

    return (
        <div className='cratis-icon-picker__results'>
            {status === 'loading' && (
                <State role='status' loading parts={parts}>
                    {labels.loading}
                </State>
            )}
            {status === 'error' && (
                <State role='alert' parts={parts}>
                    {error ?? labels.error}
                </State>
            )}
            {status === 'ready' && totalCount === 0 && <State role='status' parts={parts}>{labels.empty}</State>}
            {totalCount > 0 && browser.matchCount === 0 && (
                <State role='status' parts={parts}>
                    <span>{labels.noResults(browser.query.trim())}</span>
                    <button type='button' className='cratis-icon-picker__link' onClick={browser.reset}>
                        {labels.clearFilters}
                    </button>
                </State>
            )}
            {showGroups &&
                browser.groups.map(group => {
                    const titleId = `${baseId}-${group.category}`;
                    const overflow = group.entries.length > compactGroupSize;
                    return (
                        <section
                            key={group.category}
                            {...parts?.group}
                            aria-labelledby={titleId}
                            className={classNames('cratis-icon-picker__group', parts?.group?.className)}
                            data-cratis-part='group'
                        >
                            <div className='cratis-icon-picker__group-header'>
                                <h3
                                    {...parts?.groupTitle}
                                    id={titleId}
                                    className={classNames('cratis-icon-picker__group-title', parts?.groupTitle?.className)}
                                    data-cratis-part='groupTitle'
                                >
                                    {categoryName(group.category)}
                                </h3>
                                {overflow && (
                                    <button
                                        {...parts?.showAll}
                                        type='button'
                                        aria-describedby={titleId}
                                        className={classNames('cratis-icon-picker__link', parts?.showAll?.className)}
                                        data-cratis-part='showAll'
                                        onClick={() => browser.setCategory(group.category)}
                                    >
                                        {labels.showAll(group.entries.length)}
                                    </button>
                                )}
                            </div>
                            <IconPickerGrid
                                {...grid}
                                entries={overflow ? group.entries.slice(0, compactGroupSize) : group.entries}
                                label={categoryName(group.category)}
                                parts={parts}
                            />
                        </section>
                    );
                })}
            {showFlat && <IconPickerGrid {...grid} entries={browser.matches} label={labels.title} parts={parts} />}
        </div>
    );
};
