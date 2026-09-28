// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createRef } from 'react';
import { act } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { FilterPanel } from '../FilterPanel';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';

const anchorRef = createRef<HTMLButtonElement>();
const noOp = () => undefined;
const element = (
    <FilterPanel
        isOpen
        filters={[]}
        filterValues={{}}
        rangeValues={{}}
        anchorRef={anchorRef}
        onClose={noOp}
        onFilterToggle={noOp}
        onFilterClear={noOp}
        onRangeChange={noOp}
        onExpandedFilterChange={noOp}
    />
);

describe('when hydrating an initially open FilterPanel', () => {
    let container: HTMLDivElement;
    let root: Root;
    const hydrationErrors: string[] = [];
    const originalConsoleError = console.error;

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        vi.spyOn(console, 'error').mockImplementation((...values: unknown[]) => {
            const message = values.map(String).join(' ');
            if (/hydration|did not match|server rendered/i.test(message)) {
                hydrationErrors.push(message);
            } else {
                originalConsoleError(...values);
            }
        });

        container = document.createElement('div');
        const serverDocument = new DOMParser().parseFromString(
            renderToString(element),
            'text/html',
        );
        container.append(...Array.from(serverDocument.body.childNodes));
        document.body.append(container);

        await act(async () => {
            root = hydrateRoot(container, element);
            await new Promise((resolve) => setTimeout(resolve, 50));
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        vi.restoreAllMocks();
        hydrationErrors.length = 0;
    });

    it('should_preserve_the_server_tree_through_the_first_client_render', () => {
        expect(hydrationErrors).to.deep.equal([]);
    });

    it('should_mount_the_open_panel_after_hydration', () => {
        expect(document.querySelector('.pv-filter-dropdown')).not.to.equal(null);
    });

    it('should_focus_the_open_panel_after_hydration', () => {
        expect(document.activeElement).to.equal(document.querySelector('.pv-filter-dropdown'));
    });
});

describe('when hydrating an open panel before its custom overlay container exists', () => {
    let host: HTMLDivElement;
    let overlayRoot: HTMLDivElement;
    let hydratedRoot: Root;
    let available: boolean;
    const getContainer = vi.fn(() => available ? overlayRoot : null);
    const renderPanel = () => (
        <CratisComponentsProvider overlayEnvironment={{ getContainer }}>
            <FilterPanel isOpen filters={[]} filterValues={{}} rangeValues={{}}
                anchorRef={anchorRef} onClose={noOp} onFilterToggle={noOp}
                onFilterClear={noOp} onRangeChange={noOp}
                onExpandedFilterChange={noOp} />
        </CratisComponentsProvider>
    );

    beforeEach(() => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        available = false;
        getContainer.mockClear();
        host = document.createElement('div');
        overlayRoot = document.createElement('div');
        document.body.append(host, overlayRoot);
    });
    afterEach(async () => {
        if (hydratedRoot) await act(async () => hydratedRoot.unmount());
        host.remove();
        overlayRoot.remove();
    });

    it('should defer until available after hydration rather than render to body', async () => {
        host.innerHTML = renderToString(renderPanel());
        expect(getContainer.mock.calls.length).to.equal(0);
        await act(async () => {
            hydratedRoot = hydrateRoot(host, renderPanel());
            await new Promise((resolve) => setTimeout(resolve, 50));
        });
        expect(document.querySelector('.pv-filter-dropdown')).to.equal(null);
        available = true;
        await act(async () => hydratedRoot.render(renderPanel()));
        const panel = overlayRoot.querySelector('.pv-filter-dropdown');
        expect(panel).not.to.equal(null);
        expect(document.activeElement).to.equal(panel);
    });
});
