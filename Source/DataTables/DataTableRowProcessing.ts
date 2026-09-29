// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Whether a data table filters and sorts the rows it is given. */
export enum DataTableRowProcessing {
    /** Filter and sort the rows the table was given, such as the loaded page (default). */
    Loaded = 'loaded',
    /**
     * Render the rows exactly as given. Use when the source already applied the table's filter and
     * sort state, for example a server query driven by the controlled `filters` and `sort` props.
     */
    None = 'none',
}
