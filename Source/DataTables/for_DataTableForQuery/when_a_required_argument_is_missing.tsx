// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { QueryFor, type QueryResult } from '@cratis/arc/queries';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { Column } from '../Column';
import { DataTableForQuery } from '../DataTableForQuery';

interface Row { id: number; name: string }
interface Arguments { category?: string }

class CategoryQuery extends QueryFor<Row[], Arguments> {
    readonly route = '/api/sample/category-rows';
    readonly defaultValue: Row[] = [];
    readonly parameterDescriptors = [];
    get requiredRequestParameters() { return ['category']; }
    constructor() { super(Object, true); }
    override perform(): Promise<QueryResult<Row[]>> {
        return new Promise(() => undefined);
    }
}

// Arc settles a snapshot query it did not send, because a required argument is missing, with the same
// unsuccessful flags as a failed response.
vi.mock('@cratis/arc.react/queries', () => ({
    useQueryWithPaging: () => [
        {
            data: [],
            paging: { page: 0, size: 20, totalItems: 0, totalPages: 0 },
            isSuccess: false,
            isAuthorized: true,
            isValid: true,
            hasExceptions: false,
            isPerforming: false,
            isReady: true,
        },
        () => Promise.resolve(), () => undefined, () => undefined, () => undefined,
    ],
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

const renderTable = async (queryArguments?: Arguments) => {
    await act(async () => {
        root.render(
            <DataTableForQuery<CategoryQuery, Row, Arguments> query={CategoryQuery} queryArguments={queryArguments}
                emptyMessage='No rows' failureMessage='Rows unavailable'>
                <Column<Row> field='name' header='Name' />
            </DataTableForQuery>,
        );
    });
};

describe('when a snapshot query is missing a required argument', () => {
    beforeEach(async () => {
        await renderTable({ category: '' });
    });
    it('should show the empty message because no request was sent', () => {
        expect(container.textContent).to.contain('No rows');
        expect(container.querySelector('[data-reason="failed"]')).to.equal(null);
    });
});

describe('when a snapshot query with every required argument is unsuccessful', () => {
    beforeEach(async () => {
        await renderTable({ category: 'Example category' });
    });
    it('should show the failure', () => {
        expect(container.querySelector('[data-reason="failed"] [role="alert"]')?.textContent).to.equal('Rows unavailable');
        expect(container.textContent).not.to.contain('No rows');
    });
});
