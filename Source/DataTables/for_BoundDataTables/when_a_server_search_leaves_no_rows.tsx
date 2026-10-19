// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { a_server_mode_table, pageOf, type Variant } from './given/a_server_mode_table';

describe.each<Variant>(['snapshot', 'observable'])('when a bound %s table in server mode has no rows for a search', variant => {
    let table: a_server_mode_table;

    beforeEach(async () => {
        vi.stubGlobal('ResizeObserver', class {
            observe() { /* No layout in jsdom. */ }
            disconnect() { /* No layout in jsdom. */ }
            unobserve() { /* No layout in jsdom. */ }
        });
        table = new a_server_mode_table(variant);
        await table.render({ toArguments: () => ({}), searchDebounceMilliseconds: 0 });
        await table.deliver(pageOf([], 0));
    });

    afterEach(async () => {
        await table.dispose();
        vi.unstubAllGlobals();
    });

    it('should show the empty message without a search', () => {
        table.text.should.contain('No rows');
        table.text.should.not.contain('match the search');
    });

    it('should show the neutral filtered message once a search is typed', async () => {
        await table.search('nothing');
        await table.deliver(pageOf([], 0));
        table.text.should.contain('No rows match the search.');
        table.text.should.not.contain('this page');
    });
});
