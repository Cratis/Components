// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Dropdown } from '../Dropdown';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';

/**
 * The Cratis convention displays `option.label` and compares `option.value` when no
 * explicit field names are supplied, preserving the everyday `{ label, value }` shape
 * independently of the internal select implementation.
 */
describe('when options carry label and value', () => {
    let root: Root;
    let container: HTMLDivElement;
    let triggerText: string;

    beforeEach(async () => {
        // SAFETY: React's test-environment flag and ResizeObserver polyfill are test-only globals absent from jsdom typings.
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        // SAFETY: The overlay implementation only needs the observer methods supplied by this jsdom polyfill.
        (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
            observe() { } unobserve() { } disconnect() { }
        };

        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);

        await act(async () => {
            root.render(React.createElement(CratisComponentsProvider, {
                children: React.createElement(Dropdown, {
                    value: 'new',
                    options: [{ label: 'New project', value: 'new' }, { label: 'Sample', value: 'sample' }],
                })
            }));
        });

        triggerText = container.querySelector('[data-cratis-part="value"]')?.textContent ?? '';
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should show the label of the selected option', () => {
        triggerText.should.equal('New project');
    });
});
