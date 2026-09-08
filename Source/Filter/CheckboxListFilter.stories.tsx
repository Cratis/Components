// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CheckboxListFilter } from './CheckboxListFilter';
import type { FilterOption } from './types';

const fewOptions: FilterOption[] = [
    { key: 'active', label: 'Active', value: 'active', count: 42 },
    { key: 'inactive', label: 'Inactive', value: 'inactive', count: 18 },
    { key: 'pending', label: 'Pending', value: 'pending', count: 7 },
];

const manyOptions: FilterOption[] = Array.from({ length: 30 }, (_, index) => ({
    key: `repo-${index}`,
    label: `repository-${String(index + 1).padStart(2, '0')}`,
    value: `repo-${index}`,
}));

const meta = {
    title: 'Filter/CheckboxListFilter',
    component: CheckboxListFilter,
    args: {
        options: fewOptions,
        selected: new Set<string>(),
        onToggle: fn(),
    },
    parameters: { layout: 'centered' },
} satisfies Meta<typeof CheckboxListFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A short list fits inside the box on its own, so no search box is rendered - not hidden,
 * not disabled, simply not needed.
 */
export const FitsWithoutSearch: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByPlaceholderText('Search…')).toBeNull();
        await expect(canvas.getByRole('radio', { name: /^Active/ })).toBeTruthy();
    },
    render: (args) => {
        const [selected, setSelected] = useState<Set<string>>(args.selected);
        return (
            <div style={{ width: '18rem' }}>
                <CheckboxListFilter
                    {...args}
                    selected={selected}
                    onToggle={(key) => {
                        args.onToggle(key);
                        setSelected((current) => new Set(current.has(key) ? [] : [key]));
                    }}
                />
            </div>
        );
    },
};

/**
 * A long list overflows the box, so a search input grows out of the list on its own and stays
 * pinned to the top of the scrolling area while the rows beneath it scroll.
 */
export const OverflowsWithStickySearch: Story = {
    args: {
        options: manyOptions,
        multi: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const search = await canvas.findByPlaceholderText('Search…');
        await userEvent.type(search, 'repository-07');
        const match = await canvas.findByRole('checkbox', { name: /^repository-07/ });
        await userEvent.click(match);
        await expect(match).toBeChecked();
        await expect(canvas.queryByText('repository-01')).toBeNull();
    },
    render: (args) => {
        const [selected, setSelected] = useState<Set<string>>(args.selected);
        return (
            <div style={{ width: '18rem' }}>
                <CheckboxListFilter
                    {...args}
                    selected={selected}
                    onToggle={(key) => {
                        args.onToggle(key);
                        setSelected((current) => {
                            const next = new Set(current);
                            if (next.has(key)) next.delete(key);
                            else next.add(key);
                            return next;
                        });
                    }}
                />
            </div>
        );
    },
};

/** `searchable={false}` forces the search box off even for a list that would otherwise overflow. */
export const SearchForcedOff: Story = {
    args: {
        options: manyOptions,
        multi: true,
        searchable: false,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByPlaceholderText('Search…')).toBeNull();
    },
};

/** `searchable` (true) forces the search box on even for a list short enough to fit on its own. */
export const SearchForcedOn: Story = {
    args: {
        searchable: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByPlaceholderText('Search…')).toBeTruthy();
    },
};
