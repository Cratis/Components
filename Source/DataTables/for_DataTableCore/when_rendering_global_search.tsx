// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Column } from '../Column';
import { DataTableCore } from '../DataTableCore';

describe('when rendering global search', () => {
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
                    data={[{ name: 'Sample User' }]}
                    emptyMessage='No people'
                    globalFilterFields={['name']}
                    globalSearchPlaceholder='Find people'
                    globalSearchAriaLabel='Search people'
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

    it('should give the search control a name independent of its placeholder', () => {
        const input = container.querySelector<HTMLInputElement>(
            '[data-cratis-part="search-input"]',
        );
        expect(input?.placeholder).to.equal('Find people');
        expect(input?.getAttribute('aria-label')).to.equal('Search people');
    });
});
