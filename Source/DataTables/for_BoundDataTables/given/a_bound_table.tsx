// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act, Profiler } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ObservableQueryFor, QueryFor, QueryInstanceCache, QueryResult, type ObservableQuerySubscription } from '@cratis/arc/queries';
import { QueryInstanceCacheContext } from '@cratis/arc.react/queries';
import { Column } from '../../Column';
import { DataTableForObservableQuery } from '../../DataTableForObservableQuery';
import { DataTableForQuery } from '../../DataTableForQuery';

export interface Row { id: string; name: string }
export interface Arguments { scope: string; filter?: string }
export type Variant = 'snapshot' | 'observable';
export type Status = 'loaded' | 'unauthorized' | 'failed';
const deliveries = new Map<string, (result: QueryResult<Row[]>) => void>();
const key = (args?: Arguments) => JSON.stringify(args);

class SnapshotQuery extends QueryFor<Row[], Arguments> {
    readonly route = '/api/sample/table-rows';
    readonly defaultValue: Row[] = [];
    readonly parameterDescriptors = [];
    get requiredRequestParameters() { return ['scope']; }
    constructor() { super(Object, true); }
    override perform(args?: Arguments): Promise<QueryResult<Row[]>> {
        return new Promise(resolve => { deliveries.set(key(args), resolve); });
    }
}

class LiveQuery extends ObservableQueryFor<Row[], Arguments> {
    readonly route = '/api/sample/live-table-rows';
    readonly defaultValue: Row[] = [];
    readonly parameterDescriptors = [];
    get requiredRequestParameters() { return ['scope']; }
    constructor() { super(Object, true); }
    override subscribe(callback: (result: QueryResult<Row[]>) => void, args?: Arguments): ObservableQuerySubscription<Row[]> {
        deliveries.set(key(args), callback);
        // Keep the callback available to simulate a response racing with unsubscription.
        return { unsubscribe: () => undefined } as unknown as ObservableQuerySubscription<Row[]>;
    }
}

export const resultFor = (name: string, status: Status = 'loaded') => new QueryResult<Row[]>({
    data: [{ id: name, name }], isSuccess: status === 'loaded', isReady: true,
    isAuthorized: status !== 'unauthorized', isValid: true, hasExceptions: status === 'failed',
    validationResults: [], exceptionMessages: [], exceptionStackTrace: '',
    paging: { page: 0, size: 20, totalItems: 1, totalPages: 1 },
}, Object, true);

export class a_bound_table {
    readonly cache = new QueryInstanceCache();
    readonly container = document.createElement('div');
    readonly root: Root;
    readonly commits: string[] = [];

    constructor(readonly variant: Variant) {
        deliveries.clear();
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        document.body.append(this.container);
        this.root = createRoot(this.container);
    }

    async render(args: Arguments) {
        await act(async () => {
            this.root.render(
                <QueryInstanceCacheContext.Provider value={this.cache}>
                    <Profiler id='bound-table' onRender={() => { this.commits.push(this.container.textContent ?? ''); }}>
                        {this.variant === 'snapshot' ? (
                            <DataTableForQuery<SnapshotQuery, Row, Arguments> query={SnapshotQuery} queryArguments={args}
                                emptyMessage='No rows' loadingMessage='Loading rows' failureMessage='Rows failed' unauthorizedMessage='Rows denied'>
                                <Column<Row> field='name' header='Name' />
                            </DataTableForQuery>
                        ) : (
                            <DataTableForObservableQuery<LiveQuery, Row, Arguments> query={LiveQuery} queryArguments={args}
                                emptyMessage='No rows' loadingMessage='Loading rows' failureMessage='Rows failed' unauthorizedMessage='Rows denied'>
                                <Column<Row> field='name' header='Name' />
                            </DataTableForObservableQuery>
                        )}
                    </Profiler>
                </QueryInstanceCacheContext.Provider>,
            );
        });
    }

    async deliver(args: Arguments, result: QueryResult<Row[]>) {
        const delivery = deliveries.get(key(args));
        if (!delivery) throw new Error(`No query request for ${key(args)}`);
        await act(async () => { delivery(result); });
    }

    get text() { return this.container.textContent ?? ''; }
    get loading() { return this.container.querySelector('[role="status"]')?.textContent ?? ''; }

    async dispose() {
        await act(async () => { this.root.unmount(); });
        this.cache.dispose();
        this.container.remove();
    }
}
