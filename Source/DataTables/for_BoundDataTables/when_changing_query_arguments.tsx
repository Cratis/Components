// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { a_bound_table, resultFor, type Status, type Variant } from './given/a_bound_table';

const scopeA = { scope: 'A' };
const scopeB = { scope: 'B' };

// The Arc hooks and their instance/result cache are real; only query delivery is controlled.
describe.each<Variant>(['snapshot', 'observable'])('when a %s bound table changes arguments', variant => {
    let table: a_bound_table;

    beforeEach(() => {
        vi.stubGlobal('ResizeObserver', class {
            observe() { /* No layout in jsdom. */ }
            disconnect() { /* No layout in jsdom. */ }
            unobserve() { /* No layout in jsdom. */ }
        });
        table = new a_bound_table(variant);
    });

    afterEach(async () => {
        await table.dispose();
        vi.unstubAllGlobals();
    });

    describe.each<Status>(['loaded', 'unauthorized', 'failed'])('after a %s result', status => {
        let pendingCommits: string[];
        let pendingStatus: string;
        let initialText: string;

        beforeEach(async () => {
            await table.render(scopeA);
            await table.deliver(scopeA, resultFor('Example row A', status));
            initialText = table.text;
            table.commits.length = 0;
            await table.render(scopeB);
            pendingCommits = [...table.commits];
            pendingStatus = table.loading;
            await table.deliver(scopeB, resultFor('Example row B'));
        });

        it('should first display the original result', () => {
            initialText.should.contain(status === 'loaded' ? 'Example row A' : status === 'unauthorized' ? 'Rows denied' : 'Rows failed');
        });

        it('should show loading in every commit until the new result arrives', () => {
            pendingCommits.length.should.be.greaterThan(0);
            pendingCommits.forEach(text => {
                text.should.contain('Loading rows');
                text.should.not.contain('Example row A');
                text.should.not.contain('Rows denied');
                text.should.not.contain('Rows failed');
            });
            pendingStatus.should.equal('Loading rows');
        });

        it('should show only the new arguments rows when they arrive', () => {
            table.text.should.contain('Example row B');
            table.text.should.not.contain('Example row A');
            table.loading.should.equal('');
        });
    });

    describe('and returning to cached arguments before the next result arrives', () => {
        let restoredCommits: string[];
        let restoredRows: string;
        let restoredLoading: string;
        let lateResultRows: string;

        beforeEach(async () => {
            await table.render(scopeA);
            await table.deliver(scopeA, resultFor('Example row A'));
            await table.render(scopeB);
            table.commits.length = 0;
            await table.render(scopeA);
            restoredCommits = [...table.commits];
            restoredRows = table.text;
            restoredLoading = table.loading;
            await table.deliver(scopeB, resultFor('Example row B'));
            lateResultRows = table.text;
        });

        it('should restore cached rows without a loading flash in any commit', () => {
            restoredCommits.length.should.be.greaterThan(0);
            restoredCommits.forEach(text => {
                text.should.contain('Example row A');
                text.should.not.contain('Loading rows');
            });
            restoredRows.should.contain('Example row A');
            restoredLoading.should.equal('');
        });

        it('should ignore a late result for the arguments that are no longer displayed', () => {
            lateResultRows.should.contain('Example row A');
            lateResultRows.should.not.contain('Example row B');
        });
    });

    describe('and only an optional argument changes', () => {
        let pendingCommits: string[];

        beforeEach(async () => {
            await table.render(scopeA);
            await table.deliver(scopeA, resultFor('Example row A'));
            table.commits.length = 0;
            const filtered = { scope: 'A', filter: 'sample' };
            await table.render(filtered);
            pendingCommits = [...table.commits];
            await table.deliver(filtered, resultFor('Example filtered row'));
        });

        it('should show loading rather than rows from the earlier optional arguments', () => {
            pendingCommits.length.should.be.greaterThan(0);
            pendingCommits.forEach(text => {
                text.should.contain('Loading rows');
                text.should.not.contain('Example row A');
            });
        });

        it('should request and show the result for the optional argument', () => {
            table.text.should.contain('Example filtered row');
            table.text.should.not.contain('Example row A');
            table.loading.should.equal('');
        });
    });
});
