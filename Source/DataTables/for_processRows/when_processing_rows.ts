// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { DataTableFilterMatchMode } from '../DataTableFilterMeta';
import { DataTableRowProcessing } from '../DataTableRowProcessing';
import { DataTableSortDirection } from '../DataTableSortDirection';
import { processRows } from '../processRows';
import type { RowProcessingState } from '../RowProcessingState';

const rows = [
    { name: 'Charlie', score: 10, team: { name: 'Blue' } },
    { name: 'Alpha', score: 9, team: { name: 'Red' } },
    { name: 'Bravo', score: 100, team: { name: 'Blue' } },
];
const state = (overrides: Partial<RowProcessingState>): RowProcessingState => ({
    filters: {},
    globalFilter: '',
    sort: null,
    rowProcessing: DataTableRowProcessing.Loaded,
    ...overrides,
});
const names = (processed: ReturnType<typeof processRows<(typeof rows)[number]>>) => processed.map(({ row }) => row.name);

describe('when processing rows with no state', () => {
    it('should keep the loaded order and indexes', () => {
        processRows(rows, state({})).map(({ loadedIndex }) => loadedIndex).should.deep.equal([0, 1, 2]);
    });
});

describe('when processing rows with a column filter and search text', () => {
    const processed = processRows(rows, state({
        filters: { 'team.name': { value: 'Blue', matchMode: DataTableFilterMatchMode.Equals } },
        globalFilter: ' BRA ',
        globalFilterFields: ['name'],
    }));
    it('should keep only rows matching both', () => {
        names(processed).should.deep.equal(['Bravo']);
    });
    it('should keep the row\'s loaded index', () => {
        processed[0].loadedIndex.should.equal(2);
    });
});

describe('when processing rows with search text but no search fields', () => {
    it('should ignore the search text', () => {
        names(processRows(rows, state({ globalFilter: 'zzz' }))).should.deep.equal(['Charlie', 'Alpha', 'Bravo']);
    });
});

describe('when processing rows sorted by a number', () => {
    it('should sort numerically rather than as text', () => {
        names(processRows(rows, state({ sort: { field: 'score', direction: DataTableSortDirection.Ascending } })))
            .should.deep.equal(['Alpha', 'Charlie', 'Bravo']);
    });
});

describe('when processing rows sorted descending by a nested field', () => {
    it('should reverse the order and keep ties in loaded order', () => {
        names(processRows(rows, state({ sort: { field: 'team.name', direction: DataTableSortDirection.Descending } })))
            .should.deep.equal(['Alpha', 'Charlie', 'Bravo']);
    });
});

describe('when processing rows with row processing off', () => {
    it('should return the rows as given', () => {
        names(processRows(rows, state({
            rowProcessing: DataTableRowProcessing.None,
            filters: { name: { value: 'zzz' } },
            sort: { field: 'name', direction: DataTableSortDirection.Ascending },
        }))).should.deep.equal(['Charlie', 'Alpha', 'Bravo']);
    });
});
