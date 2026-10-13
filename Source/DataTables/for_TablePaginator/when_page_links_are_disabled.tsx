// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, it } from 'vitest';
import { TablePaginator } from '../TablePaginator';

for (const pageLinks of [undefined, false]) {
    describe(`when page links are ${String(pageLinks)}`, () => {
        let container: HTMLDivElement;
        beforeEach(() => {
            container = document.createElement('div');
            container.innerHTML = renderToStaticMarkup(
                <TablePaginator
                    page={1}
                    pageCount={4}
                    pageSize={10}
                    totalItems={32}
                    pageLinks={pageLinks}
                    onPageChange={() => undefined}
                />,
            );
        });
        it('should retain the four navigation buttons', () => {
            Array.from(container.querySelectorAll('button'))
                .map((button) => button.getAttribute('aria-label'))
                .should.deep.equal([
                    'First page',
                    'Previous page',
                    'Next page',
                    'Last page',
                ]);
        });
        it('should retain the range and page count reports', () => {
            container
                .querySelector('[data-cratis-part="range"]')!
                .textContent!.should.equal('11–20 of 32');
            container
                .querySelector('[data-cratis-part="info"]')!
                .textContent!.should.equal('2 / 4');
        });
        it('should omit the numbered page list', () => {
            container
                .querySelectorAll('[data-cratis-part="pages"]')
                .length.should.equal(0);
        });
    });
}
