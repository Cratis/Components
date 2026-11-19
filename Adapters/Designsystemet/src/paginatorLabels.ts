// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CSSProperties } from 'react';
import { useCratisComponentsConfig } from '@cratis/components';
import type { TablePaginatorProps } from '@cratis/components/DataTables';

// Designsystemet styles a current page only through aria-current="true"; the accessible
// aria-current="page" is kept, so the filled look is supplied through the same button tokens.
export const currentPageStyle = {
    '--dsc-button-background': 'var(--ds-color-base-default)',
    '--dsc-button-background--hover': 'var(--ds-color-base-hover)',
    '--dsc-button-background--active': 'var(--ds-color-base-active)',
    '--dsc-button-color': 'var(--ds-color-base-contrast-default)',
    '--dsc-button-color--hover': 'var(--ds-color-base-contrast-default)',
    '--dsc-button-color--active': 'var(--ds-color-base-contrast-default)',
} as CSSProperties;

// The group is a flex box with the pagination gap, so the numbered pages space exactly as they did
// when each was its own list item. Designsystemet's button variables inherit from the group.
export const pagesGroupStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 'var(--dsc-pagination-gap)',
};

const defaultRange = (start: number, end: number, total: number) => `${start}–${end} of ${total}`;

export const rangeReport = ({ page, pageSize, totalItems, ariaLabels }: TablePaginatorProps, format: typeof defaultRange) => {
    if (totalItems === undefined || pageSize === undefined || totalItems <= 0) return undefined;
    return (ariaLabels?.range ?? format)(page * pageSize + 1, Math.min((page + 1) * pageSize, totalItems), totalItems);
};

const defaultLabels = {
    navigation: 'Pagination',
    first: 'First page',
    previous: 'Previous page',
    next: 'Next page',
    last: 'Last page',
    pages: 'Pages',
    page: (number: number) => `Page ${number}`,
};

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
