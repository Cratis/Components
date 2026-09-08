// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Button } from '../Common/Button';
import { useCratisComponentsConfig } from '../Common/CratisComponentsProvider';
import type { TablePaginatorProps } from './TablePaginator';
import { paginatorRange } from './paginatorRange';

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
    ariaLabels,
    className,
    pt,
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
            {...pt?.root}
            role='navigation'
            aria-label={labels.navigation}
            data-cratis-part='root'
            className={['cratis-table-paginator', pt?.root?.className, className]
                .filter(Boolean)
                .join(' ')}
        >
            {rangeReport && (
                <span
                    {...pt?.range}
                    className={['cratis-table-paginator-range', pt?.range?.className]
                        .filter(Boolean)
                        .join(' ')}
                    data-cratis-part='range'
                >
                    {rangeReport}
                </span>
            )}
            <Button
                variant='ghost'
                disabled={isFirst}
                onClick={() => onPageChange(0)}
                aria-label={labels.first}
                pt={pt?.first}
            >
                <span aria-hidden='true'>«</span>
            </Button>
            <Button
                variant='ghost'
                disabled={isFirst}
                onClick={() => onPageChange(page - 1)}
                aria-label={labels.previous}
                pt={pt?.previous}
            >
                <span aria-hidden='true'>‹</span>
            </Button>
            <span
                {...pt?.info}
                className={['cratis-table-paginator-info', pt?.info?.className]
                    .filter(Boolean)
                    .join(' ')}
                data-cratis-part='info'
            >
                {page + 1} / {Math.max(pageCount, 1)}
            </span>
            <Button
                variant='ghost'
                disabled={isLast}
                onClick={() => onPageChange(page + 1)}
                aria-label={labels.next}
                pt={pt?.next}
            >
                <span aria-hidden='true'>›</span>
            </Button>
            <Button
                variant='ghost'
                disabled={isLast}
                onClick={() => onPageChange(pageCount - 1)}
                aria-label={labels.last}
                pt={pt?.last}
            >
                <span aria-hidden='true'>»</span>
            </Button>
        </div>
    );
};
