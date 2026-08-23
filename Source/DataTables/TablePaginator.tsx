// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Button } from '../Common/Button';
import { useCratisComponentsConfig } from '../Common/CratisComponentsProvider';
import { paginatorRange } from './paginatorRange';

/** Props for {@link TablePaginator}. */
export interface TablePaginatorProps {
    /** The current page, zero-based. */
    page: number;
    /** The total number of pages. */
    pageCount: number;
    /** Invoked with the requested zero-based page. */
    onPageChange: (page: number) => void;
    /** Total number of records across all pages — enables the "X–Y of Z" range report. */
    totalItems?: number;
    /** Rows per page — enables the "X–Y of Z" range report. */
    pageSize?: number;
    /** Accessible names for the paginator and its controls. Override any to localize. */
    ariaLabels?: {
        navigation?: string;
        first?: string;
        previous?: string;
        next?: string;
        last?: string;
    };
    /** Extra class name for the paginator container. */
    className?: string;
}

/**
 * A minimal first/previous/next/last paginator. PrimeReact 11's `Paginator`
 * is a headless compositional slot rather than a ready-made control, and the
 * Cratis data tables drive paging through Arc's paging hook rather than the
 * table's internal pagination — so this renders the page controls wired to a
 * simple `onPageChange(pageIndex)` callback.
 */
export const TablePaginator = ({
    page,
    pageCount,
    onPageChange,
    totalItems,
    pageSize,
    ariaLabels,
    className,
}: TablePaginatorProps) => {
    const { messages } = useCratisComponentsConfig();
    const paginatorMessages = messages?.paginator;
    const isFirst = page <= 0;
    const isLast = page >= pageCount - 1;
    const rangeReport = paginatorRange(page, pageSize, totalItems);
    const labels = {
        navigation:
            ariaLabels?.navigation ?? paginatorMessages?.navigation ?? 'Pagination',
        first: ariaLabels?.first ?? paginatorMessages?.first ?? 'First page',
        previous: ariaLabels?.previous ?? paginatorMessages?.previous ?? 'Previous page',
        next: ariaLabels?.next ?? paginatorMessages?.next ?? 'Next page',
        last: ariaLabels?.last ?? paginatorMessages?.last ?? 'Last page',
    };

    return (
        <div
            role='navigation'
            aria-label={labels.navigation}
            className={
                className
                    ? `cratis-table-paginator ${className}`
                    : 'cratis-table-paginator'
            }
        >
            {rangeReport && (
                <span className='cratis-table-paginator-range'>{rangeReport}</span>
            )}
            <Button
                text
                disabled={isFirst}
                onClick={() => onPageChange(0)}
                aria-label={labels.first}
            >
                <span aria-hidden='true'>«</span>
            </Button>
            <Button
                text
                disabled={isFirst}
                onClick={() => onPageChange(page - 1)}
                aria-label={labels.previous}
            >
                <span aria-hidden='true'>‹</span>
            </Button>
            <span className='cratis-table-paginator-info'>
                {page + 1} / {Math.max(pageCount, 1)}
            </span>
            <Button
                text
                disabled={isLast}
                onClick={() => onPageChange(page + 1)}
                aria-label={labels.next}
            >
                <span aria-hidden='true'>›</span>
            </Button>
            <Button
                text
                disabled={isLast}
                onClick={() => onPageChange(pageCount - 1)}
                aria-label={labels.last}
            >
                <span aria-hidden='true'>»</span>
            </Button>
        </div>
    );
};
