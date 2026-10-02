// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { IconPickerEntry } from './IconPickerEntry';

/** One category's icons as the popout browses them. */
export interface IconPickerBrowserGroup {
    /** The category name, or an empty string for the group of icons that list no category. */
    category: string;

    /** Every icon in the category that matches the active search and library. */
    entries: IconPickerEntry[];
}
