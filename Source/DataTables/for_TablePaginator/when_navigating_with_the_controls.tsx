// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { TablePaginator } from '../TablePaginator';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('when navigating with the TablePaginator controls', () => {
    let container: HTMLDivElement;
    let root: Root;
    const onPageChange = vi.fn();
    const onRootFocus = vi.fn();
    const button = (label: string) =>
        container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`) as HTMLButtonElement;

    beforeEach(async () => {
        onPageChange.mockReset();
        onRootFocus.mockReset();
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        await act(async () => root.render(
            <TablePaginator page={2} pageCount={5} onPageChange={onPageChange} pt={{ root: { onFocus: onRootFocus } }} />,
        ));
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should request the first, previous, next and last zero-based pages in order', async () => {
        await act(async () => button('First page').click());
        await act(async () => button('Previous page').click());
        await act(async () => button('Next page').click());
        await act(async () => button('Last page').click());

        onPageChange.mock.calls.should.deep.equal([[0], [1], [3], [4]]);
    });

    it('should forward focus events to the root part handler', async () => {
        await act(async () => button('Next page').focus());

        onRootFocus.mock.calls.length.should.equal(1);
    });
});

describe('when rendering the TablePaginator markup', () => {
    it('should render the range, controls and page info in order with merged classes', () => {
        const html = renderToStaticMarkup(
            <TablePaginator
                page={1}
                pageCount={0}
                pageSize={10}
                totalItems={25}
                onPageChange={() => undefined}
                className='sample-caller'
                pt={{
                    root: { className: 'sample-root' },
                    range: { className: 'sample-range' },
                    info: { className: 'sample-info' },
                }}
            />,
        );
        const host = document.createElement('div');
        host.innerHTML = html;
        const rootElement = host.firstElementChild as HTMLElement;

        rootElement.className.should.equal('cratis-table-paginator sample-root sample-caller');
        rootElement.getAttribute('role')!.should.equal('navigation');
        rootElement.getAttribute('aria-label')!.should.equal('Pagination');
        rootElement.getAttribute('data-cratis-component')!.should.equal('TablePaginator');
        [...rootElement.children].map((child) => child.getAttribute('aria-label') ?? child.getAttribute('data-cratis-part'))
            .should.deep.equal(['range', 'First page', 'Previous page', 'info', 'Next page', 'Last page']);
        rootElement.querySelector('[data-cratis-part="range"]')!.className.should.equal('cratis-table-paginator-range sample-range');
        const info = rootElement.querySelector('[data-cratis-part="info"]')!;
        info.className.should.equal('cratis-table-paginator-info sample-info');
        info.textContent!.should.equal('2 / 1');
    });
});
