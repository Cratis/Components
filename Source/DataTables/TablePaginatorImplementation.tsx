// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import { Button } from '../Common/Button';
import { useCratisComponentsConfig } from '../Common/CratisComponentsProvider';
import { useCratisIcon } from '../configuration/useCratisIcon';
import type { TablePaginatorParts, TablePaginatorProps } from './TablePaginator';
import { paginatorRange } from './paginatorRange';
import { resolvePaginatorLabels, resolvePaginatorRangeFormat } from './paginatorLabels';
import { usePaginatorFocus } from './usePaginatorFocus';
import { TablePaginatorPages } from './TablePaginatorPages';

const joinClassNames = (...classNames: (string | undefined)[]) => classNames.filter(Boolean).join(' ');

const renderRange = (rangeReport: string | undefined, rangePart: TablePaginatorParts['range']) =>
    rangeReport && (
        <span
            {...rangePart}
            className={joinClassNames('cratis-table-paginator-range', rangePart?.className)}
            data-cratis-part='range'
        >
            {rangeReport}
        </span>
    );

const renderInfo = (page: number, pageCount: number, infoPart: TablePaginatorParts['info']) => (
    <span
        {...infoPart}
        className={joinClassNames('cratis-table-paginator-info', infoPart?.className)}
        data-cratis-part='info'
    >
        {page + 1} / {Math.max(pageCount, 1)}
    </span>
);

interface PageButtonOptions {
    disabled: boolean;
    onClick: () => void;
    label: string;
    parts: TablePaginatorParts['first'];
    glyph: ReactNode;
}

const renderPageButton = ({ disabled, onClick, label, parts, glyph }: PageButtonOptions) => (
    <Button
        variant='ghost'
        disabled={disabled}
        onClick={onClick}
        aria-label={label}
        pt={parts}
    >
        <span aria-hidden='true'>{glyph}</span>
    </Button>
);

/**
 * A minimal first/previous/next/last paginator. The
 * Cratis data tables drive paging through Arc's paging hook rather than the
 * table's internal pagination — so this renders the page controls wired to a
 * simple `onPageChange(pageIndex)` callback.
 */
export const TablePaginatorImplementation = ({
    page,
    pageCount,
    onPageChange,
    totalItems,
    pageSize,
    pageLinks = false,
    ariaLabels,
    className,
    pt,
}: TablePaginatorProps) => {
    const { messages } = useCratisComponentsConfig();
    const paginatorMessages = messages?.paginator;
    const icon = useCratisIcon();
    const isFirst = page <= 0;
    const isLast = page >= pageCount - 1;
    const { rootRef, focusedControl } = usePaginatorFocus(isFirst, isLast);
    const rangeReport = paginatorRange(
        page,
        pageSize,
        totalItems,
        resolvePaginatorRangeFormat(ariaLabels, paginatorMessages),
    );
    const labels = resolvePaginatorLabels(ariaLabels, paginatorMessages);
    const rootPart = pt?.root;

    return (
        <div
            {...rootPart}
            ref={rootRef}
            onFocus={(event) => {
                focusedControl.current = event.target;
                rootPart?.onFocus?.(event);
            }}
            role='navigation'
            aria-label={labels.navigation}
            data-cratis-part='root'
            data-cratis-component='TablePaginator'
            className={joinClassNames('cratis-table-paginator', rootPart?.className, className)}
        >
            {renderRange(rangeReport, pt?.range)}
            {renderPageButton({ disabled: isFirst, onClick: () => onPageChange(0), label: labels.first, parts: pt?.first, glyph: '«' })}
            {renderPageButton({
                disabled: isFirst,
                onClick: () => onPageChange(page - 1),
                label: labels.previous,
                parts: pt?.previous,
                glyph: icon('previous', '‹'),
            })}
            {pageLinks ? (
                <TablePaginatorPages
                    page={page}
                    pageCount={pageCount}
                    pageLinks={pageLinks}
                    onPageChange={onPageChange}
                    pt={pt}
                    pageLabel={labels.page}
                    pagesLabel={labels.pages}
                />
            ) : (
                renderInfo(page, pageCount, pt?.info)
            )}
            {renderPageButton({
                disabled: isLast,
                onClick: () => onPageChange(page + 1),
                label: labels.next,
                parts: pt?.next,
                glyph: icon('next', '›'),
            })}
            {renderPageButton({
                disabled: isLast,
                onClick: () => onPageChange(pageCount - 1),
                label: labels.last,
                parts: pt?.last,
                glyph: '»',
            })}
        </div>
    );
};
