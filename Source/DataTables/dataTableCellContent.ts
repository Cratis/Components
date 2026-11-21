// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import type { ColumnProps } from './Column';
import { valueAtPath } from './valueAtPath';

/** Resolves a body template or nested field identically in either presentation. */
export const dataTableCellContent = <TData>(column: ColumnProps<TData>, row: TData): ReactNode => {
    if (column.body) return column.body(row);
    const value = valueAtPath(row as Record<string, unknown>, column.field);
    return value == null ? '' : String(value);
};
