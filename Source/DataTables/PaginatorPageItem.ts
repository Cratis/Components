// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** A numbered page or a non-interactive gap in {@link paginatorPages}. */
export type PaginatorPageItem =
    | {
          /** Identifies a numbered page. */
          kind: 'page';
          /** The zero-based page index. */
          page: number;
      }
    | {
          /** Identifies a gap of at least two pages. */
          kind: 'ellipsis';
          /** Stable identity for the gap before or after the current page window. */
          key: 'start' | 'end';
      };
