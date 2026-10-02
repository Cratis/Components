// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { IconPickerEntry } from './IconPickerEntry';

/** One catalog entry prepared for searching: its identity and the lowercase text a search matches. */
export interface IconPickerIndexEntry {
    /** The catalog entry. */
    entry: IconPickerEntry;

    /** The entry's qualified identity string. */
    identity: string;

    /** The entry's name, tags and aliases, lowercased and joined. */
    searchText: string;
}
