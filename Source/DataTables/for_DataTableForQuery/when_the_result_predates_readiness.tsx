// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { Column } from '../Column';
import { DataTableForQuery } from '../DataTableForQuery';
import { type Product, ProductsQuery } from './given/a_query_result';

// Arc versions before `isReady` existed return results without it; those results are ready.
// The hook result is stable across renders, as Arc's own state is.
const hookResult = vi.hoisted(() => [
    {
        data: [{ id: 1, name: 'Sample product' }],
        isSuccess: true,
        isAuthorized: true,
        hasExceptions: false,
        isValid: true,
        isPerforming: false,
        exceptionMessages: [],
        paging: { page: 0, size: 20, totalItems: 40, totalPages: 2 },
    },
    () => Promise.resolve(), () => undefined, () => undefined, () => undefined,
]);

vi.mock('@cratis/arc.react/queries', () => ({
    useQueryWithPaging: () => hookResult,
}));

let container: HTMLDivElement;
let root: Root;

describe('when the query result has no readiness flag', () => {
    beforeEach(async () => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => {
            root.render(
                <DataTableForQuery<ProductsQuery, Product, object> query={ProductsQuery} emptyMessage='No products'>
                    <Column<Product> field='name' header='Name' />
                </DataTableForQuery>,
            );
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should show the rows', () => {
        expect(container.textContent).to.contain('Sample product');
    });

    it('should show an enabled paginator', () => {
        const paginator = container.querySelector('.cratis-table-paginator');
        expect(paginator).to.not.equal(null);
        const buttons = Array.from(paginator!.querySelectorAll('button'));
        expect(buttons.some(button => !button.disabled)).to.equal(true);
    });
});
