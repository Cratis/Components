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

const typeInto = (input: HTMLInputElement, text: string) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
};


class RowsQuery extends QueryFor<Row[], Arguments> {
    readonly route = '/api/sample/page-rows';
    readonly defaultValue: Row[] = [];
    readonly parameterDescriptors = [];
    get requiredRequestParameters() { return []; }
    constructor() { super(Object, true); }
    override perform(_args?: Arguments): Promise<QueryResult<Row[]>> {
        return Promise.resolve(new QueryResult<Row[]>({
            data: [{ id: 'a', name: 'Example row A' }],
            isSuccess: true, isReady: true, isAuthorized: true, isValid: true, hasExceptions: false,
            validationResults: [], exceptionMessages: [], exceptionStackTrace: '',
            paging: { page: 0, size: 20, totalItems: 1, totalPages: 1 },
        }, Object, true));
    }
}

let container: HTMLDivElement;
let root: Root;
let cache: QueryInstanceCache;

beforeEach(() => {
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

describe('when searching a DataPage over the loaded page', () => {
    const changes: string[] = [];
    let emptyText: string | undefined;

    beforeEach(async () => {
        await act(async () => {
            root.render(
                <QueryInstanceCacheContext.Provider value={cache}>
                    <DataPage<RowsQuery, Row, Arguments> title='Rows' query={RowsQuery} emptyMessage='No rows'
                        globalFilterFields={['name']} onGlobalFilterChange={text => changes.push(text)}>
                        <DataPage.Columns><Column<Row> field='name' header='Name' /></DataPage.Columns>
                    </DataPage>
                </QueryInstanceCacheContext.Provider>,
            );
        });
        await act(async () => typeInto(container.querySelector<HTMLInputElement>('[data-cratis-part="search-input"]')!, 'missing'));
        emptyText = container.querySelector('[data-cratis-part="empty-cell"]')?.textContent ?? undefined;
    });

    it('should report the search text', () => {
        changes.should.deep.equal(['missing']);
    });

    it('should show the filtered empty message', () => {
        (emptyText ?? '').should.equal('No rows on this page match the search.');
    });
});
