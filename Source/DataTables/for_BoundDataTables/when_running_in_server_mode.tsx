// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import type { DataTableFilterConstraint } from '../DataTableFilterMeta';
import type { DataTableServerQuery } from '../DataTableServerQuery';
import { a_server_mode_table, pageOf, unsuccessful, type Arguments, type Variant } from './given/a_server_mode_table';

const serverQuery: DataTableServerQuery<Arguments> = {
    toArguments: ({ filters, globalFilter }) => ({
        nameContains: (filters.name as DataTableFilterConstraint | undefined)?.value as string | undefined,
        search: globalFilter === '' ? undefined : globalFilter,
    }),
    sortFields: { name: 'displayName' },
};

// The Arc hooks and their instance/result cache are real; only query delivery is controlled.
describe.each<Variant>(['snapshot', 'observable'])('when a bound %s table runs in server mode', variant => {
    let table: a_server_mode_table;

    beforeEach(() => {
        vi.stubGlobal('ResizeObserver', class {
            observe() { /* No layout in jsdom. */ }
            disconnect() { /* No layout in jsdom. */ }
            unobserve() { /* No layout in jsdom. */ }
        });
        table = new a_server_mode_table(variant);
    });

    afterEach(async () => {
        await table.dispose();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    describe('and the second page is shown', () => {
        beforeEach(async () => {
            await table.render(serverQuery);
            await table.deliver(pageOf(['Example row 1'], 45));
            await table.nextPage();
            await table.deliver(pageOf(['Example row 21'], 45, 1));
        });

        it('should request the second page', () => {
            table.lastRequest.page.should.equal(1);
        });

        it('should report the server total', () => {
            table.paginatorRange.should.contain('45');
        });

        describe('and a column is sorted', () => {
            beforeEach(async () => {
                await table.sort();
                await table.deliver(pageOf(['Example row C', 'Example row A', 'Example row B'], 45));
            });

            it('should send the mapped sort field to the server', () => {
                table.lastRequest.sortBy.should.equal('displayName');
                table.lastRequest.sortDirection.should.equal('asc');
            });

            it('should go back to the first page', () => {
                table.lastRequest.page.should.equal(0);
            });

            it('should render the rows in the order the server returned them', () => {
                table.rows.should.deep.equal(['Example row C', 'Example row A', 'Example row B']);
            });
        });

        describe('and a column is filtered', () => {
            beforeEach(async () => {
                await table.filterBy('Example');
                await table.deliver(pageOf(['Unmatched row'], 1));
            });

            it('should send the mapped filter argument with the original arguments', () => {
                table.lastRequest.args.should.deep.include({ scope: 'Example scope', nameContains: 'Example' });
            });

            it('should go back to the first page', () => {
                table.lastRequest.page.should.equal(0);
            });

            it('should render the rows the server returned without filtering them again', () => {
                table.rows.should.deep.equal(['Unmatched row']);
            });

            it('should page by the filtered total from the server', () => {
                table.paginatorRange.should.equal('');
            });
        });
    });

    describe('and text is typed into the search', () => {
        let requestsWhileTyping: number;
        let requestsBeforeTyping: number;

        beforeEach(async () => {
            await table.render(serverQuery);
            await table.deliver(pageOf(['Example row 1'], 45));
            await table.nextPage();
            await table.deliver(pageOf(['Example row 21'], 45, 1));
            vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
            requestsBeforeTyping = table.requests.length;
            await table.search('Exa');
            await table.search('Example');
            vi.advanceTimersByTime(299);
            requestsWhileTyping = table.requests.length;
            await vi.advanceTimersByTimeAsync(1);
            vi.useRealTimers();
            await table.deliver(pageOf(['Example row 1'], 1));
        });

        it('should not query while typing continues', () => {
            requestsWhileTyping.should.equal(requestsBeforeTyping);
        });

        it('should query once with the settled search text', () => {
            table.requests.length.should.equal(requestsBeforeTyping + 1);
            table.lastRequest.args.should.deep.include({ scope: 'Example scope', search: 'Example' });
        });

        it('should go back to the first page', () => {
            table.lastRequest.page.should.equal(0);
        });
    });

    describe('and the search waits a configured time', () => {
        let requestsBeforeTyping: number;

        beforeEach(async () => {
            await table.render({ ...serverQuery, searchDebounceMilliseconds: 0 });
            await table.deliver(pageOf(['Example row 1'], 1));
            requestsBeforeTyping = table.requests.length;
            await table.search('Example');
        });

        it('should query at once when the wait is zero', () => {
            table.requests.length.should.equal(requestsBeforeTyping + 1);
            table.lastRequest.args.should.deep.include({ search: 'Example' });
        });
    });

    describe('and the server returns nothing', () => {
        beforeEach(async () => {
            await table.render(serverQuery);
            await table.deliver(pageOf([], 0));
        });

        it('should show the empty message', () => {
            table.text.should.contain('No rows');
        });
    });

    describe('and the server query is unsuccessful', () => {
        beforeEach(async () => {
            await table.render(serverQuery);
            await table.deliver(unsuccessful());
        });

        it('should show the failure rather than the empty message', () => {
            table.failure.should.equal('Rows failed');
            table.text.should.not.contain('No rows');
        });
    });
});

describe.each<Variant>(['snapshot', 'observable'])('when a bound %s table runs without server mode', variant => {
    let table: a_server_mode_table;
    let requestsBeforeSorting: number;

    beforeEach(async () => {
        vi.stubGlobal('ResizeObserver', class {
            observe() { /* No layout in jsdom. */ }
            disconnect() { /* No layout in jsdom. */ }
            unobserve() { /* No layout in jsdom. */ }
        });
        table = new a_server_mode_table(variant);
        await table.render(undefined);
        await table.deliver(pageOf(['Example row C', 'Example row A', 'Example row B'], 45));
        requestsBeforeSorting = table.requests.length;
        await table.sort();
        await table.search('Example row');
    });

    afterEach(async () => {
        await table.dispose();
        vi.unstubAllGlobals();
    });

    it('should sort and search the loaded page without querying again', () => {
        table.requests.length.should.equal(requestsBeforeSorting);
        table.rows.should.deep.equal(['Example row A', 'Example row B', 'Example row C']);
    });

    it('should query without sorting or extra arguments', () => {
        table.lastRequest.sortBy.should.equal('');
        table.lastRequest.args.should.deep.equal({ scope: 'Example scope' });
    });
});
