// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Button } from 'primereact/button';
import './TablePaginator.css';

/** Props for {@link TablePaginator}. */
export interface TablePaginatorProps {
    /** The current page, zero-based. */
    page: number;
    /** The total number of pages. */
    pageCount: number;
    /** Invoked with the requested zero-based page. */
    onPageChange: (page: number) => void;
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
export const TablePaginator = ({ page, pageCount, onPageChange, className }: TablePaginatorProps) => {
    const isFirst = page <= 0;
    const isLast = page >= pageCount - 1;

    return (
        <div className={className ? `cratis-table-paginator ${className}` : 'cratis-table-paginator'}>
            <Button variant="text" disabled={isFirst} onClick={() => onPageChange(0)} aria-label="First page">
                <i className="pi pi-angle-double-left" />
            </Button>
            <Button variant="text" disabled={isFirst} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
                <i className="pi pi-angle-left" />
            </Button>
            <span className="cratis-table-paginator-info">{page + 1} / {Math.max(pageCount, 1)}</span>
            <Button variant="text" disabled={isLast} onClick={() => onPageChange(page + 1)} aria-label="Next page">
                <i className="pi pi-angle-right" />
            </Button>
            <Button variant="text" disabled={isLast} onClick={() => onPageChange(pageCount - 1)} aria-label="Last page">
                <i className="pi pi-angle-double-right" />
            </Button>
        </div>
    );
};
