// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { TablePaginatorProps } from './TablePaginator';
import { paginatorPages } from './paginatorPages';

interface TablePaginatorPagesProps extends Pick<
    TablePaginatorProps,
    'page' | 'pageCount' | 'pageLinks' | 'onPageChange' | 'pt'
> {
    pageLabel: (page: number) => string;
    pagesLabel: string;
}

/** Core numbered-page group, with paginator-owned native buttons and inert gaps. */
export const TablePaginatorPages = ({
    page,
    pageCount,
    pageLinks,
    onPageChange,
    pt,
    pageLabel,
    pagesLabel,
}: TablePaginatorPagesProps) => {
    const options = typeof pageLinks === 'object' ? pageLinks : undefined;
    const items = paginatorPages(page, pageCount, options?.siblings, options?.boundaries);

    return (
        <div
            {...pt?.pages}
            role='group'
            aria-label={pagesLabel}
            className={['cratis-table-paginator-pages', pt?.pages?.className]
                .filter(Boolean)
                .join(' ')}
            data-cratis-part='pages'
        >
            {items.map((item) =>
                item.kind === 'ellipsis' ? (
                    <span
                        key={item.key}
                        {...pt?.ellipsis}
                        aria-hidden='true'
                        className={[
                            'cratis-table-paginator-ellipsis',
                            pt?.ellipsis?.className,
                        ]
                            .filter(Boolean)
                            .join(' ')}
                        data-cratis-part='ellipsis'
                    >
                        …
                    </span>
                ) : (
                    <button
                        key={item.page}
                        {...pt?.page}
                        type='button'
                        aria-label={pageLabel(item.page + 1)}
                        aria-current={item.page === page ? 'page' : undefined}
                        data-selected={item.page === page || undefined}
                        data-cratis-part='page'
                        className={['cratis-table-paginator-page', pt?.page?.className]
                            .filter(Boolean)
                            .join(' ')}
                        onClick={() => onPageChange(item.page)}
                    >
                        {item.page + 1}
                    </button>
                ),
            )}
        </div>
    );
};
