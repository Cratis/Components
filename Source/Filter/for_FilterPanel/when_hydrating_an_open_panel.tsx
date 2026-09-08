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
});
