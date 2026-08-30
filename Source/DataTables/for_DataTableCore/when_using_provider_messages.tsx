// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Column } from '../Column';
import { DataTableCore } from '../DataTableCore';

/**
 * Precedence coverage for the `dataTable` provider message group: a named component prop
 * (`selectionAriaLabel`, `globalSearchPlaceholder`, `globalSearchAriaLabel`) wins, then the
 * provider message, then the English fallback.
 */
describe('when DataTableCore uses provider messages', () => {
    let container: HTMLDivElement;
    let root: Root;

    const render = async (element: React.ReactElement) => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => {
            root.render(element);
        });
    };

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const searchInput = () =>
        container.querySelector<HTMLInputElement>('[data-cratis-part="search-input"]');
    const selectionInput = () =>
        container.querySelector<HTMLInputElement>('input[type="radio"]');

    it('should use the English fallback with no provider and no prop override', async () => {
        await render(
            <CratisComponentsProvider>
                <DataTableCore
                    data={[{ name: 'Sample User' }]}
                    dataKey='name'
                    emptyMessage='No people'
                    globalFilterFields={['name']}
                    selectionMode='single'
                >
                    <Column field='name' header='Name' />
                    <Column selectionMode='single' />
                </DataTableCore>
            </CratisComponentsProvider>,
        );
        expect(searchInput()?.placeholder).to.equal('Search\u2026');
        expect(searchInput()?.getAttribute('aria-label')).to.equal('Search table');
        expect(selectionInput()?.getAttribute('aria-label')).to.equal('Select row');
    });

    it('should use the provider message when no prop override is given', async () => {
        await render(
            <CratisComponentsProvider
                value={{
                    messages: {
                        dataTable: {
                            selectRow: 'Provider Select Row',
                            search: 'Provider Search',
                            searchAriaLabel: 'Provider Search Aria',
                        },
                    },
                }}
            >
                <DataTableCore
                    data={[{ name: 'Sample User' }]}
                    dataKey='name'
                    emptyMessage='No people'
                    globalFilterFields={['name']}
                    selectionMode='single'
                >
                    <Column field='name' header='Name' />
                    <Column selectionMode='single' />
                </DataTableCore>
            </CratisComponentsProvider>,
        );
        expect(searchInput()?.placeholder).to.equal('Provider Search');
        expect(searchInput()?.getAttribute('aria-label')).to.equal('Provider Search Aria');
        expect(selectionInput()?.getAttribute('aria-label')).to.equal('Provider Select Row');
    });

    it('should prefer a named prop override over the provider message', async () => {
        await render(
            <CratisComponentsProvider
                value={{
                    messages: {
                        dataTable: {
                            selectRow: 'Provider Select Row',
                            search: 'Provider Search',
                            searchAriaLabel: 'Provider Search Aria',
                        },
                    },
                }}
            >
                <DataTableCore
                    data={[{ name: 'Sample User' }]}
                    dataKey='name'
                    emptyMessage='No people'
                    globalFilterFields={['name']}
                    globalSearchPlaceholder='Explicit Search'
                    globalSearchAriaLabel='Explicit Search Aria'
                    selectionAriaLabel='Explicit Select Row'
                    selectionMode='single'
                >
                    <Column field='name' header='Name' />
                    <Column selectionMode='single' />
                </DataTableCore>
            </CratisComponentsProvider>,
        );
        expect(searchInput()?.placeholder).to.equal('Explicit Search');
        expect(searchInput()?.getAttribute('aria-label')).to.equal('Explicit Search Aria');
        expect(selectionInput()?.getAttribute('aria-label')).to.equal('Explicit Select Row');
    });
});
