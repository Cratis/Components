// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Column } from '../Column';
import { DataTableCore } from '../DataTableCore';
import { DataTableStatus } from '../DataTableStatus';

const row = { name: 'Sample row' };
let container: HTMLDivElement;
let root: Root;

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

const renderTable = async (
    status: DataTableStatus,
    data: typeof row[] = [],
    messages?: { loading?: string; failed?: string; unauthorized?: string },
    overrides?: { loadingMessage?: string; failureMessage?: string; unauthorizedMessage?: string },
) => {
    await act(async () => {
        root.render(
            <CratisComponentsProvider value={{ messages: { dataTable: messages } }}>
                <DataTableCore data={data} status={status} emptyMessage='No rows'
                    pt={{ loadingRow: { title: 'Loading row' }, loadingCell: { title: 'Loading cell' }, failureRow: { title: 'Failure row' }, failureCell: { title: 'Failure cell' } }}
                    {...overrides}>
                    <Column field='name' header='Name' />
                </DataTableCore>
            </CratisComponentsProvider>,
        );
    });
};

describe('when rendering loading without rows', () => {
    beforeEach(async () => renderTable(DataTableStatus.Loading));

    it('should show the loading row, cell and status without an empty row', () => {
        expect(container.querySelector('[data-cratis-part="loading-row"]')?.getAttribute('title')).to.equal('Loading row');
        expect(container.querySelector('[data-cratis-part="loading-cell"]')?.getAttribute('title')).to.equal('Loading cell');
        expect(container.querySelector('[role="status"]')?.textContent).to.equal('Loading…');
        expect(container.querySelector('tr[role="status"]')).to.equal(null);
        expect(container.querySelector('[data-cratis-part="empty-row"]')).to.equal(null);
    });
});

describe('when rendering failure', () => {
    beforeEach(async () => renderTable(DataTableStatus.Failed, [row]));

    it('should show a failure row and alert instead of stale rows', () => {
        expect(container.querySelector('[data-cratis-part="failure-row"]')?.getAttribute('data-reason')).to.equal('failed');
        expect(container.querySelector('[data-cratis-part="failure-cell"]')?.getAttribute('title')).to.equal('Failure cell');
        expect(container.querySelector('[role="alert"]')?.textContent).to.equal('Could not load data.');
        expect(container.querySelector('tr[role="alert"]')).to.equal(null);
        expect(container.querySelector('[data-cratis-part="row"]')).to.equal(null);
    });
});

describe('when rendering unauthorized', () => {
    beforeEach(async () => renderTable(DataTableStatus.Unauthorized));

    it('should show an unauthorized alert', () => {
        expect(container.querySelector('[data-cratis-part="failure-row"]')?.getAttribute('data-reason')).to.equal('unauthorized');
        expect(container.querySelector('[role="alert"]')?.textContent).to.equal('You are not authorized to view this data.');
    });
});

describe('when refetching with rows', () => {
    beforeEach(async () => renderTable(DataTableStatus.Loading, [row]));

    it('should preserve the rows and mark the table busy', () => {
        expect(container.querySelector('[data-cratis-part="row"]')?.textContent).to.equal('Sample row');
        expect(container.querySelector('table')?.getAttribute('aria-busy')).to.equal('true');
        expect(container.querySelector('[data-cratis-part="root"]')?.getAttribute('data-busy')).to.equal('true');
        expect(container.querySelector('[data-cratis-part="loading-row"]')).to.equal(null);
    });
});

describe('when using provider messages', () => {
    beforeEach(async () => renderTable(DataTableStatus.Failed, [], { failed: 'Provider failure' }));

    it('should show the provider message', () => {
        expect(container.querySelector('[role="alert"]')?.textContent).to.equal('Provider failure');
    });
});

describe('when overriding provider messages', () => {
    beforeEach(async () => renderTable(DataTableStatus.Unauthorized, [], { unauthorized: 'Provider denial' }, { unauthorizedMessage: 'Custom denial' }));

    it('should prefer the per-table message', () => {
        expect(container.querySelector('[role="alert"]')?.textContent).to.equal('Custom denial');
    });
});

describe('when loading with a provider message', () => {
    beforeEach(async () => renderTable(DataTableStatus.Loading, [], { loading: 'Provider loading' }));

    it('should show the provider message', () => {
        expect(container.querySelector('[role="status"]')?.textContent).to.equal('Provider loading');
    });
});
