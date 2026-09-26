// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Overrides for PivotViewer toolbar text and its loading status. Omitted fields retain their English defaults. */
export interface PivotViewerLabels {
    /** Filter button title and filter panel accessible name; defaults to "Filters". */
    filters?: string;
    /** Filter panel search placeholder and accessible name; defaults to "Search…". */
    search?: string;
    /** Dimension selector label; defaults to "Sort by". */
    sortBy?: string;
    /** Collection view button text; defaults to "Collection". */
    collection?: string;
    /** Grouped view button text; defaults to "Grouped". */
    grouped?: string;
    /** Zoom out button title; defaults to "Zoom out". */
    zoomOut?: string;
    /** Zoom slider accessible label; defaults to "Zoom level". */
    zoomLevel?: string;
    /** Zoom slider title, given the rounded percentage; defaults to "Zoom: {percent}%". */
    zoom?: (percent: number) => string;
    /** Editable zoom percentage title; defaults to "Click to edit zoom level". */
    editZoomLevel?: string;
    /** Reset zoom button title; defaults to "Reset zoom". */
    resetZoom?: string;
    /** Zoom in button title; defaults to "Zoom in". */
    zoomIn?: string;
    /** Toolbar count formatter; defaults to "{count} events". */
    itemCount?: (count: number) => string;
    /** Loading status text; defaults to "Loading…". The existing loadingLabel prop takes precedence. */
    loading?: string;
}
