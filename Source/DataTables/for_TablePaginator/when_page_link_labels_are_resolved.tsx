// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { TablePaginator } from '../TablePaginator';

describe('when page link labels are not configured', () => {
    let container: HTMLDivElement;
    beforeEach(() => {
        container = document.createElement('div');
        container.innerHTML = renderToStaticMarkup(
            <TablePaginator
                page={0}
                pageCount={1}
                pageLinks
                onPageChange={() => undefined}
            />,
        );
    });
    it('should use the English page and group labels', () => {
        container.querySelectorAll('button[aria-label="Page 1"]').length.should.equal(1);
        container
            .querySelectorAll('[role="group"][aria-label="Pages"]')
            .length.should.equal(1);
    });
});

describe('when explicit page link labels override configured messages', () => {
    let container: HTMLDivElement;
    beforeEach(() => {
        container = document.createElement('div');
        container.innerHTML = renderToStaticMarkup(
            <CratisComponentsProvider
                value={{
                    messages: {
                        paginator: {
                            page: (number) => `Configured ${number}`,
                            pages: 'Configured pages',
                        },
                    },
                }}
            >
                <TablePaginator
                    page={5}
                    pageCount={12}
                    pageLinks={{ siblings: 0, boundaries: 1 }}
                    ariaLabels={{
                        page: (number) => `Explicit ${number}`,
                        pages: 'Explicit pages',
                    }}
                    onPageChange={() => undefined}
                />
            </CratisComponentsProvider>,
        );
    });
    it('should use explicit labels for the requested page window', () => {
        Array.from(container.querySelectorAll('[data-cratis-part="page"]'))
            .map((button) => button.getAttribute('aria-label'))
            .should.deep.equal(['Explicit 1', 'Explicit 6', 'Explicit 12']);
        container
            .querySelectorAll('[role="group"][aria-label="Explicit pages"]')
            .length.should.equal(1);
    });
});

describe('when legacy locale messages are also configured', () => {
    let container: HTMLDivElement;
    beforeEach(() => {
        container = document.createElement('div');
        container.innerHTML = renderToStaticMarkup(
            <CratisComponentsProvider
                value={{
                    locale: 'en',
                    locales: { en: { aria: { navigation: 'Legacy navigation' } } },
                    messages: {
                        paginator: {
                            page: (number) => `Demo ${number}`,
                            pages: 'Demo pages',
                        },
                    },
                }}
            >
                <TablePaginator
                    page={0}
                    pageCount={1}
                    pageLinks
                    onPageChange={() => undefined}
                />
            </CratisComponentsProvider>,
        );
    });
    it('should retain the configured numbered-page messages', () => {
        container.querySelectorAll('button[aria-label="Demo 1"]').length.should.equal(1);
        container
            .querySelectorAll('[role="group"][aria-label="Demo pages"]')
            .length.should.equal(1);
    });
});
