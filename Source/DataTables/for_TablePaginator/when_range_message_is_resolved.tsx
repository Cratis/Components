// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { TablePaginator } from '../TablePaginator';

const render = (element: React.ReactElement) => {
    const container = document.createElement('div');
    container.innerHTML = renderToStaticMarkup(element);
    return container;
};
const rangeOf = (container: HTMLElement) =>
    container.querySelector('[data-cratis-part="range"]')?.textContent ?? null;

describe('when no range message is configured', () => {
    let container: HTMLDivElement;
    beforeEach(() => {
        container = render(
            <TablePaginator page={0} pageCount={4} pageSize={10} totalItems={32} onPageChange={() => undefined} />,
        );
    });
    it('should keep the English en dash range', () => {
        (rangeOf(container) ?? '').should.equal('1–10 of 32');
    });
});

describe('when the provider configures a range message', () => {
    let container: HTMLDivElement;
    beforeEach(() => {
        container = render(
            <CratisComponentsProvider
                value={{ messages: { paginator: { range: (start, end, total) => `${start} a ${end} de ${total}` } } }}
            >
                <TablePaginator page={3} pageCount={4} pageSize={10} totalItems={32} onPageChange={() => undefined} />
            </CratisComponentsProvider>,
        );
    });
    it('should render the configured range with the clamped end', () => {
        (rangeOf(container) ?? '').should.equal('31 a 32 de 32');
    });
});

describe('when explicit labels override the configured range message', () => {
    let container: HTMLDivElement;
    beforeEach(() => {
        container = render(
            <CratisComponentsProvider
                value={{ messages: { paginator: { range: () => 'configured' } } }}
            >
                <TablePaginator
                    page={0}
                    pageCount={4}
                    pageSize={10}
                    totalItems={32}
                    ariaLabels={{ range: (start, end, total) => `explicit ${start}-${end}/${total}` }}
                    onPageChange={() => undefined}
                />
            </CratisComponentsProvider>,
        );
    });
    it('should use the explicit range', () => {
        (rangeOf(container) ?? '').should.equal('explicit 1-10/32');
    });
});

describe('when the total is zero and a range message is configured', () => {
    let container: HTMLDivElement;
    beforeEach(() => {
        container = render(
            <CratisComponentsProvider value={{ messages: { paginator: { range: () => 'never' } } }}>
                <TablePaginator page={0} pageCount={0} pageSize={10} totalItems={0} onPageChange={() => undefined} />
            </CratisComponentsProvider>,
        );
    });
    it('should render no range', () => {
        (rangeOf(container) === null).should.equal(true);
    });
});
