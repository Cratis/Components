// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { vi } from 'vitest';
import { aDataTableOverAGeneratedProxy, type DataTableInTheDom, hasPaginator, render, unmount } from '../given/a_data_table';
import { queryResult, type Product } from '../given/a_query_result';

vi.mock('@cratis/arc.react/queries', async () => {
    const { arcQueryHooks } = await import('../given/a_query_result');
    return arcQueryHooks();
});

/**
 * Arc generates proxies as `QueryFor<Row[], Arguments>` - the data type is the array. The
 * table's row generic is `TDataType`, so a consumer who wants typed selection has to write
 * `<DataTableForQuery<TheProxy, Row, Arguments>>`. The constraint used to reject exactly that
 * combination (TS2344), which forced every selectable table down to `object`. This spec is the
 * compile-time proof that a real proxy and a named row type coexist, and the runtime proof that
 * such a table still renders.
 */
describe('when rendering a result and the query is a generated proxy', () => {
    let table: DataTableInTheDom;
    let selected: Product | null | undefined;

    beforeEach(async () => {
        queryResult.totalItems = 24;
        queryResult.totalPages = 2;
        table = await render(aDataTableOverAGeneratedProxy((product) => { selected = product; }));
    });

    afterEach(async () => {
        await unmount(table);
    });

    it('should render the paginator', () => {
        hasPaginator(table).should.be.true;
    });

    it('should not have selected anything before the user does', () => {
        (selected === undefined).should.be.true;
    });
});
