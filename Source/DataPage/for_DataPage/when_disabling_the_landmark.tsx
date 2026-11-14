// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { afterEach, describe, it, vi } from 'vitest';
import { DataPage } from '../DataPage';
import { render, unmount, type DataPageInTheDom } from './given/a_data_page';
import { PersonsQuery, type Person } from './given/a_paged_query_result';

vi.mock('@cratis/arc.react/queries', async () => {
    const { arcQueryHooks } = await import('./given/a_paged_query_result');
    return arcQueryHooks();
});

describe('when disabling the DataPage landmark', () => {
    let page: DataPageInTheDom;
    afterEach(async () => { await unmount(page); });

    for (const landmark of [undefined, false]) {
        it(`should ${landmark === false ? 'omit' : 'render'} the main landmark`, async () => {
            page = await render(
                <DataPage<PersonsQuery, Person, object> title='Demo rows' query={PersonsQuery} emptyMessage='No rows' landmark={landmark}>
                    <DataPage.Columns />
                </DataPage>,
            );
            page.container.querySelectorAll('main').length.should.equal(landmark === false ? 0 : 1);
            const content = page.container.querySelector('[data-cratis-component="DataPage"]')!.firstElementChild!;
            content.className.should.equal('cratis:overflow-hidden cratis:h-full cratis:flex cratis:flex-col cratis:flex-1 panel');
        });
    }
});
