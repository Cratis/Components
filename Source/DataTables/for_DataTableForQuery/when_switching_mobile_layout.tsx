// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { should } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryFor } from '@cratis/arc/queries';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { Column } from '../Column';
import { DataTableForQuery } from '../DataTableForQuery';
import { aMobileViewport } from '../for_DataTableCore/given/a_mobile_viewport';

should();
interface Row { id: number; name: string }
class ExampleQuery extends QueryFor<Row[], object> {
    readonly route = '/api/examples';
    readonly defaultValue: Row[] = [];
    readonly parameterDescriptors = [];
    get requiredRequestParameters() { return []; }
    constructor() { super(Object, true); }
}
const controls = vi.hoisted(() => ({ page: vi.fn(), sort: vi.fn(), args: vi.fn() }));
vi.mock('@cratis/arc.react/queries', () => ({
    useQueryWithPaging: () => [{
        data: [{ id: 1, name: 'Example Project' }], isSuccess: true, isAuthorized: true, isValid: true,
        isPerforming: false, hasExceptions: false, paging: { page: 0, size: 20, totalItems: 40, totalPages: 2 },
    }, controls.page, controls.sort, controls.args],
}));

describe('when switching snapshot query mobile layout', () => {
    let container: HTMLDivElement;
    let root: Root;
    let viewport: ReturnType<typeof aMobileViewport>;
    beforeEach(async () => {
        (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        viewport = aMobileViewport(700);
        vi.stubGlobal('ResizeObserver', class { observe() { /* No layout in jsdom. */ } disconnect() { /* No layout in jsdom. */ } });
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => root.render(
            <DataTableForQuery<ExampleQuery, Row, object> query={ExampleQuery} emptyMessage='No rows' mobileLayout='cards' mobileBreakpoint={768}>
                <Column field='name' header='Project' sortable />
            </DataTableForQuery>,
        ));
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
    it('should retain the same paginator during a resize', async () => {
        const paginator = container.querySelector('[data-cratis-component="TablePaginator"]');
        await act(async () => viewport.resize(768));
        (paginator !== null && container.querySelector('[data-cratis-component="TablePaginator"]') === paginator).should.equal(true);
    });
    it('should not change page, sort or query arguments on resize', async () => {
        await act(async () => viewport.resize(768));
        [...controls.page.mock.calls, ...controls.sort.mock.calls, ...controls.args.mock.calls].should.have.lengthOf(0);
    });
});
