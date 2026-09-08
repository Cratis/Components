// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { vi } from 'vitest';
import { aDataTable, type DataTableInTheDom, hasPaginator, render, unmount } from '../given/a_data_table';
import { queryResult } from '../given/a_query_result';

vi.mock('@cratis/arc.react/queries', async () => {
    const { arcQueryHooks } = await import('../given/a_query_result');
    return arcQueryHooks();
});

describe('when rendering a result and it has items', () => {
    let table: DataTableInTheDom;

    beforeEach(async () => {
        queryResult.totalItems = 24;
        queryResult.totalPages = 2;
        table = await render(aDataTable());
    });

    afterEach(async () => {
        await unmount(table);
    });

    it('should render the paginator', () => {
        hasPaginator(table).should.be.true;
    });
});
