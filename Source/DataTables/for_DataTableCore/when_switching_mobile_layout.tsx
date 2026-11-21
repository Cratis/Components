// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { should } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { Column } from '../Column';
import { DataTableCore, type DataTableCoreProps } from '../DataTableCore';
import { aMobileViewport } from './given/a_mobile_viewport';

should();

describe('when switching mobile layout', () => {
    let container: HTMLDivElement;
    let root: Root;
    let viewport: ReturnType<typeof aMobileViewport>;
    const onSortChange = vi.fn();
    const render = async (props: Partial<DataTableCoreProps<{ name: string }>> = {}) => {
        await act(async () => root.render(
            <DataTableCore data={[{ name: 'Example Project' }]} emptyMessage='No rows' mobileLayout='cards' onSortChange={onSortChange} {...props}>
                <Column field='name' header={<strong>Name</strong>} sortable />
            </DataTableCore>,
        ));
    };

    beforeEach(() => {
        (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        viewport = aMobileViewport();
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });
    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
        onSortChange.mockReset();
    });

    it('should show labeled values in a semantic list below the default threshold', async () => {
        await render();
        container.querySelectorAll('ul > li dl dt strong').length.should.equal(1);
    });
    it('should keep the table when cards are not requested', async () => {
        await render({ mobileLayout: undefined });
        container.querySelectorAll('table').length.should.equal(1);
    });
    it('should keep the table when only a breakpoint is supplied', async () => {
        await render({ mobileLayout: undefined, mobileBreakpoint: 900 });
        container.querySelectorAll('table').length.should.equal(1);
    });
    it('should restore the table at the exact boundary without changing sort', async () => {
        await render();
        await act(async () => viewport.resize(640));
        container.querySelectorAll('table').length.should.equal(1);
        onSortChange.mock.calls.length.should.equal(0);
    });
    it.each([0, -10, NaN, Infinity])('should use the default for invalid breakpoint %s', async (mobileBreakpoint) => {
        await render({ mobileBreakpoint });
        container.querySelectorAll('ul').length.should.equal(1);
    });
    it('should resubscribe when the threshold changes', async () => {
        await render({ mobileBreakpoint: 600 });
        await render({ mobileBreakpoint: 700 });
        viewport.listenerCount().should.equal(1);
        container.querySelectorAll('ul').length.should.equal(1);
    });
    it('should keep uncontrolled sort and its order when the viewport changes', async () => {
        await render();
        await act(async () => container.querySelector<HTMLButtonElement>('[data-cratis-part="sort"]')!.click());
        await act(async () => viewport.resize(640));
        container.querySelector('th')!.getAttribute('aria-sort')!.should.equal('ascending');
    });
    it('should report only the user sort change and not the layout switch', async () => {
        await render();
        await act(async () => container.querySelector<HTMLButtonElement>('[data-cratis-part="sort"]')!.click());
        await act(async () => viewport.resize(640));
        onSortChange.mock.calls.length.should.equal(1);
    });
    it('should unsubscribe when the opt-in is disabled', async () => {
        await render();
        await render({ mobileLayout: undefined });
        viewport.listenerCount().should.equal(0);
    });
    it('should safely use the table without matchMedia', async () => {
        vi.stubGlobal('matchMedia', undefined);
        await render();
        container.querySelectorAll('table').length.should.equal(1);
    });
    it('should release the viewport listener on unmount', async () => {
        await render();
        await act(async () => root.unmount());
        viewport.listenerCount().should.equal(0);
    });
});
