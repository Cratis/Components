// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** What the popout is currently showing, for {@link IconPickerLabels.summary}. */
export interface IconPickerSummary {
    /** How many icons match. */
    count: number;

    /** The active search, or an empty string. */
    query: string;

    /** The name of the active category filter, if any. */
    category?: string;

    /** The name of the active library filter, if any. */
    library?: string;
}
