// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Optional viewport-based presentation for the DataTable family. */
export interface DataTableMobileLayoutProps {
    /** Render cards below the viewport breakpoint. Omit to keep the semantic table at every width. */
    mobileLayout?: 'cards';
    /** Exclusive viewport threshold in CSS pixels. Defaults to 640; nonfinite/nonpositive values use the default. */
    mobileBreakpoint?: number;
}
