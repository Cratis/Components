// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { IconPickerCatalogStatus } from './IconPickerCatalogStatus';
import type { IconPickerEntry } from './IconPickerEntry';
import type { IconPickerLibrary } from './IconPickerLibrary';

/**
 * The effective icon catalog a host supplies to an `IconPicker`. The picker never resolves packages or
 * loads icons itself; it browses and searches exactly what it is given, so a host adapts whatever
 * icon source it has into this shape.
 */
export interface IconPickerCatalog {
    /** The libraries the icons come from. */
    libraries: readonly IconPickerLibrary[];

    /** Every icon on offer. May grow while `status` is `loading`; the selection stays stable meanwhile. */
    icons: readonly IconPickerEntry[];

    /** Whether the catalog is complete. Defaults to `ready`. */
    status?: IconPickerCatalogStatus;

    /** What went wrong, shown when `status` is `error`. */
    error?: string;
}
