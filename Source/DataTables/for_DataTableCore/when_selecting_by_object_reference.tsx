// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Column } from '../Column';
import { DataTableCore } from '../DataTableCore';

describe('when selecting by object reference', () => {
    const selected = { name: 'Ada' };
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => {
            root.render(
                <DataTableCore
                    data={[selected, { name: 'Grace' }]}
                    emptyMessage='No people'
                    selectionMode='single'
                    selection={selected}
                >
                    <Column field='name' header='Name' />
                </DataTableCore>,
            );
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should mark the referenced row selected without a data key', () => {
        expect(
            container.querySelector('[data-cratis-part="row"]')?.getAttribute(
                'aria-selected',
            ),
        ).to.equal('true');
    });
});
