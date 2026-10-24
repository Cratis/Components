// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { ObservableQueryFor } from '@cratis/arc/queries';
import { Column } from '../../DataTables/Column';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { DataPage } from '../DataPage';
import { render, selectFirstRow, unmount, type DataPageInTheDom } from './given/a_data_page';
import { PersonsQuery, type Person } from './given/a_paged_query_result';

class ObservablePersonsQuery extends ObservableQueryFor<Person, object> {
    readonly route = '/api/sample-persons';
    readonly defaultValue: Person = [] as unknown as Person;
    readonly parameterDescriptors = [];
    get requiredRequestParameters() { return []; }
    constructor() { super(Object, false); }
}

const state = vi.hoisted(() => ({
    rows: [] as { id: number; name: string; email: string }[],
    isPerforming: false,
    isSuccess: true,
}));

vi.mock('@cratis/arc.react/queries', () => {
    const result = () => ({
        data: state.rows,
        paging: { page: 0, size: 20, totalItems: state.rows.length, totalPages: 1 },
        isSuccess: state.isSuccess,
        isAuthorized: true,
        isValid: true,
        hasExceptions: false,
        isPerforming: state.isPerforming,
    });
    const noop = () => undefined;
    return {
        useQueryWithPaging: () => [result(), noop, noop, noop, noop],
        useObservableQueryWithPaging: () => [result(), noop, noop, noop],
    };
});

const Details = ({ item }: { item: Person }) => <div className='person-details'>{item.name}</div>;

describe.each([PersonsQuery, ObservablePersonsQuery])('when query rows change for %s', (query) => {
    let page: DataPageInTheDom;
    let selection: Person | null | undefined;
    let dataKey: string | undefined;
    let onSelectionChange: ReturnType<typeof vi.fn> | undefined;

    const element = () => (
        <DataPage query={query} title='Sample people' emptyMessage='No people' dataKey={dataKey}
            selection={selection} onSelectionChange={onSelectionChange} detailsComponent={Details}>
            <DataPage.Columns><Column field='name' header='Name' /></DataPage.Columns>
        </DataPage>
    );
    const refresh = async () => {
        await act(async () => page.root.render(<CratisComponentsProvider>{element()}</CratisComponentsProvider>));
    };
    const details = () => page.container.querySelector('.person-details')?.textContent;

    beforeEach(async () => {
        state.rows = [
            { id: 1, name: 'Sample Person', email: 'sample@example.invalid' },
            { id: 2, name: 'Other Person', email: 'other@example.invalid' },
        ];
        state.isPerforming = false;
        state.isSuccess = true;
        selection = undefined;
        dataKey = 'id';
        onSelectionChange = vi.fn();
        page = await render(element());
    });
    afterEach(async () => unmount(page));

    it('should clear details and notify when the selected row is removed externally', async () => {
        await selectFirstRow(page);
        state.rows = state.rows.slice(1);
        await refresh();
        expect(details()).to.equal(undefined);
        expect(onSelectionChange!.mock.lastCall?.[0].value).to.equal(null);
        expect(page.container.querySelector('[aria-selected="true"]')).to.equal(null);
    });

    it('should clear details when the result becomes empty', async () => {
        await selectFirstRow(page);
        state.rows = [];
        await refresh();
        expect(details()).to.equal(undefined);
    });

    it('should replace the selected instance with the current row having the same key', async () => {
        await selectFirstRow(page);
        const updated = { ...state.rows[0], name: 'Updated Person' };
        state.rows = [state.rows[1], updated];
        await refresh();
        expect(details()).to.equal('Updated Person');
        expect(onSelectionChange!.mock.lastCall?.[0].value).to.equal(updated);
    });

    it('should not report a change when the selected instance is unchanged', async () => {
        await selectFirstRow(page);
        onSelectionChange!.mockClear();
        state.rows = [...state.rows];
        await refresh();
        expect(onSelectionChange!.mock.calls.length).to.equal(0);
    });

    it('should notify without overriding a controlled selection or repeating on an unrelated render', async () => {
        selection = state.rows[0];
        await refresh();
        const updated = { ...selection, name: 'Updated Person' };
        state.rows = [updated];
        await refresh();
        await refresh();
        expect(details()).to.equal('Sample Person');
        expect(onSelectionChange!.mock.calls.length).to.equal(1);
        expect(onSelectionChange!.mock.lastCall?.[0].value).to.equal(updated);
        selection = updated;
        await refresh();
        expect(details()).to.equal('Updated Person');
    });

    it('should let a controlled consumer accept clearing a removed row', async () => {
        selection = state.rows[0];
        onSelectionChange = vi.fn((event: { value: Person | null }) => { selection = event.value; });
        await refresh();
        state.rows = [];
        await refresh();
        expect(onSelectionChange!.mock.lastCall?.[0].value).to.equal(null);
        await refresh();
        expect(details()).to.equal(undefined);
    });

    it('should retain a controlled value without a callback when its row disappears', async () => {
        selection = state.rows[0];
        onSelectionChange = undefined;
        await refresh();
        state.rows = [];
        await refresh();
        expect(details()).to.equal('Sample Person');
    });

    it('should retain selection while pending and reconcile once the result settles', async () => {
        await selectFirstRow(page);
        state.rows = [];
        state.isPerforming = true;
        await refresh();
        expect(details()).to.equal('Sample Person');
        state.isPerforming = false;
        await refresh();
        expect(details()).to.equal(undefined);
    });

    it('should use object identity when no data key is supplied', async () => {
        dataKey = undefined;
        await refresh();
        await selectFirstRow(page);
        state.rows = state.rows.map((row) => ({ ...row }));
        await refresh();
        expect(details()).to.equal(undefined);
        expect(onSelectionChange!.mock.lastCall?.[0].value).to.equal(null);
    });

    it('should keep an explicitly empty controlled selection empty', async () => {
        selection = null;
        await refresh();
        state.rows = state.rows.map((row) => ({ ...row }));
        await refresh();
        expect(details()).to.equal(undefined);
        expect(onSelectionChange!.mock.calls.length).to.equal(0);
    });

    it('should retain selection when a query fails', async () => {
        await selectFirstRow(page);
        state.rows = [];
        state.isSuccess = false;
        await refresh();
        expect(details()).to.equal('Sample Person');
    });
});
