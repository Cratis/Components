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

describe('when a controlled selection is given', () => {
    let page: DataPageInTheDom;

    beforeEach(async () => {
        page = await render(
            aDataPage({
                withDetails: true,
                selection: {
                    id: 2,
                    name: 'Person 2',
                    email: 'sample02@example.invalid',
                },
            }),
        );
    });

    afterEach(async () => {
        await unmount(page);
    });

    it('should select the matching row', () => {
        expect(
            page.container.querySelector('[data-cratis-part="row"][aria-selected="true"]')
                ?.textContent,
        ).to.contain('Person 2');
    });

    it('should render details for the controlled value', () => {
        expect(page.container.querySelector('.person-details')?.textContent).to.equal(
            'Person 2',
        );
    });
});
