// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { DataTableForQuery } from './DataTableForQuery';
import { Column } from 'primereact/column';
import { QueryFor, QueryResult } from '@cratis/arc/queries';
import { DataTableSelectionSingleChangeEvent } from 'primereact/datatable';

const meta: Meta<typeof DataTableForQuery> = {
    title: 'DataTables/DataTableForQuery',
    component: DataTableForQuery,
};

export default meta;
type Story = StoryObj<typeof DataTableForQuery>;

// Mock data type
interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    inStock: boolean;
}

const mockProducts: Product[] = [
    { id: 1, name: 'Wireless Headphones', category: 'Electronics', price: 79.99, inStock: true },
    { id: 2, name: 'Mechanical Keyboard', category: 'Electronics', price: 129.99, inStock: true },
    { id: 3, name: 'USB-C Hub', category: 'Electronics', price: 49.99, inStock: false },
    { id: 4, name: 'Standing Desk Mat', category: 'Office', price: 34.99, inStock: true },
    { id: 5, name: 'Monitor Stand', category: 'Office', price: 59.99, inStock: true },
    { id: 6, name: 'Webcam HD', category: 'Electronics', price: 89.99, inStock: false },
    { id: 7, name: 'Laptop Sleeve', category: 'Accessories', price: 24.99, inStock: true },
    { id: 8, name: 'Cable Management Kit', category: 'Accessories', price: 14.99, inStock: true },
];

// Mock query — overrides perform() to return static data instead of making HTTP calls
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
        return Promise.resolve({
            data: mockProducts,
            paging: { totalItems: mockProducts.length, totalPages: 1, page: 0, size: mockProducts.length },
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

export const Default: Story = {
    render: () => (
        <div className="p-4">
            <DataTableForQuery<ProductsQuery, Product, object>
                query={ProductsQuery}
                emptyMessage="No products found"
                dataKey="id"
            >
                <Column field="id" header="ID" sortable style={{ width: '10%' }} />
                <Column field="name" header="Product Name" sortable style={{ width: '30%' }} />
                <Column field="category" header="Category" sortable style={{ width: '20%' }} />
                <Column 
                    field="price" 
                    header="Price" 
                    sortable 
                    style={{ width: '20%' }}
                    body={(rowData: Product) => `$${rowData.price.toFixed(2)}`}
                />
                <Column 
                    field="inStock" 
                    header="In Stock" 
                    sortable 
                    style={{ width: '20%' }}
                    body={(rowData: Product) => (
                        <span className={rowData.inStock ? 'text-green-600' : 'text-red-600'}>
                            {rowData.inStock ? 'Yes' : 'No'}
                        </span>
                    )}
                />
            </DataTableForQuery>
        </div>
    )
};

export const WithSelection: Story = {
    render: () => {
        const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();

        return (
            <div className="p-4">
                <DataTableForQuery<ProductsQuery, Product, object>
                    query={ProductsQuery}
                    emptyMessage="No products found"
                    dataKey="id"
                    selection={selectedProduct}
                    onSelectionChange={(e: DataTableSelectionSingleChangeEvent<Product[]>) => setSelectedProduct(e.value as Product)}
                >
                    <Column selectionMode="single" headerStyle={{ width: '3rem' }} />
                    <Column field="id" header="ID" sortable style={{ width: '10%' }} />
                    <Column field="name" header="Product Name" sortable style={{ width: '30%' }} />
                    <Column field="category" header="Category" sortable style={{ width: '20%' }} />
                    <Column 
                        field="price" 
                        header="Price" 
                        sortable 
                        style={{ width: '20%' }}
                        body={(rowData: Product) => `$${rowData.price.toFixed(2)}`}
                    />
                </DataTableForQuery>
                
                {selectedProduct && (
                    <div className="mt-4 p-4 border rounded">
                        <h3 className="font-bold mb-2">Selected Product:</h3>
                        <p><strong>Name:</strong> {selectedProduct.name}</p>
                        <p><strong>Category:</strong> {selectedProduct.category}</p>
                        <p><strong>Price:</strong> ${selectedProduct.price.toFixed(2)}</p>
                        <p><strong>In Stock:</strong> {selectedProduct.inStock ? 'Yes' : 'No'}</p>
                    </div>
                )}
            </div>
        );
    }
};
