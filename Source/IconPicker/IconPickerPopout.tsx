// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useRef } from 'react';
import { FaXmark } from 'react-icons/fa6';
import { Dialog, type DialogProps } from 'react-aria-components/Dialog';
import { Heading } from 'react-aria-components/Heading';
import { classNames } from '../ClassNames/classNames';
import type { IconPickerAllowed } from './IconPickerAllowed';
import type { IconPickerCatalog } from './IconPickerCatalog';
import { IconPickerCategoryFilter } from './IconPickerCategoryFilter';
import type { IconPickerEntry } from './IconPickerEntry';
import type { IconPickerLabels } from './IconPickerLabels';
import { IconPickerLibraryFilter } from './IconPickerLibraryFilter';
import type { IconPickerParts } from './IconPickerParts';
import { IconPickerResults } from './IconPickerResults';
import { IconPickerSearch } from './IconPickerSearch';
import type { IconPickerValue } from './IconPickerValue';
import { iconPickerIdentity } from './iconPickerIdentity';
import { isIconPickerAllowed } from './isIconPickerAllowed';
import { useIconPickerBrowser } from './useIconPickerBrowser';

/** Props for {@link IconPickerPopout}. */
export interface IconPickerPopoutProps {
    /** The catalog to browse. */
    catalog: IconPickerCatalog;

    /** The current selection, if any. */
    value: IconPickerValue | null | undefined;

    /** The field's restriction, if any. */
    allowed?: IconPickerAllowed;

    /** The resolved labels. */
    labels: Required<IconPickerLabels>;

    /** How many icons a compact category group lists before offering to show them all. */
    compactGroupSize: number;

    /** Picks an icon. */
    onChoose: (entry: IconPickerEntry) => void;

    /** Dismisses the popout without picking. */
    onClose: () => void;

    /** Pass-through attributes. */
    parts?: IconPickerParts;
}

/**
 * The content of the popout (or sheet): title and close, search, library and category filters, the
 * statement of what is showing, the icons, and the libraries' credits. It owns the search and filter
 * state, which therefore starts fresh each time the popout opens.
 */
export const IconPickerPopout = ({
    catalog,
    value,
    allowed,
    labels,
    compactGroupSize,
    onChoose,
    onClose,
    parts,
}: IconPickerPopoutProps) => {
    const browser = useIconPickerBrowser(catalog.icons);
    const results = useRef<HTMLDivElement>(null);
    const hasSeveralLibraries = catalog.libraries.length > 1;
    const libraryName = (id: string) => catalog.libraries.find(library => library.id === id)?.name ?? id;
    const categoryName = browser.category === undefined ? undefined : browser.category === '' ? labels.uncategorized : browser.category;
    const credited = catalog.libraries.filter(
        library =>
            (browser.library === undefined || library.id === browser.library) &&
            (library.attribution !== undefined || library.version !== undefined),
    );

    const moveToResults = () =>
        (
            results.current?.querySelector<HTMLElement>('[role="option"][tabindex="0"]') ??
            results.current?.querySelector<HTMLElement>('[role="option"]')
        )?.focus();

    return (
        <Dialog
            // SAFETY: spread only onto a React Aria Dialog, which narrows `role` to the dialog roles.
            {...(parts?.dialog as unknown as DialogProps | undefined)}
            className={classNames('cratis-icon-picker__dialog', parts?.dialog?.className)}
            data-cratis-part='dialog'
        >
            <div className='cratis-icon-picker__header'>
                <Heading
                    {...parts?.title}
                    slot='title'
                    className={classNames('cratis-icon-picker__title', parts?.title?.className)}
                    data-cratis-part='title'
                >
                    {labels.title}
                </Heading>
                <button
                    {...parts?.close}
                    type='button'
                    aria-label={labels.close}
                    className={classNames('cratis-icon-picker__close', parts?.close?.className)}
                    data-cratis-part='close'
                    onClick={onClose}
                >
                    <FaXmark aria-hidden='true' focusable='false' />
                </button>
            </div>
            <IconPickerSearch
                value={browser.query}
                onChange={browser.setQuery}
                label={labels.search}
                placeholder={labels.searchPlaceholder}
                clearLabel={labels.clearSearch}
                onMoveToResults={moveToResults}
                parts={parts}
            />
            {(hasSeveralLibraries || browser.categories.length > 0) && (
                <div className='cratis-icon-picker__filters'>
                    {hasSeveralLibraries && (
                        <IconPickerLibraryFilter
                            libraries={catalog.libraries}
                            selected={browser.library}
                            onSelect={browser.setLibrary}
                            label={labels.library}
                            allLabel={labels.allLibraries}
                            parts={parts}
                        />
                    )}
                    {browser.categories.length > 0 && (
                        <IconPickerCategoryFilter
                            categories={browser.categories}
                            selected={browser.category}
                            onSelect={browser.setCategory}
                            label={labels.categories}
                            allLabel={labels.allCategories}
                            uncategorizedLabel={labels.uncategorized}
                            parts={parts}
                        />
                    )}
                </div>
            )}
            {catalog.icons.length > 0 && (
                <p
                    {...parts?.summary}
                    role='status'
                    className={classNames('cratis-icon-picker__summary', parts?.summary?.className)}
                    data-cratis-part='summary'
                >
                    {labels.summary({
                        count: browser.matchCount,
                        query: browser.query.trim(),
                        category: categoryName,
                        library: browser.library === undefined ? undefined : libraryName(browser.library),
                    })}
                </p>
            )}
            <div ref={results} className='cratis-icon-picker__body'>
                <IconPickerResults
                    browser={browser}
                    totalCount={catalog.icons.length}
                    status={catalog.status ?? 'ready'}
                    error={catalog.error}
                    labels={labels}
                    compactGroupSize={compactGroupSize}
                    grid={{
                        selectedIdentity: value ? iconPickerIdentity(value) : undefined,
                        isAllowed: entry => isIconPickerAllowed(entry, allowed),
                        providerName: library => (hasSeveralLibraries ? libraryName(library) : undefined),
                        deprecatedLabel: labels.deprecated,
                        notAllowedLabel: labels.notAllowed,
                        onChoose,
                    }}
                    parts={parts}
                />
            </div>
            {credited.length > 0 && (
                <div className='cratis-icon-picker__credits'>
                    {credited.map(library => (
                        <p
                            key={library.id}
                            {...parts?.attribution}
                            className={classNames('cratis-icon-picker__attribution', parts?.attribution?.className)}
                            data-cratis-part='attribution'
                        >
                            {labels.credit(library.name, library.version, library.attribution)}
                        </p>
                    ))}
                </div>
            )}
        </Dialog>
    );
};
