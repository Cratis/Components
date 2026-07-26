// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Button } from 'primereact/button';
import { paginatorRange } from './paginatorRange';
import './TablePaginator.css';

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
export const TablePaginator = ({ page, pageCount, onPageChange, totalItems, pageSize, ariaLabels, className }: TablePaginatorProps) => {
    const isFirst = page <= 0;
    const isLast = page >= pageCount - 1;
    const rangeReport = paginatorRange(page, pageSize, totalItems);
    // English defaults; a consumer overrides any of these to localize.
    const labels = { navigation: 'Pagination', first: 'First page', previous: 'Previous page', next: 'Next page', last: 'Last page', ...ariaLabels };

    return (
        <div
            role="navigation"
            aria-label={labels.navigation}
            className={className ? `cratis-table-paginator ${className}` : 'cratis-table-paginator'}>
            {rangeReport && <span className="cratis-table-paginator-range">{rangeReport}</span>}
            <Button variant="text" disabled={isFirst} onClick={() => onPageChange(0)} aria-label={labels.first}>
                <i className="pi pi-angle-double-left" />
            </Button>
            <Button variant="text" disabled={isFirst} onClick={() => onPageChange(page - 1)} aria-label={labels.previous}>
                <i className="pi pi-angle-left" />
            </Button>
            <span className="cratis-table-paginator-info">{page + 1} / {Math.max(pageCount, 1)}</span>
            <Button variant="text" disabled={isLast} onClick={() => onPageChange(page + 1)} aria-label={labels.next}>
                <i className="pi pi-angle-right" />
            </Button>
            <Button variant="text" disabled={isLast} onClick={() => onPageChange(pageCount - 1)} aria-label={labels.last}>
                <i className="pi pi-angle-double-right" />
            </Button>
        </div>
    );
};
