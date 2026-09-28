// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { HTMLAttributes } from 'react';
import type { ButtonParts } from '../Common/Button';
import { unstable_useSlot } from '../renderer/RendererContext';
import { renderSlot } from '../renderer/renderSlot';
import type { unstable_SlotDeclaration } from '../renderer/slots';
import { TablePaginatorImplementation } from './TablePaginatorImplementation';

/** Stable Cratis-owned paginator parts. */
export interface TablePaginatorParts {
    /** Pagination navigation root. */
    root?: HTMLAttributes<HTMLDivElement>;
    /** Loaded item-range report. */
    range?: HTMLAttributes<HTMLSpanElement>;
    /** Current page / page-count report. */
    info?: HTMLAttributes<HTMLSpanElement>;
    /** First-page Button parts. */
    first?: ButtonParts;
    /** Previous-page Button parts. */
    previous?: ButtonParts;
    /** Next-page Button parts. */
    next?: ButtonParts;
    /** Last-page Button parts. */
    last?: ButtonParts;
}

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
    /** Cratis-owned paginator part attributes. */
    pt?: TablePaginatorParts;
    /**
     * @deprecated Cratis parts always merge. Remove this renderer-era option.
     */
    ptOptions?: object;
}

const coreTablePaginatorDeclaration = Object.freeze({
    mode: 'atomic',
    fidelity: 'native',
    render: TablePaginatorImplementation,
}) satisfies unstable_SlotDeclaration<'datatables.paginator'>;

/**
 * A minimal first/previous/next/last paginator. The Cratis data tables drive paging through Arc's
 * paging hook and receive requested zero-based pages through `onPageChange`.
 */
export const TablePaginator = (props: TablePaginatorProps) => {
    const declaration = unstable_useSlot(
        'datatables.paginator',
        coreTablePaginatorDeclaration,
    );
    return renderSlot(declaration, props);
};
