// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CratisPaginatorMessages } from '../Common/CratisComponentsProvider';

type PaginatorLabelKey = Exclude<keyof CratisPaginatorMessages, 'range'>;

/** The resolved accessible names for the paginator and its controls. */
export type PaginatorLabels = Required<Pick<CratisPaginatorMessages, PaginatorLabelKey>>;

/** Resolves each label from the explicit labels, then the configured messages, then English. */
export const resolvePaginatorLabels = (
    ariaLabels: CratisPaginatorMessages | undefined,
    messages: CratisPaginatorMessages | undefined,
): PaginatorLabels => {
    const fallbacks: PaginatorLabels = {
        navigation: 'Pagination',
        first: 'First page',
        previous: 'Previous page',
        next: 'Next page',
        last: 'Last page',
        page: (number: number) => `Page ${number}`,
        pages: 'Pages',
    };
    const explicit: Partial<PaginatorLabels> = ariaLabels ?? {};
    const configured: Partial<PaginatorLabels> = messages ?? {};
    const labelFor = <K extends PaginatorLabelKey>(key: K): PaginatorLabels[K] =>
        explicit[key] ?? configured[key] ?? fallbacks[key];
    return {
        navigation: labelFor('navigation'),
        first: labelFor('first'),
        previous: labelFor('previous'),
        next: labelFor('next'),
        last: labelFor('last'),
        page: labelFor('page'),
        pages: labelFor('pages'),
    };
};

/** Resolves the range formatter from the explicit labels, then the configured messages. */
export const resolvePaginatorRangeFormat = (
    ariaLabels: CratisPaginatorMessages | undefined,
    messages: CratisPaginatorMessages | undefined,
) => ariaLabels?.range ?? messages?.range;
