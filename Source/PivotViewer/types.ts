// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import type { FilterEditorProps } from '../Filter/types';

/** Primitive value types that a pivot property can hold. */
export type PivotPrimitive = string | number | boolean | Date | null | undefined;

/** Value reachable through a searchable PivotViewer property path. */
export type PivotPropertyValue = PivotPrimitive | object;

/**
 * Type-safe property accessor for accessing properties, including nested ones
 */
export type PropertyAccessor<TItem> = (item: TItem) => PivotPropertyValue;

/**
 * Extract property path from a property accessor function
 * Supports nested properties like item => item.address.city
 */
export function getPropertyPath<TItem>(accessor: PropertyAccessor<TItem>): string {
    const fnStr = accessor.toString();
    // Match patterns like: item => item.prop or item => item.prop.nested or (item) => item.prop
    const match = fnStr.match(
        /(?:=>|return)\s*[a-zA-Z_$][a-zA-Z0-9_$]*\.([a-zA-Z_$][a-zA-Z0-9_$.]*)/,
    );
    return match ? match[1] : '';
}

/**
 * Get the value from an item using a property path string
 * Supports nested properties like "address.city"
 */
export function getValueByPath<TItem>(item: TItem, path: string): PivotPropertyValue {
    const parts = path.split('.');
    let value: PivotPropertyValue = item as PivotPropertyValue;
    for (const part of parts) {
        if (value === null || value === undefined || typeof value !== 'object') {
            return undefined;
        }
        // SAFETY: Property paths are consumer-provided runtime keys over the current object.
        value = (value as Record<string, PivotPropertyValue>)[part];
    }
    return value;
}

/** One group of items sharing a common dimension value. */
export interface PivotGroup<TItem extends object> {
    /** Unique identifier for this group. */
    key: string;
    /** Display label for this group. */
    label: string;
    /** The actual dimension value this group represents. */
    value: PivotPrimitive;
    /** Array of items belonging to this group. */
    items: TItem[];
    /** Optional item count (may be computed from items.length). */
    count?: number;
}

/** Defines how items are grouped, labeled, and sorted along one facet. */
export interface PivotDimension<TItem extends object> {
    /** Unique identifier for this dimension. */
    key: string;
    /** Display label for this dimension. */
    label: string;
    /** Extracts the dimension value from an item. */
    getValue: (item: TItem) => PivotPrimitive;
    /** Optional formatter for displaying dimension values. */
    formatValue?: (value: PivotPrimitive) => string;
    /** Optional custom sort comparator for groups within this dimension. */
    sort?: (a: PivotGroup<TItem>, b: PivotGroup<TItem>) => number;
}

/** One selectable value within a PivotFilter. */
export interface PivotFilterOption {
    /** Unique identifier for this option. */
    key: string;
    /** Display label for this option. */
    label: string;
    /** The actual value this option represents. */
    value: PivotPrimitive;
    /** Number of items with this value. */
    count: number;
}

/** A facet filter offered in the filter panel. */
export interface PivotFilter<TItem extends object> {
    /** Unique identifier for this filter. */
    key: string;
    /** Display label for this filter. */
    label: string;
    /** Extracts the filter value from an item. */
    getValue: (item: TItem) => PivotPrimitive;
    /** Whether multiple options can be selected simultaneously. */
    multi?: boolean;
    /** Available filter options; auto-computed from data if omitted. */
    options?: PivotFilterOption[];
    /** Optional custom sort comparator for filter options. */
    sort?: (a: PivotFilterOption, b: PivotFilterOption) => number;
    /** For numeric filters, enables range picker with histogram */
    type?: 'string' | 'number' | 'date' | 'custom';
    /** Number of buckets for the histogram in range filters */
    buckets?: number;
    /** Custom filter editor renderer. When provided, replaces the default filter UI for this filter. */
    renderEditor?: (props: FilterEditorProps) => ReactNode;
}

/** Semantic color overrides for DOM and Pixi PivotViewer surfaces. */
export interface PivotViewerColors {
    /** Color used for primary/brand elements. */
    primaryColor: string;
    /** Color used for text on primary-colored backgrounds. */
    primaryColorText: string;
    /** Color used for medium primary shade (500-level). */
    primary500: string;
    /** Color used for the base/ground surface. */
    surfaceGround: string;
    /** Color used for card/content surfaces. */
    surfaceCard: string;
    /** Color used for section surfaces. */
    surfaceSection: string;
    /** Color used for overlay/modal surfaces. */
    surfaceOverlay: string;
    /** Color used for surface borders. */
    surfaceBorder: string;
    /** Color used for primary text. */
    textColor: string;
    /** Color used for secondary/muted text. */
    textColorSecondary: string;
    /** Color used for highlight/selection backgrounds. */
    highlightBg: string;
    /** Color used for mask/backdrop backgrounds. */
    maskbg: string;
    /** Color used for focus ring/outline. */
    focusRing: string;
}

/** Props for the PivotViewer component. */
export interface PivotViewerProps<TItem extends object> {
    /** Array of items to display in the viewer. */
    data: TItem[];
    /** Available grouping dimensions for organizing items. */
    dimensions: PivotDimension<TItem>[];
    /** Optional facet filters for the filter panel. */
    filters?: PivotFilter<TItem>[];
    /** Initial dimension key to group by; defaults to the first dimension if omitted. */
    defaultDimensionKey?: string;
    /** Renderer for card content; returns structured text data for display */
    cardRenderer: (item: TItem) => {
        title: string;
        labels?: string[];
        values?: string[];
    };
    /** Optional renderer for the detail content area; the drawer shell (header/close/layout) stays component-owned */
    detailRenderer?: (item: TItem, onClose: () => void) => ReactNode;
    /** Optional stable ID extractor for items; used for efficient rendering and selection tracking. */
    getItemId?: (item: TItem, index: number) => string | number;
    /** Property accessors defining which fields are searchable. */
    searchFields?: PropertyAccessor<TItem>[];
    /** Optional CSS class name to apply to the root element. */
    className?: string;
    /** Content to display when no items match the current filters/search. */
    emptyContent?: ReactNode;
    /** Loading state; displays a loading indicator when true. */
    isLoading?: boolean;
    /**
     * Optional color overrides mapped to semantic CSS variables.
     * If omitted, values are taken from the global theme (Cratis defaults).
     */
    colors?: Partial<PivotViewerColors>;
}

export type FilterState = Record<string, Set<string>>;

export type RangeFilterState = Record<string, [number, number] | null>;
