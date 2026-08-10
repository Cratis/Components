// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { QueryFor, QueryResult } from '@cratis/arc/queries';

/**
 * A row in the fixture the specs page through.
 */
export interface Product {
    id: number;
    name: string;
}

const pageSize = 20;

const allProducts: Product[] = Array.from({ length: 24 }, (_, index) => ({
    id: index + 1,
    name: `Product ${index + 1}`
}));

/**
 * What the stand-in Arc paging hook reports back. Mutable so a spec can
 * describe an empty result without having to re-mock the module.
 */
export const queryResult = {
    totalItems: allProducts.length,
    totalPages: 2,
    page: 0
};

/**
 * Puts the result back to the full two-page set, so one spec's narrowing never
 * leaks into the next file's expectations.
 */
export const resetQueryResult = () => {
    queryResult.totalItems = allProducts.length;
    queryResult.totalPages = 2;
    queryResult.page = 0;
};

const rowsForCurrentPage = (): Product[] => {
    if (queryResult.totalItems === 0) {
        return [];
    }
    const first = queryResult.page * pageSize;
    return allProducts.slice(0, queryResult.totalItems).slice(first, first + pageSize);
};

/**
 * The shape `@cratis/arc.react/queries` is replaced with, so the table renders
 * a result of the specs' choosing instead of reaching for a transport.
 *
 * This module deliberately imports nothing from the component under
 * specification: the replacement is built while that very module graph is
 * still loading, so reaching back into it would deadlock the run.
 * @returns The replacement module.
 */
export const arcQueryHooks = () => {
    const currentResult = () => ({
        data: rowsForCurrentPage(),
        paging: {
            page: queryResult.page,
            size: pageSize,
            totalItems: queryResult.totalItems,
            totalPages: queryResult.totalPages
        },
        isSuccess: true,
        isAuthorized: true,
        isValid: true,
        validationResults: [],
        hasExceptions: false,
        exceptionMessages: [],
        exceptionStackTrace: '',
        isPerforming: false,
        hasData: queryResult.totalItems > 0
    });

    const setPage = (page: number) => {
        queryResult.page = page;
    };
    const noop = () => { };

    return {
        useQueryWithPaging: () => [currentResult(), () => Promise.resolve(), noop, setPage, noop],
        useObservableQueryWithPaging: () => [currentResult(), noop, setPage, noop]
    };
};

/**
 * A snapshot query proxy shaped like the ones Arc generates. It is never
 * performed, because the hook it would go through is replaced.
 */
export class ProductsQuery extends QueryFor<Product, object> {
    readonly route = '/api/products';
    readonly routeTemplate = '/api/products';
    readonly defaultValue: Product = [] as unknown as Product;
    readonly parameterDescriptors = [];

    get requiredRequestParameters(): string[] {
        return [];
    }

    constructor() {
        super(Object, true);
    }

    override perform(): Promise<QueryResult<Product>> {
        return Promise.resolve({ data: rowsForCurrentPage() } as unknown as QueryResult<Product>);
    }
}
