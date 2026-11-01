// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { describeComponent } from '../configuration/identity/describeComponent';
import type { ColumnProps } from './Column';

/** Presentation props of a data table {@link Column}, identified on its header cell as `DataTableColumn`. */
export const columnDescriptor = describeComponent<ColumnProps>('DataTableColumn', [
    { name: 'header', label: 'Header', type: 'string', description: 'The text at the top of the column.' },
    { name: 'sortable', label: 'Sortable', type: 'boolean', defaultValue: false },
    { name: 'filter', label: 'Filterable', type: 'boolean', defaultValue: false },
]);
