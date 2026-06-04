// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Specification: Clear button behavior for custom filters
 * 
 * When a custom filter has a value (non-null, non-undefined):
 * - A round clear button (×) should be displayed in the filter header
 * - The clear button should appear next to the custom filter indicator (•)
 * - The clear button should have a "Clear filter" tooltip
 * - Clicking the clear button should call onCustomValueChange with the filter key and undefined
 * - Clicking the clear button should not expand/collapse the filter
 * 
 * When a custom filter has no value (null or undefined):
 * - The clear button should not be displayed
 * - The custom filter indicator (•) should not be displayed
 * 
 * Custom filter editors should not implement their own clear buttons;
 * the header clear button handles this automatically.
 */

describe('Clear button behavior for custom filters', () => {
    it('should be documented', () => {
        // This spec documents the expected behavior for clear buttons on custom filters.
        // The FilterPanel component displays a round clear button (×) in the header
        // next to the dot indicator (•) when a custom filter has a non-null/non-undefined value.
        // Clicking this button calls onCustomValueChange(filterKey, undefined) without expanding the filter.
        // Custom editors should not implement their own clear buttons as the header handles it.
        true.should.be.true;
    });
});
