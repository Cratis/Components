// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { TablePaginator } from '../TablePaginator';

describe('when rendering TablePaginator state attributes', () => {
    it('should expose disabled state only on unavailable first-page controls', () => {
        const html = renderToStaticMarkup(
            <TablePaginator page={0} pageCount={3} onPageChange={() => undefined} />,
        );

        const container = document.createElement('div');
        container.innerHTML = html;
        const buttons = Array.from(container.querySelectorAll('button'));
        expect(buttons[0].getAttribute('data-disabled')).to.equal('true');
        expect(buttons[1].getAttribute('data-disabled')).to.equal('true');
        expect(buttons[2].hasAttribute('data-disabled')).to.equal(false);
        expect(buttons[3].hasAttribute('data-disabled')).to.equal(false);
    });

    it('should omit disabled state from all controls on a middle page', () => {
        const html = renderToStaticMarkup(
            <TablePaginator page={1} pageCount={3} onPageChange={() => undefined} />,
        );

        expect(html).not.to.contain('data-disabled=');
    });

    it('should never serialize false disabled state', () => {
        const html = renderToStaticMarkup(
            <TablePaginator page={0} pageCount={3} onPageChange={() => undefined} />,
        );

        expect(html).not.to.contain('data-disabled="false"');
    });
});
