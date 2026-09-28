// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { FilterPanel } from '../FilterPanel';

const anchorRef = createRef<HTMLButtonElement>();
const noOp = () => undefined;
let host: HTMLDivElement;
let root: Root;

const panelMaxHeight = () => parseFloat(document.querySelector<HTMLElement>('.pv-filter-dropdown')!.style.maxHeight);

const renderOpenPanel = async () => {
    await act(async () => root.render(<>
        <button ref={anchorRef} type='button'>Filters</button>
        <FilterPanel isOpen filters={[]} filterValues={{}} rangeValues={{}}
            anchorRef={anchorRef} onClose={noOp} onFilterToggle={noOp}
            onFilterClear={noOp} onRangeChange={noOp} onExpandedFilterChange={noOp} />
    </>));
};

describe('when measuring the viewport of a page in quirks mode', () => {
    beforeEach(async () => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        // In quirks mode the root element's client size is its own box, which can exceed the
        // viewport; the viewport's client size is reported on the body instead.
        vi.spyOn(document, 'compatMode', 'get').mockReturnValue('BackCompat');
        vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1024);
        vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(5000);
        vi.spyOn(document.body, 'clientWidth', 'get').mockReturnValue(1024);
        vi.spyOn(document.body, 'clientHeight', 'get').mockReturnValue(600);
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
            if (this === anchorRef.current) {
                return { left: 100, top: 56, right: 140, bottom: 80, width: 40, height: 24 } as DOMRect;
            }
            return { left: 0, top: 0, right: 1, bottom: 0, width: 1, height: 1 } as DOMRect;
        });
        host = document.createElement('div');
        document.body.append(host);
        root = createRoot(host);
        await renderOpenPanel();
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        host.remove();
        vi.restoreAllMocks();
    });

    it('should keep the panel within the viewport height the body reports', () => {
        expect(panelMaxHeight()).to.be.greaterThan(0);
        expect(panelMaxHeight()).to.be.lessThan(600);
    });
});
