// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '@cratis/components';
import { TablePaginator, type TablePaginatorProps } from '@cratis/components/DataTables';
import { designsystemetUiLibrary } from '../src/index.js';

let root: Root | undefined;
let container: HTMLElement | undefined;

const render = async (props: Partial<TablePaginatorProps>) => {
    const paginatorProps: TablePaginatorProps = {
        page: 1,
        pageCount: 3,
        onPageChange: () => undefined,
        ...props,
    };
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
        root?.render(
            createElement(CratisComponentsProvider, {
                library: designsystemetUiLibrary,
                children: createElement(TablePaginator, paginatorProps),
            }),
        );
    });
};

const navigation = () => container?.querySelector<HTMLElement>('[role="navigation"]');
const control = (label: string) => navigation()?.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`);
const part = (name: string) => navigation()?.querySelector<HTMLElement>(`[data-cratis-part="${name}"]`);

afterEach(async () => {
    await act(async () => root?.unmount());
    container?.remove();
    root = undefined;
    container = undefined;
});

describe('when rendering the Designsystemet paginator', () => {
    it('should render a labelled div navigation with the Designsystemet pagination class and Cratis parts', async () => {
        await render({ totalItems: 30, pageSize: 10, pt: { root: { className: 'consumer-root' } }, className: 'consumer' });

        const element = navigation();
        expect(element?.tagName).to.equal('DIV');
        expect(element?.getAttribute('aria-label')).to.equal('Pagination');
        expect(element?.classList.contains('ds-pagination')).to.equal(true);
        expect(element?.classList.contains('consumer-root')).to.equal(true);
        expect(element?.classList.contains('consumer')).to.equal(true);
        expect(element?.getAttribute('data-cratis-part')).to.equal('root');
        expect(part('range')?.textContent).to.equal('11–20 of 30');
        expect(part('info')?.textContent).to.equal('2 / 3');
        for (const name of ['first', 'previous', 'next', 'last']) {
            expect(part(name)?.tagName, name).to.equal('BUTTON');
        }
    });

    it('should request zero-based pages from each control', async () => {
        const requested: number[] = [];
        await render({ page: 1, pageCount: 4, onPageChange: (page) => requested.push(page) });

        await act(async () => {
            for (const label of ['First page', 'Previous page', 'Next page', 'Last page']) control(label)?.click();
        });

        expect(requested).to.deep.equal([0, 0, 2, 3]);
    });

    it('should disable first and previous on the first page and next and last on the last page', async () => {
        await render({ page: 0, pageCount: 2 });
        expect([control('First page')?.disabled, control('Previous page')?.disabled]).to.deep.equal([true, true]);
        expect([control('Next page')?.disabled, control('Last page')?.disabled]).to.deep.equal([false, false]);

        await act(async () => root?.unmount());
        container?.remove();
        await render({ page: 1, pageCount: 2 });
        expect([control('Next page')?.disabled, control('Last page')?.disabled]).to.deep.equal([true, true]);
    });

    it('should render numbered pages with the current page marked', async () => {
        const requested: number[] = [];
        await render({ page: 5, pageCount: 12, pageLinks: true, onPageChange: (page) => requested.push(page) });

        expect(part('info')).to.equal(null);
        expect(part('pages')?.getAttribute('aria-label')).to.equal('Pages');
        expect(navigation()?.querySelectorAll('[data-cratis-part="ellipsis"]').length).to.equal(2);
        const current = navigation()?.querySelector('[aria-current="page"]');
        expect(current?.textContent).to.equal('6');
        expect(current?.getAttribute('aria-label')).to.equal('Page 6');
        expect(navigation()?.querySelectorAll('[aria-current]').length).to.equal(1);

        await act(async () => control('Page 7')?.click());
        expect(requested).to.deep.equal([6]);
    });

    it('should merge consumer part attributes', async () => {
        await render({
            page: 5,
            pageCount: 12,
            pageLinks: true,
            totalItems: 120,
            pageSize: 10,
            pt: {
                range: { className: 'consumer-range' },
                pages: { className: 'consumer-pages' },
                page: { className: 'consumer-page' },
                ellipsis: { className: 'consumer-ellipsis' },
                next: { root: { className: 'consumer-next' } },
            },
        });

        for (const name of ['range', 'pages', 'page', 'ellipsis', 'next']) {
            expect(part(name)?.classList.contains(`consumer-${name}`), name).to.equal(true);
        }
    });

    it('should use localized labels from the Components messages', async () => {
        await render({ ariaLabels: { navigation: 'Sider', next: 'Neste', previous: 'Forrige', first: 'Første', last: 'Siste' } });

        expect(navigation()?.getAttribute('aria-label')).to.equal('Sider');
        for (const label of ['Neste', 'Forrige', 'Første', 'Siste']) {
            expect(control(label), label).not.to.equal(null);
        }
    });

    it('should keep focus inside the paginator when paging to the last page disables the focused control', async () => {
        await render({ page: 1, pageCount: 3 });
        const next = control('Next page');
        next?.focus();
        await act(async () => {
            root?.render(
                createElement(CratisComponentsProvider, {
                    library: designsystemetUiLibrary,
                    children: createElement(TablePaginator, { page: 2, pageCount: 3, onPageChange: () => undefined }),
                }),
            );
        });

        expect(control('Next page')?.disabled).to.equal(true);
        expect(navigation()?.contains(document.activeElement)).to.equal(true);
    });
});
