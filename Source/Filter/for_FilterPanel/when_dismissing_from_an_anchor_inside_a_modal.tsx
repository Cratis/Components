// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, createRef } from 'react';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { Dialog } from '../../Dialogs/Dialog';
import { type DialogInTheDom, render, unmount } from '../../Dialogs/for_Dialog/given/a_dialog_in_the_dom';
import { FilterPanel } from '../FilterPanel';

const anchorRef = createRef<HTMLButtonElement>();

describe('when dismissing a filter panel from its anchor inside a modal dialog', () => {
    let mounted: DialogInTheDom;
    const onFilterClose = vi.fn();
    const onModalCancel = vi.fn();

    beforeEach(async () => {
        onFilterClose.mockReset();
        onModalCancel.mockReset();
        mounted = await render(<Dialog title='Edit filters' onCancel={onModalCancel}>
            <button ref={anchorRef} type='button'>Filters</button>
            <FilterPanel isOpen filters={[]} filterValues={{}} rangeValues={{}}
                anchorRef={anchorRef} onClose={onFilterClose} onFilterToggle={() => undefined}
                onFilterClear={() => undefined} onRangeChange={() => undefined}
                onExpandedFilterChange={() => undefined} />
        </Dialog>);
        anchorRef.current!.focus();
        await act(async () => anchorRef.current!.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
        ));
    });

    afterEach(async () => {
        await unmount(mounted);
    });

    it('should close only the filter panel and retain focus on its anchor', () => {
        expect(onFilterClose.mock.calls.length).to.equal(1);
        expect(onModalCancel.mock.calls.length).to.equal(0);
        expect(document.activeElement).to.equal(anchorRef.current);
    });
});
