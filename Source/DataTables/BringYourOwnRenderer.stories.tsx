// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { type ReactElement } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { QueryFor, QueryResult } from '@cratis/arc/queries';
import { bindQuery } from './bindQuery';
import type { TableRendererProps } from './TableRenderer';

// This story is the visual counterpart to `for_bindQuery` — it proves the
// rendering seam by pairing Cratis's query + paging behavior with a renderer
// that is deliberately *not* a table: a card list. The consumer writes no
// query/paging code, yet gets Cratis paging (note the paginator) for free.

interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
}

const allProducts: Product[] = Array.from({ length: 25 }, (_, index) => ({
    id: index + 1,
    name: `Product ${index + 1}`,
    category: ['Electronics', 'Office', 'Accessories'][index % 3],
    price: Math.round((10 + index * 3.5) * 100) / 100,
}));

/**
 * A trivial, non-`DataTableCore` renderer: cards, not a table, and free of any
 * PrimeReact. Generic over the row type (exactly like `DataTableCore`), so it
 * satisfies the {@link TableRenderer} contract and plugs into `bindQuery`.
 */
const CardListRenderer = <TData extends object,>({ data, emptyMessage }: TableRendererProps<TData>): ReactElement => {
    if (data.length === 0) {
        return <div style={{ padding: '1rem', color: 'var(--text-color-secondary)' }}>{emptyMessage}</div>;
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
            {data.map((row, index) => (
                <div
                    key={index}
                    style={{
                        display: 'flex',
                        gap: '1.5rem',
                        padding: '0.75rem 1rem',
                        border: '1px solid var(--cratis-surface-border)',
                        borderRadius: 'var(--cratis-border-radius)',
                        background: 'var(--surface-card)',
                    }}>
                    {Object.entries(row).map(([field, value]) => (
                        <span key={field}>
                            <strong style={{ textTransform: 'capitalize', color: 'var(--text-color-secondary)' }}>{field}: </strong>
                            {String(value)}
                        </span>
                    ))}
                </div>
            ))}
        </div>
    );
};

// `bindQuery(CardListRenderer)` returns a component with exactly the same props
// and behavior as `DataTableForQuery` — only the rendering differs.
const CardListForQuery = bindQuery(CardListRenderer);

// Mock query — overrides perform() to page a static dataset instead of hitting a backend.
class ProductsQuery extends QueryFor<Product, object> {
    readonly route = '/api/products';
    readonly defaultValue: Product = [] as unknown as Product;
    readonly parameterDescriptors = [];
    get requiredRequestParameters() {
        return [];
    }
    constructor() {
        super(Object, true);
    }
    override perform(): Promise<QueryResult<Product>> {
        const currentPaging = (this as unknown as { paging?: { page: number; pageSize: number } }).paging;
        const page = currentPaging?.page ?? 0;
        const size = currentPaging?.pageSize ?? 20;
        const start = page * size;
        return Promise.resolve({
            data: allProducts.slice(start, start + size),
            paging: { totalItems: allProducts.length, totalPages: Math.ceil(allProducts.length / size), page, size },
            isSuccess: true,
            isAuthorized: true,
            isValid: true,
            hasExceptions: false,
            validationResults: [],
            exceptionMessages: [],
            exceptionStackTrace: '',
        } as unknown as QueryResult<Product>);
    }
}

const meta: Meta<typeof CardListForQuery> = {
    title: 'DataTables/BringYourOwnRenderer',
    component: CardListForQuery,
};

export default meta;
type Story = StoryObj<typeof CardListForQuery>;

/**
 * A card renderer bound to a paged Cratis query. The paginator at the bottom
 * (25 rows across two pages) is driven by Cratis — the renderer only ever
 * receives one page of rows through `data`.
 */
export const Default: Story = {
    render: () => (
        <div style={{ height: '32rem' }}>
            <CardListForQuery<ProductsQuery, Product, object>
                query={ProductsQuery}
                emptyMessage="No products found"
                dataKey="id"
            />
        </div>
    )
};
