// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { ObservableQueryFor, type QueryResult, type ObservableQuerySubscription } from '@cratis/arc/queries';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { Column } from '../Column';
import { DataTableForObservableQuery } from '../DataTableForObservableQuery';

interface Row { id: number; name: string }
class SampleQuery extends ObservableQueryFor<Row, object> {
    readonly route = '/api/sample';
    readonly defaultValue: Row = [] as unknown as Row;
    readonly parameterDescriptors = [];
    get requiredRequestParameters() { return []; }
    constructor() { super(Object, false); }
    override subscribe(_callback: (result: QueryResult<Row>) => void): ObservableQuerySubscription<Row> {
        return { unsubscribe: () => undefined } as unknown as ObservableQuerySubscription<Row>;
    }
}

const queryState = vi.hoisted(() => ({
    data: [] as { id: number; name: string }[],
    isAuthorized: true,
    hasExceptions: false,
    isValid: true,
    isPerforming: false,
}));

vi.mock('@cratis/arc.react/queries', () => ({
    useObservableQueryWithPaging: () => [
        {
            ...queryState,
            paging: { page: 0, size: 20, totalItems: 0, totalPages: 0 },
            exceptionMessages: ['Sensitive server exception'],
        },
        () => undefined, () => undefined, () => undefined,
    ],
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    queryState.data = [];
    queryState.isAuthorized = true;
    queryState.hasExceptions = false;
    queryState.isValid = true;
    queryState.isPerforming = false;
    globalThis.ResizeObserver = class {
        observe() { /* no layout in jsdom */ }
        disconnect() { /* no layout in jsdom */ }
        unobserve() { /* no layout in jsdom */ }
    };
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

const renderTable = async () => {
    await act(async () => {
        root.render(
            <DataTableForObservableQuery<SampleQuery, Row, object> query={SampleQuery}
                emptyMessage='No rows' loadingMessage='Fetching rows'
                failureMessage='Rows unavailable' unauthorizedMessage='Rows denied'>
                <Column<Row> field='name' header='Name' />
            </DataTableForObservableQuery>,
        );
    });
};

describe('when an observable query fails', () => {
    beforeEach(async () => {
        queryState.hasExceptions = true;
        queryState.isPerforming = true;
        await renderTable();
    });
    it('should show the failure rather than the server exception or loading', () => {
        expect(container.querySelector('[data-reason="failed"] [role="alert"]')?.textContent).to.equal('Rows unavailable');
        expect(container.textContent).not.to.contain('Sensitive server exception');
    });
});

describe('when an observable query is invalid', () => {
    beforeEach(async () => {
        queryState.isValid = false;
        await renderTable();
    });
    it('should show the failure', () => {
        expect(container.querySelector('[data-reason="failed"] [role="alert"]')?.textContent).to.equal('Rows unavailable');
    });
});

describe('when an observable query is unauthorized', () => {
    beforeEach(async () => {
        queryState.isAuthorized = false;
        queryState.hasExceptions = true;
        await renderTable();
    });
    it('should prioritize authorization over failure', () => {
        expect(container.querySelector('[data-reason="unauthorized"] [role="alert"]')?.textContent).to.equal('Rows denied');
    });
});

describe('when an observable query is pending', () => {
    beforeEach(async () => {
        queryState.isPerforming = true;
        await renderTable();
    });
    it('should show loading instead of empty', () => {
        expect(container.querySelector('[role="status"]')?.textContent).to.equal('Fetching rows');
        expect(container.textContent).not.to.contain('No rows');
    });
});

describe('when an observable query refetches with rows', () => {
    beforeEach(async () => {
        queryState.isPerforming = true;
        queryState.data = [{ id: 1, name: 'Sample row' }];
        await renderTable();
    });
    it('should retain the rows and mark the table busy', () => {
        expect(container.querySelector('[data-cratis-part="row"]')?.textContent).to.equal('Sample row');
        expect(container.querySelector('table')?.getAttribute('aria-busy')).to.equal('true');
    });
});
