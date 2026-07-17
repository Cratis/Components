// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { vi } from 'vitest';
import { bindQuery } from '../bindQuery';
import { ListRenderer, renderBoundTable, type Row } from './given/a_list_renderer';

// The proof: a trivial, non-DataTableCore renderer (a plain `<ul>`) bound via
// bindQuery still gets Cratis's query + paging behavior. These scenarios live in
// one file on purpose — the project runs vitest with `isolate: false`, so a
// per-file module mock of the query hook would otherwise bleed across files.

const { queryResult } = vi.hoisted(() => ({
    queryResult: { current: undefined as unknown },
}));

// Mock the Arc paging hook so the binding renders a deterministic page without a
// backend — the proof is about the seam (rows + paging reach the renderer), not
// the hook itself, which Arc tests in its own repo.
vi.mock('@cratis/arc.react/queries', () => ({
    useQueryWithPaging: () => [queryResult.current, vi.fn(), vi.fn(), vi.fn(), vi.fn()],
}));

// The paginator uses PrimeReact's Button; render it as a plain button for this
// SSR proof so the navigation landmark still emits without a PrimeReact provider.
vi.mock('primereact/button', () => ({
    Button: (props: { children?: React.ReactNode }) => React.createElement('button', null, props.children),
}));

const twoRows = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] as Row[];

describe('when binding a custom renderer and the result spans multiple pages', () => {
    let html: string;

    beforeEach(() => {
        queryResult.current = { data: twoRows, paging: { page: 0, size: 20, totalItems: 48, totalPages: 3 } };
        html = renderBoundTable(bindQuery(ListRenderer), { emptyMessage: 'No rows', dataKey: 'id' });
    });

    it('should render the paged rows through the custom renderer', () => {
        html.should.include('byo-list');
        html.should.include('Alice');
        html.should.include('Bob');
    });

    it('should attach the Cratis paginator when the result spans more than one page', () => {
        html.should.include('aria-label="Pagination"');
    });
});

describe('when binding a custom renderer and the result fits a single page', () => {
    let html: string;

    beforeEach(() => {
        queryResult.current = { data: twoRows, paging: { page: 0, size: 20, totalItems: 2, totalPages: 1 } };
        html = renderBoundTable(bindQuery(ListRenderer), { emptyMessage: 'No rows', dataKey: 'id' });
    });

    it('should render the rows through the custom renderer', () => {
        html.should.include('byo-list');
        html.should.include('Alice');
    });

    it('should not render a paginator for a single page', () => {
        html.should.not.include('aria-label="Pagination"');
    });
});

describe('when binding a custom renderer and there are no rows', () => {
    let html: string;

    beforeEach(() => {
        queryResult.current = { data: [] as Row[], paging: { page: 0, size: 20, totalItems: 0, totalPages: 0 } };
        html = renderBoundTable(bindQuery(ListRenderer), { emptyMessage: 'No rows', dataKey: 'id' });
    });

    it('should hand the empty message to the custom renderer', () => {
        html.should.include('byo-empty');
        html.should.include('No rows');
    });

    it('should not render a paginator when there are no rows', () => {
        html.should.not.include('aria-label="Pagination"');
    });
});
