// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Column } from '../Column';
import { DataTableCore } from '../DataTableCore';

interface Row {
    id: number;
    name: string;
}

describe('when a configured search field is inherited', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        const row = Object.assign(Object.create({ secret: 'match' }), {
            id: 1,
            name: 'Visible value',
        }) as Row;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => {
            root.render(
                <DataTableCore<Row>
                    data={[row]}
                    emptyMessage='No rows'
                    globalFilterFields={['secret']}
                >
                    <Column<Row> field='name' header='Name' />
                </DataTableCore>,
            );
        });

        const search = container.querySelector<HTMLInputElement>(
            '[data-cratis-part="search-input"]',
        )!;
        await act(async () => {
            const setValue = Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                'value',
            )!.set!;
            setValue.call(search, 'match');
            search.dispatchEvent(new Event('input', { bubbles: true }));
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should not expose prototype-chain data to search', () => {
        expect(container.querySelectorAll('[data-cratis-part="row"]')).to.have.length(0);
        expect(container.textContent).to.contain('No rows');
    });
});
