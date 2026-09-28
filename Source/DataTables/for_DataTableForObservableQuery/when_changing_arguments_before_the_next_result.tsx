// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ObservableQueryFor, QueryInstanceCache, QueryResult, type ObservableQuerySubscription } from '@cratis/arc/queries';
import { QueryInstanceCacheContext } from '@cratis/arc.react/queries';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Column } from '../Column';
import { DataTableForObservableQuery } from '../DataTableForObservableQuery';

interface Row { id: number; name: string }
const deliverResult = new Map<string, (result: QueryResult<Row[]>) => void>();
const requestedPages: number[] = [];
let subscribedQuery: ScopedQuery | undefined;
const recordSubscription = (query: ScopedQuery) => { subscribedQuery = query; };
class ScopedQuery extends ObservableQueryFor<Row[], { scope: string }> {
    readonly route = '/api/sample/observable-scoped-rows';
    readonly defaultValue: Row[] = [];
    readonly parameterDescriptors = [];
    get requiredRequestParameters() { return []; }
    constructor() { super(Object, true); }
    override subscribe(callback: (result: QueryResult<Row[]>) => void, args?: { scope: string }): ObservableQuerySubscription<Row[]> {
        requestedPages.push(this.paging.page);
        recordSubscription(this);
        deliverResult.set(args!.scope, callback);
        return { unsubscribe: () => { deliverResult.delete(args!.scope); } } as unknown as ObservableQuerySubscription<Row[]>;
    }
}
const resultWith = (data: Row[], page = 0) => new QueryResult<Row[]>({
    data, isSuccess: true, isReady: true, isAuthorized: true, isValid: true,
    hasExceptions: false, validationResults: [], exceptionMessages: [], exceptionStackTrace: '',
    paging: { page, size: 20, totalItems: 40, totalPages: 2 },
}, Object, true);
const failed = new QueryResult<Row[]>({
    data: [{ id: 1, name: 'Example stale row' }], isSuccess: false, isReady: true,
    isAuthorized: true, isValid: true, hasExceptions: true, validationResults: [],
    exceptionMessages: [], exceptionStackTrace: '',
    paging: { page: 0, size: 20, totalItems: 40, totalPages: 2 },
}, Object, true);
let root: Root;
let container: HTMLDivElement;
let queryCache: QueryInstanceCache;
const tableFor = (scope: string) => (
    <CratisComponentsProvider>
        <QueryInstanceCacheContext.Provider value={queryCache}>
            <DataTableForObservableQuery<ScopedQuery, Row, { scope: string }>
                query={ScopedQuery} queryArguments={{ scope }} emptyMessage='No example rows'
                loadingMessage='Loading example rows' failureMessage='Example rows failed'
                unauthorizedMessage='Example rows denied' globalFilterFields={['name']}>
                <Column<Row> field='name' header='Name' sortable />
            </DataTableForObservableQuery>
        </QueryInstanceCacheContext.Provider>
    </CratisComponentsProvider>
);
const show = async (scope: string) => { await act(async () => { root.render(tableFor(scope)); }); };
const deliver = async (scope: string, result: QueryResult<Row[]>) => {
    await act(async () => { deliverResult.get(scope)!(result); });
};
const rowText = () => container.querySelector('[data-cratis-part="row"]')?.textContent ?? null;
const loadingText = () => container.querySelector('[role="status"]')?.textContent ?? null;

beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    deliverResult.clear(); requestedPages.length = 0; subscribedQuery = undefined; queryCache = new QueryInstanceCache();
    globalThis.ResizeObserver = class {
        observe() { /* jsdom has no layout */ }
        disconnect() { /* jsdom has no layout */ }
        unobserve() { /* jsdom has no layout */ }
    };
    container = document.createElement('div'); document.body.append(container);
    root = createRoot(container);
});
afterEach(async () => {
    await act(async () => { root.unmount(); });
    queryCache.dispose(); container.remove();
});

