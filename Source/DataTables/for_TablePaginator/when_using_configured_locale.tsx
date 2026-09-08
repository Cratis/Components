// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { TablePaginator } from '../TablePaginator';

describe('when using the configured locale', () => {
    let container: HTMLDivElement;
    let root: Root;
    let navigation: HTMLElement;
    let buttonLabels: Array<string | null>;
    let firstButton: HTMLButtonElement;

    beforeEach(async () => {
        // SAFETY: React's test-environment flag is an intentionally undocumented global absent from the DOM typings.
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                <CratisComponentsProvider
                    value={{
                        locale: 'test',
                        messages: {
                            paginator: {
                                navigation: 'Sidenavigasjon',
                                first: 'Første side',
                                previous: 'Forrige side',
                                next: 'Neste side',
                                last: 'Siste side',
                            },
                        },
                    }}
                >
                    <TablePaginator
                        page={1}
                        pageCount={3}
                        onPageChange={() => undefined}
                        ariaLabels={{ next: 'Explicit next' }}
                        pt={{
                            root: { className: 'product-paginator' },
                            info: { className: 'product-paginator-info' },
                            first: {
                                root: { className: 'product-paginator-button' },
                            },
                        }}
                    />
                </CratisComponentsProvider>,
            );
        });

        const renderedNavigation = container.querySelector<HTMLElement>(
            '.cratis-table-paginator',
        );
        if (!renderedNavigation) {
            throw new Error('TablePaginator did not render its navigation.');
        }
        navigation = renderedNavigation;
        const buttons = Array.from(navigation.querySelectorAll('button'));
        buttonLabels = buttons.map((button) => button.getAttribute('aria-label'));
        [firstButton] = buttons;
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should localize the navigation label', () => {
        expect(navigation.getAttribute('aria-label')).to.equal('Sidenavigasjon');
    });

    it('should localize the paginator controls', () => {
        expect(buttonLabels).to.deep.equal([
            'Første side',
            'Forrige side',
            'Explicit next',
            'Siste side',
        ]);
    });

    it('should apply Cratis-owned paginator parts', () => {
        expect(navigation.classList.contains('product-paginator')).to.equal(true);
        expect(
            navigation
                .querySelector('[data-cratis-part="info"]')
                ?.classList.contains('product-paginator-info'),
        ).to.equal(true);
        expect(firstButton.classList.contains('product-paginator-button')).to.equal(true);
    });
});
