// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
    ObservableQueryFor,
    QueryFor,
    QueryInstanceCache,
    QueryResult,
    SortDirection,
    type ObservableQuerySubscription,
} from '@cratis/arc/queries';
import { QueryInstanceCacheContext } from '@cratis/arc.react/queries';
import { Column } from '../../Column';
import { DataTableForObservableQuery } from '../../DataTableForObservableQuery';
import { DataTableForQuery } from '../../DataTableForQuery';
import type { DataTableServerQuery } from '../../DataTableServerQuery';

export interface Row { id: string; name: string }
export interface Arguments { scope: string; nameContains?: string; search?: string }
export type Variant = 'snapshot' | 'observable';

/** One request the table's query made: its arguments, sorting and page. */
export interface ServerRequest {
    args: Arguments;
    sortBy: string;
    sortDirection: 'asc' | 'desc' | '';
    page: number;
    deliver(result: QueryResult<Row[]>): void;
}

const requests: ServerRequest[] = [];

const record = (
    query: { sorting: { field: string; direction: SortDirection }; paging: { page: number } },
    args: Arguments | undefined,
    deliver: (result: QueryResult<Row[]>) => void,
) => {
    requests.push({
        args: args ?? ({} as Arguments),
        sortBy: query.sorting.field,
        sortDirection: query.sorting.field === ''
            ? ''
            : query.sorting.direction === SortDirection.descending ? 'desc' : 'asc',
        page: query.paging.page,
        deliver,
    });
};

class SnapshotQuery extends QueryFor<Row[], Arguments> {
    readonly route = '/api/sample/server-rows';
    readonly defaultValue: Row[] = [];
    readonly parameterDescriptors = [];
    get requiredRequestParameters() { return ['scope']; }
    constructor() { super(Object, true); }
    override perform(args?: Arguments): Promise<QueryResult<Row[]>> {
        return new Promise(resolve => { record(this, args, resolve); });
    }
}

class LiveQuery extends ObservableQueryFor<Row[], Arguments> {
    readonly route = '/api/sample/live-server-rows';
    readonly defaultValue: Row[] = [];
    readonly parameterDescriptors = [];
    get requiredRequestParameters() { return ['scope']; }
    constructor() { super(Object, true); }
    override subscribe(callback: (result: QueryResult<Row[]>) => void, args?: Arguments): ObservableQuerySubscription<Row[]> {
        record(this, args, callback);
        return { unsubscribe: () => undefined } as unknown as ObservableQuerySubscription<Row[]>;
    }
}

/**
 * A successful server page.
 * @param names - The row names, in the order the server returned them.
 * @param totalItems - The total the server reports for the complete, filtered result.
 * @param page - The page the server returned.
 * @returns The result.
 */
export const pageOf = (names: string[], totalItems: number, page = 0) => new QueryResult<Row[]>({
    data: names.map(name => ({ id: name, name })), isSuccess: true, isReady: true,
    isAuthorized: true, isValid: true, hasExceptions: false,
    validationResults: [], exceptionMessages: [], exceptionStackTrace: '',
    paging: { page, size: 20, totalItems, totalPages: Math.ceil(totalItems / 20) },
}, Object, true);

/** A settled result Arc reports as unsuccessful without any other failure flag. */
export const unsuccessful = () => new QueryResult<Row[]>({
    data: [], isSuccess: false, isReady: true,
    isAuthorized: true, isValid: true, hasExceptions: false,
    validationResults: [], exceptionMessages: [], exceptionStackTrace: '',
    paging: { page: 0, size: 0, totalItems: 0, totalPages: 0 },
}, Object, true);

const typeInto = (input: HTMLInputElement, text: string) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
};

/** A bound table over real Arc hooks whose query requests are recorded and answered by the spec. */
export class a_server_mode_table {
    readonly cache = new QueryInstanceCache();
    readonly container = document.createElement('div');
    readonly root: Root;

    constructor(readonly variant: Variant) {
        requests.length = 0;
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        document.body.append(this.container);
        this.root = createRoot(this.container);
    }

    get requests(): readonly ServerRequest[] { return requests; }
    get lastRequest(): ServerRequest { return requests[requests.length - 1]; }

    async render(serverQuery: DataTableServerQuery<Arguments> | undefined) {
        const args: Arguments = { scope: 'Example scope' };
        await act(async () => {
            this.root.render(
                <QueryInstanceCacheContext.Provider value={this.cache}>
                    {this.variant === 'snapshot' ? (
                        <DataTableForQuery<SnapshotQuery, Row, Arguments> query={SnapshotQuery} queryArguments={args}
                            serverQuery={serverQuery} globalFilterFields={['name']}
                            emptyMessage='No rows' loadingMessage='Loading rows' failureMessage='Rows failed'>
                            <Column<Row> field='name' header='Name' sortable filter />
                        </DataTableForQuery>
                    ) : (
                        <DataTableForObservableQuery<LiveQuery, Row, Arguments> query={LiveQuery} queryArguments={args}
                            serverQuery={serverQuery} globalFilterFields={['name']}
                            emptyMessage='No rows' loadingMessage='Loading rows' failureMessage='Rows failed'>
                            <Column<Row> field='name' header='Name' sortable filter />
                        </DataTableForObservableQuery>
                    )}
                </QueryInstanceCacheContext.Provider>,
            );
        });
    }

    async deliver(result: QueryResult<Row[]>) {
        await act(async () => { this.lastRequest.deliver(result); });
    }

    async nextPage() {
        await act(async () => { this.container.querySelector<HTMLButtonElement>('button[aria-label="Next page"]')!.click(); });
    }

    async sort() {
        await act(async () => { this.container.querySelector<HTMLButtonElement>('[data-cratis-part="sort"]')!.click(); });
    }

    async filterBy(text: string) {
        await act(async () => { this.container.querySelector<HTMLButtonElement>('[data-cratis-part="filter-trigger"]')!.click(); });
        await act(async () => typeInto(document.querySelector<HTMLInputElement>('[data-cratis-part="filter-menu"] input')!, text));
        const apply = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-cratis-part="filter-actions"] button'))
            .find(button => button.textContent?.trim() === 'Apply')!;
        await act(async () => apply.click());
    }

    async search(text: string) {
        await act(async () => typeInto(this.container.querySelector<HTMLInputElement>('[data-cratis-part="search-input"]')!, text));
    }

    get rows(): string[] {
        return Array.from(this.container.querySelectorAll('[data-cratis-part="row"]')).map(row => row.textContent?.trim() ?? '');
    }

    get text() { return this.container.textContent ?? ''; }
    get failure() { return this.container.querySelector('[data-reason="failed"] [role="alert"]')?.textContent ?? ''; }
    get paginatorRange() { return this.container.querySelector('[data-cratis-part="range"]')?.textContent ?? ''; }

    async dispose() {
        await act(async () => { this.root.unmount(); });
        this.cache.dispose();
        this.container.remove();
    }
}
