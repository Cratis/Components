// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { should } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ObservableQueryFor } from '@cratis/arc/queries';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { Column } from '../Column';
import { DataTableForObservableQuery } from '../DataTableForObservableQuery';
import { aMobileViewport } from '../for_DataTableCore/given/a_mobile_viewport';

should();
interface Row { id: number; name: string }
class ExampleQuery extends ObservableQueryFor<Row[], object> {
    readonly route = '/api/examples';
    readonly defaultValue: Row[] = [];
    readonly parameterDescriptors = [];
    get requiredRequestParameters() { return []; }
    constructor() { super(Object, false); }
}
const controls = vi.hoisted(() => ({
    page: vi.fn(), sort: vi.fn(), args: vi.fn(),
    data: [{ id: 1, name: 'Example Project' }],
}));
vi.mock('@cratis/arc.react/queries', () => ({
    useObservableQueryWithPaging: () => [{
        data: controls.data, isSuccess: true, isAuthorized: true, isValid: true,
        isPerforming: false, hasExceptions: false, paging: { page: 0, size: 20, totalItems: 40, totalPages: 2 },
    }, controls.page, controls.sort, controls.args],
}));

describe('when switching observable query mobile layout', () => {
    let container: HTMLDivElement;
    let root: Root;
    let viewport: ReturnType<typeof aMobileViewport>;
    const render = async () => {
        await act(async () => root.render(
            <DataTableForObservableQuery<ExampleQuery, Row, object> query={ExampleQuery} emptyMessage='No rows' mobileLayout='cards' mobileBreakpoint={768}>
                <Column field='name' header='Project' sortable />
            </DataTableForObservableQuery>,
        ));
    };
    beforeEach(async () => {
        (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        controls.data = [{ id: 1, name: 'Example Project' }];
        viewport = aMobileViewport(700);
        vi.stubGlobal('ResizeObserver', class { observe() { /* No layout in jsdom. */ } disconnect() { /* No layout in jsdom. */ } });
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await render();
        vi.clearAllMocks();
    });
    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
    });
    it('should forward the custom breakpoint to cards', () => {
        container.querySelectorAll('ul > li').length.should.equal(1);
    });
    it('should render an incoming result in the active presentation', async () => {
        controls.data = [{ id: 2, name: 'Demo Project' }];
        await render();
        container.querySelector('li dd')!.textContent!.should.equal('Demo Project');
    });
    it('should not change page, sort or query arguments on resize', async () => {
        await act(async () => viewport.resize(768));
        [...controls.page.mock.calls, ...controls.sort.mock.calls, ...controls.args.mock.calls].should.have.lengthOf(0);
    });
});
