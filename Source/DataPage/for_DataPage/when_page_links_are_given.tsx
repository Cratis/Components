// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import {
    ObservableQueryFor,
    type IObservableQueryFor,
    type IQueryFor,
    type ObservableQuerySubscription,
    type QueryResult,
} from '@cratis/arc/queries';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { Column } from '../../DataTables/Column';
import { DataPage } from '../DataPage';
import { render, unmount, type DataPageInTheDom } from './given/a_data_page';
import { PersonsQuery, queryResult, type Person } from './given/a_paged_query_result';

vi.mock('@cratis/arc.react/queries', async () => {
    const { arcQueryHooks } = await import('./given/a_paged_query_result');
    return arcQueryHooks();
});

class DemoObservableQuery extends ObservableQueryFor<Person, object> {
    readonly route = '/api/demo/rows';
    readonly defaultValue: Person = {
        id: 0,
        name: 'Demo row',
        email: 'demo@example.invalid',
    };
    readonly parameterDescriptors = [];
    get requiredRequestParameters() {
        return [];
    }
    constructor() {
        super(Object, true);
    }
    override subscribe(
        _callback: (result: QueryResult<Person>) => void,
    ): ObservableQuerySubscription<Person> {
        throw new Error('The paging hook must be replaced in this specification.');
    }
}

type DemoQuery = IQueryFor<Person, object> | IObservableQueryFor<Person, object>;

for (const query of [PersonsQuery, DemoObservableQuery]) {
    describe(`when page links are given with ${query.name}`, () => {
        let page: DataPageInTheDom;

        beforeEach(async () => {
            queryResult.totalItems = 240;
            queryResult.totalPages = 12;
            queryResult.page = 5;
            page = await render(
                <DataPage<DemoQuery, Person, object>
                    title='Demo rows'
                    query={query}
                    emptyMessage='No demo rows'
                    pageLinks={{ siblings: 0, boundaries: 1 }}
                    paginatorAriaLabels={{ page: (number) => `Demo page ${number}` }}
                >
                    <DataPage.Columns>
                        <Column field='name' header='Name' />
                    </DataPage.Columns>
                </DataPage>,
            );
        });
        afterEach(async () => {
            await unmount(page);
        });

        it('should forward the page link options and labels to the paginator', () => {
            Array.from(page.container.querySelectorAll('[data-cratis-part="page"]'))
                .map((button) => button.getAttribute('aria-label'))
                .should.deep.equal(['Demo page 1', 'Demo page 6', 'Demo page 12']);
        });
        it('should omit the page count report', () => {
            page.container
                .querySelectorAll('[data-cratis-part="info"]')
                .length.should.equal(0);
        });
        it('should request the zero-based page through the query paging hook', async () => {
            const button = page.container.querySelector<HTMLButtonElement>(
                '[aria-label="Demo page 12"]',
            )!;
            await act(async () => button.click());
            queryResult.page.should.equal(11);
        });
    });
}
