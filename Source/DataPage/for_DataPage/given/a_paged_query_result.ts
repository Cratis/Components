// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { QueryFor, QueryResult } from '@cratis/arc/queries';

/**
 * A row in the fixture the specs page through.
 */
export interface Person {
    id: number;
    name: string;
    email: string;
}

const pageSize = 20;

const allPersons: Person[] = Array.from({ length: 24 }, (_, index) => ({
    id: index + 1,
    name: `Person ${index + 1}`,
    email: `person${index + 1}@example.com`,
}));

/**
 * What the stand-in Arc paging hooks report back. Mutable so a spec can narrow
 * the result — an empty one, say — without having to re-mock the module.
 */
export const queryResult = {
    totalItems: allPersons.length,
    totalPages: 2,
    page: 0,
};

/**
 * Puts the result back to the full two-page set, so one spec's narrowing never
 * leaks into the next file's expectations.
 */
export const resetQueryResult = () => {
    queryResult.totalItems = allPersons.length;
    queryResult.totalPages = 2;
    queryResult.page = 0;
};

const rowsForCurrentPage = (): Person[] => {
    if (queryResult.totalItems === 0) {
        return [];
    }
    const first = queryResult.page * pageSize;
    return allPersons.slice(0, queryResult.totalItems).slice(first, first + pageSize);
};

/**
 * The shape `@cratis/arc.react/queries` is replaced with. Only the two paging
 * hooks the data tables consume are provided — the rest of that module would
 * drag a transport connection into specs that are about layout.
 *
 * This module deliberately imports nothing from the components under
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
            totalPages: queryResult.totalPages,
        },
        isSuccess: true,
        isAuthorized: true,
        isValid: true,
        validationResults: [],
        hasExceptions: false,
        exceptionMessages: [],
        exceptionStackTrace: '',
        isPerforming: false,
        hasData: queryResult.totalItems > 0,
    });

    const setPage = (page: number) => {
        queryResult.page = page;
    };
    const noop = () => {};

    return {
        useQueryWithPaging: () => [
            currentResult(),
            () => Promise.resolve(),
            noop,
            setPage,
            noop,
        ],
        useObservableQueryWithPaging: () => [currentResult(), noop, setPage, noop],
    };
};

/**
 * A snapshot query proxy shaped like the ones Arc generates. `DataPage` picks
 * its inner table by looking at the prototype chain, so the class has to be a
 * real `QueryFor` — it is never performed, because the hooks are replaced.
 */
export class PersonsQuery extends QueryFor<Person, object> {
    readonly route = '/api/persons';
    readonly routeTemplate = '/api/persons';
    // SAFETY: Arc collection-query proxies are row-typed while their runtime default is an empty row array.
    readonly defaultValue: Person = [] as unknown as Person;
    readonly parameterDescriptors = [];

    get requiredRequestParameters(): string[] {
        return [];
    }

    constructor() {
        super(Object, true);
    }

    override perform(): Promise<QueryResult<Person>> {
        // SAFETY: Arc collection query results are row-typed while their runtime data is the current row array.
        return Promise.resolve({
            data: rowsForCurrentPage(),
            paging: {
                page: queryResult.page,
                size: pageSize,
                totalItems: queryResult.totalItems,
                totalPages: queryResult.totalPages,
            },
            isSuccess: true,
            isAuthorized: true,
            isValid: true,
            validationResults: [],
            hasExceptions: false,
            exceptionMessages: [],
            exceptionStackTrace: '',
        } as unknown as QueryResult<Person>);
    }
}
