// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { ProductsQuery } from '../../DataTables/for_DataTableForQuery/given/a_query_result';
import { Column } from '../../DataTables/Column';
import { DataPage } from '../DataPage';

vi.mock('@cratis/arc.react/queries', () => ({
    useQueryWithPaging: () => [
        {
            data: [],
            paging: { page: 0, size: 20, totalItems: 0, totalPages: 0 },
            isAuthorized: true,
            hasExceptions: true,
            isValid: true,
            isPerforming: false,
        },
        () => Promise.resolve(), () => undefined, () => undefined, () => undefined,
    ],
}));

let container: HTMLDivElement;
let root: Root;

describe('when a DataPage query fails', () => {
    beforeEach(async () => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => {
            root.render(
                <DataPage title='Products' query={ProductsQuery} emptyMessage='No products'
                    failureMessage='Custom page failure'>
                    <DataPage.Columns><Column field='name' header='Name' /></DataPage.Columns>
                </DataPage>,
            );
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should forward the custom failure message to the table', () => {
        expect(container.querySelector('[data-reason="failed"] [role="alert"]')?.textContent).to.equal('Custom page failure');
        expect(container.textContent).not.to.contain('No products');
    });
});
