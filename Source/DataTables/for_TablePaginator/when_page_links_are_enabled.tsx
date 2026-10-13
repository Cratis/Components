// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import sinon from 'sinon';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { TablePaginator } from '../TablePaginator';

describe('when page links are enabled', () => {
    let container: HTMLDivElement;
    let root: Root;
    let buttons: HTMLButtonElement[];
    const onPageChange = sinon.spy();

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        onPageChange.resetHistory();
        await act(async () => {
            root.render(
                <CratisComponentsProvider
                    value={{
                        messages: {
                            paginator: {
                                page: (page) => `Demo page ${page}`,
                                pages: 'Demo pages',
                            },
                        },
                    }}
                >
                    <TablePaginator
                        page={5}
                        pageCount={12}
                        pageLinks
                        onPageChange={onPageChange}
                        pt={{
                            pages: { className: 'custom-pages' },
                            page: { className: 'custom-page' },
                            ellipsis: { className: 'custom-ellipsis' },
                        }}
                    />
                </CratisComponentsProvider>,
            );
        });
        buttons = Array.from(
            container.querySelectorAll<HTMLButtonElement>('[data-cratis-part="page"]'),
        );
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should render numbered pages between previous and next', () => {
        Array.from(container.querySelectorAll('button'))
            .map((button) => button.textContent)
            .should.deep.equal(['«', '‹', '1', '5', '6', '7', '12', '›', '»']);
    });
    it('should mark only the current page as current and selected', () => {
        buttons
            .filter((button) => button.getAttribute('aria-current') === 'page')
            .map((button) => button.textContent)
            .should.deep.equal(['6']);
        buttons
            .filter((button) => button.hasAttribute('data-selected'))
            .map((button) => button.textContent)
            .should.deep.equal(['6']);
    });
    it('should use localized one-based page labels', () => {
        buttons
            .map((button) => button.getAttribute('aria-label'))
            .should.deep.equal([
                'Demo page 1',
                'Demo page 5',
                'Demo page 6',
                'Demo page 7',
                'Demo page 12',
            ]);
    });
    it('should omit the info report', () => {
        container.querySelectorAll('[data-cratis-part="info"]').length.should.equal(0);
    });
    it('should expose paginator-owned parts and hide non-interactive ellipses', () => {
        container
            .querySelectorAll('.custom-pages[aria-label="Demo pages"]')
            .length.should.equal(1);
        container.querySelectorAll('button.custom-page').length.should.equal(5);
        container
            .querySelectorAll('span.custom-ellipsis[aria-hidden="true"]')
            .length.should.equal(2);
    });
    it('should request a zero-based page when clicked', async () => {
        await act(async () => buttons[3].click());
        onPageChange.calledOnceWithExactly(6).should.equal(true);
    });
});
