// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { vi } from 'vitest';
import {
    aDataPage,
    actionBar,
    type DataPageInTheDom,
    layoutRoot,
    layoutRootChildren,
    layoutRoots,
    paginator,
    paneLayouts,
    render,
    scrollRegion,
    tableRegion,
    unmount
} from './given/a_data_page';

vi.mock('@cratis/arc.react/queries', async () => {
    const { arcQueryHooks } = await import('./given/a_paged_query_result');
    return arcQueryHooks();
});

describe('when rendered with menu items', () => {
    let page: DataPageInTheDom;

    beforeEach(async () => {
        page = await render(aDataPage({ withMenuItems: true }));
    });

    afterEach(async () => {
        await unmount(page);
    });

    it('should render a single layout root', () => {
        layoutRoots(page).should.have.lengthOf(1);
    });

    it('should lay the page out as a column', () => {
        layoutRoot(page).style.display.should.equal('flex');
        layoutRoot(page).style.flexDirection.should.equal('column');
    });

    it('should give the layout root a definite height', () => {
        layoutRoot(page).style.height.should.equal('100%');
    });

    it('should let the layout root shrink below its content', () => {
        layoutRoot(page).style.minHeight.should.equal('0px');
    });

    it('should stack the action bar above the table region', () => {
        layoutRootChildren(page).should.deep.equal(['cratis-data-page-actions', 'cratis-data-page-table']);
    });

    it('should keep the action bar at its intrinsic height', () => {
        actionBar(page)!.style.flexShrink.should.equal('0');
    });

    it('should let the table region absorb the remaining height', () => {
        tableRegion(page).style.flexGrow.should.equal('1');
        tableRegion(page).style.flexBasis.should.equal('0px');
    });

    it('should let the table region shrink below its content', () => {
        tableRegion(page).style.minHeight.should.equal('0px');
    });

    it('should not mount a split view for a page with nothing to split', () => {
        paneLayouts(page).should.deep.equal([]);
    });

    it('should keep the paginator out of the scrolling region', () => {
        (paginator(page) === null).should.be.false;
        scrollRegion(page).contains(paginator(page)).should.be.false;
    });

    it('should not lay the primary pane out with the inert flex-grow class', () => {
        (page.container.querySelector('.flex-grow') === null).should.be.true;
    });
});
