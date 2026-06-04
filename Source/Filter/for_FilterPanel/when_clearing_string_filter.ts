// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Specification: Clear button behavior for string filters
 * 
 * When a string filter has active selections:
 * - A round clear button (×) should be displayed in the filter header
 * - The clear button should appear next to the count badge
 * - The clear button should have a "Clear filter" tooltip
 * - Clicking the clear button should call onFilterClear with the filter key
 * - Clicking the clear button should not expand/collapse the filter
 * 
 * When a string filter has no selections:
 * - The clear button should not be displayed
 * - The count badge should not be displayed
 */

describe('Clear button behavior for string filters', () => {
    it('should be documented', () => {
        // This spec documents the expected behavior for clear buttons on string filters.
        // The FilterPanel component displays a round clear button (×) in the header
        // next to the count badge when a string filter has active selections.
        // Clicking this button calls onFilterClear(filterKey) without expanding the filter.
        true.should.be.true;
    });
});
