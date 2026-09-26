// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { FilterPanel } from './FilterPanel';
import type { FilterDefinition } from './types';

const meta: Meta<typeof FilterPanel> = { title: 'Filter/FilterPanel/Accessibility', component: FilterPanel };
export default meta;
type Story = StoryObj<typeof FilterPanel>;

const filters: FilterDefinition[] = [{
    key: 'status', label: 'Status', searchable: true, autoFocus: true,
    searchAriaLabel: 'Find a status',
    options: [{ key: 'active', label: 'Active', value: 'active' }],
}];

export const FocusSearchAndDismiss: Story = {
    name: 'Focus search on expansion and dismiss with Escape',
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = within(document.body);
        await userEvent.click(canvas.getByRole('button', { name: 'Filters' }));
        await userEvent.click(body.getByRole('button', { name: 'Status' }));
        const search = body.getByRole('searchbox', { name: 'Find a status' });
        await expect(search).toHaveFocus();
        const panel = body.getByRole('dialog', { name: 'Filter choices' });
        await waitFor(() => expect(getComputedStyle(panel).opacity).toBe('1'));
        await userEvent.keyboard('{Escape}');
        await expect(canvas.getByRole('button', { name: 'Filters' })).toHaveFocus();
        await waitFor(() => expect(body.queryByRole('dialog', { name: 'Filter choices' })).toBeNull());
    },
    render: () => {
        const anchorRef = useRef<HTMLButtonElement>(null);
        const [isOpen, setIsOpen] = useState(false);
        const [expandedFilterKey, setExpandedFilterKey] = useState<string | null>(null);
        return <div style={{ padding: '3rem' }}>
            <button ref={anchorRef} aria-expanded={isOpen} onClick={() => setIsOpen(!isOpen)}>Filters</button>
            <FilterPanel isOpen={isOpen} filters={filters} filterValues={{}} rangeValues={{}}
                aria-label='Filter choices' anchorRef={anchorRef} expandedFilterKey={expandedFilterKey}
                onClose={() => setIsOpen(false)} onExpandedFilterChange={setExpandedFilterKey}
                onFilterToggle={() => undefined} onFilterClear={() => undefined}
                onRangeChange={() => undefined} />
        </div>;
    },
};
