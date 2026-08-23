// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import {
    aDataPage,
    type DataPageInTheDom,
    render,
    unmount,
} from './given/a_data_page';

vi.mock('@cratis/arc.react/queries', async () => {
    const { arcQueryHooks } = await import('./given/a_paged_query_result');
    return arcQueryHooks();
});

describe('when paginator parts are given', () => {
    let page: DataPageInTheDom;

    beforeEach(async () => {
        page = await render(
            aDataPage({
                paginatorPt: {
                    root: { className: 'product-paginator' },
                    next: { root: { className: 'product-paginator-next' } },
                },
            }),
        );
    });

    afterEach(async () => {
        await unmount(page);
    });

    it('should forward the paginator root part', () => {
        expect(page.container.querySelector('.product-paginator')).not.to.equal(null);
    });

    it('should forward paginator button parts', () => {
        expect(page.container.querySelector('.product-paginator-next')).not.to.equal(
            null,
        );
    });
});