describe.each([
    ['unauthorized', QueryResult.unauthorized<Row[]>(), 'Example rows denied'],
    ['failed', failed, 'Example rows failed'],
])('when observable arguments change after a %s result', (_state, previous, alert) => {
    it('should show loading without the previous status or rows until the new result arrives', async () => {
        await show('A');
        await deliver('A', previous);
        (container.querySelector('[role="alert"]')?.textContent === alert).should.equal(true);
        await show('B');
        (loadingText() === 'Loading example rows').should.equal(true);
        (container.querySelector('[role="alert"]') === null).should.equal(true);
        (rowText() === null).should.equal(true);
        await deliver('B', resultWith([{ id: 2, name: 'Example B' }]));
        rowText()?.should.contain('Example B');
    });
});

describe('when changing observable arguments from page two', () => {
    it('should subscribe to and display the first page of the new arguments', async () => {
        await show('A');
        await deliver('A', resultWith([{ id: 1, name: 'Example A page one' }]));
        await act(async () => { container.querySelector<HTMLButtonElement>('[aria-label="Next page"]')!.click(); });
        subscribedQuery?.paging.page.should.equal(1);
        await deliver('A', resultWith([{ id: 21, name: 'Example A page two' }], 1));
        container.querySelector('.cratis-table-paginator-info')?.textContent.should.equal('2 / 2');

        await show('B');
        requestedPages.at(-1)?.should.equal(0);
        (rowText() === null).should.equal(true);
        await deliver('B', resultWith([{ id: 2, name: 'Example B page one' }]));
        rowText()?.should.contain('Example B page one');
        container.querySelector('.cratis-table-paginator-info')?.textContent.should.equal('1 / 2');
    });
});

describe('when returning to cached observable arguments after page two', () => {
    it('should never display the cached second page while awaiting page one from the retained subscription', async () => {
        await show('A');
        await deliver('A', resultWith([{ id: 1, name: 'Example A page one' }]));
        await act(async () => { container.querySelector<HTMLButtonElement>('[aria-label="Next page"]')!.click(); });
        requestedPages.should.deep.equal([0]);
        // Arc's retained page-0 callback may receive a page-2 push even though page changes do not re-subscribe.
        await deliver('A', resultWith([{ id: 21, name: 'Example A page two' }], 1));
        await show('B');
        await deliver('B', resultWith([{ id: 2, name: 'Example B page one' }]));
        await show('A');
        // Arc issue: release/acquire retains A's original subscription. No new page-0
        // subscribe is issued on return, so the server may never send this result.
        requestedPages.should.deep.equal([0, 0]);
        (loadingText() === 'Loading example rows').should.equal(true);
        (rowText() === null).should.equal(true);
        await deliver('A', resultWith([{ id: 1, name: 'Example A fresh page one' }]));
        rowText()?.should.contain('Example A fresh page one');
        container.querySelector('.cratis-table-paginator-info')?.textContent.should.equal('1 / 2');
    });
});

describe('when returning to cached observable arguments', () => {
    it('should restore rows before paint and keep paging without a loading flash', async () => {
        await show('A');
        await deliver('A', resultWith([{ id: 1, name: 'Example A' }]));
        const search = container.querySelector('[data-cratis-part="search-input"]');
        await act(async () => { container.querySelector<HTMLButtonElement>('[data-cratis-part="sort"]')!.click(); });
        await show('B');
        (loadingText() === 'Loading example rows').should.equal(true);
        (rowText() === null).should.equal(true);
        (container.querySelector('[data-cratis-part="search-input"]') === search).should.equal(true);
        container.querySelector('[aria-sort="ascending"]')?.textContent.should.contain('Name');
        await deliver('B', resultWith([{ id: 2, name: 'Example B' }]));
        await show('A');
        (loadingText() === null).should.equal(true);
        rowText()?.should.contain('Example A');
        (container.querySelector('[data-cratis-part="search-input"]') === search).should.equal(true);
        await act(async () => {
            container.querySelector<HTMLButtonElement>('[aria-label="Next page"]')!.click();
        });
        (loadingText() === null).should.equal(true);
        rowText()?.should.contain('Example A');
        await deliver('A', resultWith([{ id: 21, name: 'Example A page two' }], 1));
        rowText()?.should.contain('Example A page two');
        container.querySelector('.cratis-table-paginator-info')?.textContent.should.equal('2 / 2');
    });
});
