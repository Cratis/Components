// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Column } from '../Column';
import { DataTableCore, type DataTableCoreProps } from '../DataTableCore';
import { DataTableRowProcessing } from '../DataTableRowProcessing';
import { DataTableStatus } from '../DataTableStatus';

const typeInto = (input: HTMLInputElement, text: string) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
};

describe('when a search leaves no rows', () => {
    let container: HTMLDivElement;
    let root: Root;

    const render = async (props: Partial<DataTableCoreProps<{ name: string }>> = {}, providerMessages?: object) => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider value={providerMessages ? { messages: providerMessages } : undefined}>
                    <DataTableCore
                        data={[{ name: 'Example row' }]}
                        emptyMessage='No rows'
                        globalFilterFields={['name']}
                        {...props}
                    >
                        <Column field='name' header='Name' />
                    </DataTableCore>
                </CratisComponentsProvider>,
            );
        });
    };
    const search = async (text: string) => {
        await act(async () => typeInto(container.querySelector<HTMLInputElement>('[data-cratis-part="search-input"]')!, text));
    };
    const empty = () => container.querySelector('[data-cratis-part="empty-cell"]')?.textContent;

    beforeEach(() => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should show the empty message while no search is active', async () => {
        await render({ data: [] });
        expect(empty()).to.equal('No rows');
    });

    it('should show the loaded-page default that says only this page was searched', async () => {
        await render();
        await search('nothing');
        expect(empty()).to.equal('No rows on this page match the search.');
    });

    it('should show the neutral default when the server applies the search', async () => {
        await render({ data: [], rowProcessing: DataTableRowProcessing.None });
        await search('nothing');
        expect(empty()).to.equal('No rows match the search.');
    });

    it('should show the filtered empty message when one is given', async () => {
        await render({ filteredEmptyMessage: 'Nothing matched' });
        await search('nothing');
        expect(empty()).to.equal('Nothing matched');
    });

    it('should show the provider message when no prop is given', async () => {
        await render({}, { dataTable: { filteredEmpty: 'Provider says none' } });
        await search('nothing');
        expect(empty()).to.equal('Provider says none');
    });

    it('should show the rows again once the search is cleared', async () => {
        await render();
        await search('nothing');
        await search('');
        expect(empty()).to.equal(undefined);
        expect(container.textContent).to.contain('Example row');
    });

    it('should show the empty message in server mode when filters hold only placeholder values', async () => {
        await render({
            data: [],
            rowProcessing: DataTableRowProcessing.None,
            defaultFilters: { name: { value: null } },
        });
        expect(empty()).to.equal('No rows');
    });

    it('should show the neutral default in server mode when a column filter has a value', async () => {
        await render({
            data: [],
            rowProcessing: DataTableRowProcessing.None,
            defaultFilters: { name: { value: 'nothing' } },
        });
        expect(empty()).to.equal('No rows match the search.');
    });

    it('should show the failure message instead of the filtered empty message', async () => {
        await render({ status: DataTableStatus.Failed, failureMessage: 'Failed to load' });
        await search('nothing');
        expect(container.querySelector('[data-reason="failed"]')?.textContent).to.equal('Failed to load');
        expect(empty()).to.equal(undefined);
    });
});
