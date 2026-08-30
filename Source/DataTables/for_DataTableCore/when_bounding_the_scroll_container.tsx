// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Column } from '../Column';
import { DataTableCore } from '../DataTableCore';

interface Row {
    id: number;
    name: string;
}

const rows: Row[] = [
    { id: 1, name: 'Alpha' },
    { id: 2, name: 'Bravo' },
];

// The scroll container is bounded with a percentage `max-height`, which only resolves while
// the scrollable root carries a definite height. This suite covers the marker the stylesheet
// hangs that height on; `when_resolving_the_scroll_bound` covers the stylesheet itself.
describe('when bounding the DataTableCore scroll container', () => {
    let container: HTMLDivElement;
    let root: Root;

    const render = async (scrollable: boolean) => {
        await act(async () => {
            root.render(
                <DataTableCore
                    data={rows}
                    dataKey='id'
                    emptyMessage='No rows'
                    scrollable={scrollable}
                    scrollHeight='100%'
                >
                    <Column<Row> field='name' header='Name' />
                </DataTableCore>,
            );
        });
    };

    beforeEach(() => {
        // SAFETY: `IS_REACT_ACT_ENVIRONMENT` is a React test flag that is not part of any
        // ambient `globalThis` declaration, so TypeScript cannot know the property exists.
        // Assigning it is the documented way to opt a jsdom suite into `act()` semantics.
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should_mark_the_root_scrollable_so_the_percentage_bound_can_resolve', async () => {
        await render(true);

        const table = container.querySelector('.cratis-datatable');

        expect(table?.classList.contains('cratis-datatable--scrollable')).to.equal(true);
    });

    it('should_leave_a_non_scrollable_table_sizing_to_its_content', async () => {
        await render(false);

        const table = container.querySelector('.cratis-datatable');

        expect(table?.classList.contains('cratis-datatable--scrollable')).to.equal(false);
    });
});
