// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Formats the "X–Y of Z" range report for a zero-based page, or `undefined`
 * when the totals are unknown or there are no records. The end is clamped to
 * the total so the last (partial) page reports correctly.
 *
 * @param page - Zero-based current page.
 * @param pageSize - Rows per page.
 * @param totalItems - Total records across all pages.
 */
export function paginatorRange(page: number, pageSize: number | undefined, totalItems: number | undefined): string | undefined {
    if (totalItems === undefined || pageSize === undefined || totalItems <= 0) return undefined;
    const start = page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, totalItems);
    return `${start}–${end} of ${totalItems}`;
}
