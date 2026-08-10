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

describe('when rendering a result and it is empty', () => {
    let table: DataTableInTheDom;

    beforeEach(async () => {
        queryResult.totalItems = 0;
        queryResult.totalPages = 0;
        table = await render(aDataTable());
    });

    afterEach(async () => {
        await unmount(table);
    });

    it('should not render the paginator', () => {
        hasPaginator(table).should.be.false;
    });
});
