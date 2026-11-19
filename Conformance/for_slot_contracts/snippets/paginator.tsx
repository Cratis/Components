// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { TablePaginatorProps } from '@cratis/components/DataTables';
import type { CratisAtomicSlotMap } from '@cratis/components/renderer';

const ExamplePaginator = ({ page, pageCount, onPageChange, pt }: TablePaginatorProps) => (
    <div {...pt?.root} role='navigation' aria-label='Pagination' data-cratis-part='root'>
        <button
            type='button'
            aria-label='Previous page'
            disabled={page === 0}
            data-cratis-part='previous'
            onClick={() => onPageChange(page - 1)}
        >
            Previous
        </button>
        <span {...pt?.info} data-cratis-part='info'>
            {page + 1} / {pageCount}
        </span>
        <button
            type='button'
            aria-label='Next page'
            disabled={page >= pageCount - 1}
            data-cratis-part='next'
            onClick={() => onPageChange(page + 1)}
        >
            Next
        </button>
    </div>
);

export const atomicSlots = {
    'datatables.paginator': { mode: 'atomic', fidelity: 'native', render: ExamplePaginator },
} satisfies CratisAtomicSlotMap;
