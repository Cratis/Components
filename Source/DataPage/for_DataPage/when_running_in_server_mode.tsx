// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryFor, QueryInstanceCache, QueryResult } from '@cratis/arc/queries';
import { QueryInstanceCacheContext } from '@cratis/arc.react/queries';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { Column } from '../../DataTables/Column';
import { DataPage } from '../DataPage';

interface Row { id: string; name: string }
interface Arguments { search?: string }

const requests: { args?: Arguments; sortBy: string; page: number }[] = [];

class RowsQuery extends QueryFor<Row[], Arguments> {
    readonly route = '/api/sample/page-rows';
    readonly defaultValue: Row[] = [];
    readonly parameterDescriptors = [];
    get requiredRequestParameters() { return []; }
    constructor() { super(Object, true); }
    override perform(args?: Arguments): Promise<QueryResult<Row[]>> {
        requests.push({ args, sortBy: this.sorting.field, page: this.paging.page });
        return Promise.resolve(new QueryResult<Row[]>({
            data: [{ id: 'b', name: 'Example row B' }, { id: 'a', name: 'Example row A' }],
            isSuccess: true, isReady: true, isAuthorized: true, isValid: true, hasExceptions: false,
            validationResults: [], exceptionMessages: [], exceptionStackTrace: '',
            paging: { page: 0, size: 20, totalItems: 2, totalPages: 1 },
        }, Object, true));
    }
}

let container: HTMLDivElement;
let root: Root;
let cache: QueryInstanceCache;

beforeEach(() => {
    requests.length = 0;
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('ResizeObserver', class {
        observe() { /* No layout in jsdom. */ }
        disconnect() { /* No layout in jsdom. */ }
        unobserve() { /* No layout in jsdom. */ }
    });
    cache = new QueryInstanceCache();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
});

afterEach(async () => {
    await act(async () => root.unmount());
    cache.dispose();
    container.remove();
    vi.unstubAllGlobals();
});

describe('when a DataPage runs its query in server mode', () => {
    let rows: string[];

    beforeEach(async () => {
        await act(async () => {
            root.render(
                <QueryInstanceCacheContext.Provider value={cache}>
                    <DataPage<RowsQuery, Row, Arguments> title='Rows' query={RowsQuery} emptyMessage='No rows'
                        serverQuery={{ toArguments: () => ({}), sortFields: { name: 'displayName' } }}>
                        <DataPage.Columns><Column<Row> field='name' header='Name' sortable /></DataPage.Columns>
                    </DataPage>
                </QueryInstanceCacheContext.Provider>,
            );
        });
        await act(async () => container.querySelector<HTMLButtonElement>('[data-cratis-part="sort"]')!.click());
        rows = Array.from(container.querySelectorAll('[data-cratis-part="row"]')).map(row => row.textContent?.trim() ?? '');
    });

    it('should send the sort to the server through its table', () => {
        requests[requests.length - 1].sortBy.should.equal('displayName');
    });

    it('should render the rows in the order the server returned them', () => {
        rows.should.deep.equal(['Example row B', 'Example row A']);
    });
});
