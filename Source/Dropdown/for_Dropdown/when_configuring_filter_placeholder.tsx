// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Dropdown } from '../Dropdown';

describe('when configuring the filter placeholder', () => {
    let container: HTMLDivElement;
    let root: Root;
    let filterInput: HTMLInputElement;

    beforeEach(async () => {
        // SAFETY: React's test-environment flag is an intentionally undocumented global absent from the DOM typings.
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        // SAFETY: jsdom omits ResizeObserver, while PrimeReact only calls its three observer methods.
        (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
            observe() {
                return undefined;
            }
            unobserve() {
                return undefined;
            }
            disconnect() {
                return undefined;
            }
        };
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <Dropdown
                        options={[{ label: 'Frontend developer', value: 'frontend' }]}
                        placeholder='Select a role'
                        filter
                        filterPlaceholder='Search roles'
                    />
                </CratisComponentsProvider>,
            );
        });

        const trigger = container.querySelector<HTMLButtonElement>(
            '[data-scope="select"][data-part="trigger"]',
        );
        if (!trigger) {
            throw new Error('Dropdown did not render its trigger.');
        }
        await act(async () => trigger.click());

        const renderedFilter = document.querySelector<HTMLInputElement>(
            '[data-scope="select"][data-part="filter"]',
        );
        if (!renderedFilter) {
            throw new Error('Dropdown did not render its filter input.');
        }
        filterInput = renderedFilter;
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should preserve the independently configured placeholder', () => {
        expect(filterInput.placeholder).to.equal('Search roles');
    });
});
