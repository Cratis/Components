// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';
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
    /** Numbered-page group container. */
    pages?: HTMLAttributes<HTMLDivElement>;
    /** Each numbered-page native button. */
    page?: ButtonHTMLAttributes<HTMLButtonElement>;
    /** Non-interactive gap between numbered pages. */
    ellipsis?: HTMLAttributes<HTMLSpanElement>;
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
    /**
     * Shows numbered page buttons instead of the page-count report. Defaults to false.
     * Pass true for one sibling and one boundary page, or customize the window sizes.
     */
    pageLinks?:
        | boolean
        | {
              /** Number of pages on each side of the current page. Defaults to 1. */
              siblings?: number;
              /** Number of pages at each end of the range. Defaults to 1. */
              boundaries?: number;
          };
    /** Accessible names for the paginator and its controls. Override any to localize. */
    ariaLabels?: {
        navigation?: string;
        first?: string;
        previous?: string;
        next?: string;
        last?: string;
        /** Builds a numbered button's accessible name from its one-based page number. */
        page?: (page: number) => string;
        /** Accessible name for the numbered-page group. */
        pages?: string;
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
 * A first/previous/next/last paginator with optional numbered page links. The Cratis data tables drive paging through Arc's
 * paging hook and receive requested zero-based pages through `onPageChange`.
 */
export const TablePaginator = (props: TablePaginatorProps) => {
    const declaration = unstable_useSlot(
        'datatables.paginator',
        coreTablePaginatorDeclaration,
    );
    return renderSlot(declaration, props);
};
