// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React, { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it } from 'vitest';
import { ColumnFilterMenu } from '../DataTables/ColumnFilterMenu';
import { CheckboxListFilter } from '../Filter/CheckboxListFilter';
import { FilterPanel } from '../Filter/FilterPanel';
import { RangeHistogramFilter } from '../Filter/RangeHistogramFilter';

const noop = () => undefined;
const options = [{ key: 'active', label: 'Active', value: 'active' }];

const examples: Record<string, { element: React.ReactElement; root: string }> = {
    CheckboxListFilter: {
        element: <CheckboxListFilter options={options} selected={new Set()} multi onToggle={noop} />,
        root: 'div',
    },
    RangeHistogramFilter: {
        element: (
            <RangeHistogramFilter
                values={[10, 20, 30]}
                min={0}
                max={100}
                buckets={10}
                selectedRange={null}
                onChange={noop}
            />
        ),
        root: 'div',
    },
    FilterPanel: {
        element: (
            <FilterPanel
                isOpen
                filters={[{ key: 'status', label: 'Status', type: 'string', multi: true, options }]}
                filterValues={{}}
                rangeValues={{}}
                expandedFilterKey='status'
                anchorRef={createRef<HTMLButtonElement>()}
                onClose={noop}
                onFilterToggle={noop}
                onFilterClear={noop}
                onRangeChange={noop}
                onExpandedFilterChange={noop}
            />
        ),
        root: 'div',
    },
    ColumnFilterMenu: {
        element: <ColumnFilterMenu field='status' onApply={noop} onClear={noop} />,
        root: 'button',
    },
};

describe('when rendering marked filter components', () => {
    const render = async (element: React.ReactElement) => {
        // SAFETY: React's test-environment flag is an intentionally undocumented global absent from DOM typings.
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        await act(async () => root.render(element));
        return { container, dispose: async () => { await act(async () => root.unmount()); container.remove(); } };
    };

    for (const [name, example] of Object.entries(examples)) {
        it(`should mark the ${name} root element with its component name`, async () => {
            const mounted = await render(example.element);
            const marked = document.querySelectorAll(`[data-cratis-component="${name}"]`);
            marked.length.should.equal(1);
            marked[0].tagName.toLowerCase().should.equal(example.root);
            await mounted.dispose();
        });
    }

    it('should mark the CheckboxListFilter empty state', async () => {
        const mounted = await render(<CheckboxListFilter options={[]} selected={new Set()} onToggle={noop} />);
        const marked = mounted.container.querySelectorAll('[data-cratis-component="CheckboxListFilter"]');
        marked.length.should.equal(1);
        marked[0].tagName.toLowerCase().should.equal('p');
        await mounted.dispose();
    });
});
