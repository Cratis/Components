// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCratisComponentsConfig } from '@cratis/components';
import type { TablePaginatorProps } from '@cratis/components/DataTables';

const defaultRange = (start: number, end: number, total: number) =>
    `${start}–${end} of ${total}`;

const defaultLabels = {
    navigation: 'Pagination',
    first: 'First page',
    previous: 'Previous page',
    next: 'Next page',
    last: 'Last page',
    pages: 'Pages',
    page: (number: number) => `Page ${number}`,
};

/** Resolves the paginator labels from the props, the Components messages and the defaults. */
export const useLabels = ({ ariaLabels }: TablePaginatorProps) => {
    const messages = useCratisComponentsConfig().messages?.paginator;
    const resolve = <K extends keyof typeof defaultLabels>(key: K) =>
        (ariaLabels?.[key] ?? messages?.[key] ?? defaultLabels[key]) as (typeof defaultLabels)[K];
    return {
        navigation: resolve('navigation'),
        first: resolve('first'),
        previous: resolve('previous'),
        next: resolve('next'),
        last: resolve('last'),
        page: resolve('page'),
        pages: resolve('pages'),
        range: messages?.range ?? defaultRange,
    };
};

export type PaginatorLabels = ReturnType<typeof useLabels>;

/** Builds the "start–end of total" report, or nothing when the totals are unknown. */
export const rangeReport = (
    { page, pageSize, totalItems, ariaLabels }: TablePaginatorProps,
    format: PaginatorLabels['range'],
) => {
    if (totalItems === undefined || pageSize === undefined || totalItems <= 0)
        return undefined;
    return (ariaLabels?.range ?? format)(
        page * pageSize + 1,
        Math.min((page + 1) * pageSize, totalItems),
        totalItems,
    );
};
