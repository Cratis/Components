// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { Tooltip } from '../Tooltip';

describe('when rendering rich tooltip content', () => {
    let container: HTMLDivElement;
    let root: Root;
    let popup: Element | null;

    beforeEach(async () => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
            observe() { return undefined; }
            unobserve() { return undefined; }
            disconnect() { return undefined; }
        };
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <Tooltip content={<><strong>Details</strong><span> for this item</span></>}>
                        <button type='button'>Show details</button>
                    </Tooltip>
                </CratisComponentsProvider>,
            );
        });
        await act(async () => container.querySelector('button')?.focus());
        popup = document.querySelector('[data-cratis-part="popup"]');
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should render the React node in the popup', () => {
        expect(popup?.querySelector('strong')?.textContent).to.equal('Details');
        expect(popup?.textContent).to.equal('Details for this item');
    });
});
