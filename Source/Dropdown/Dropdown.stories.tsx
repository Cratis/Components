// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { Dropdown } from './Dropdown';

const roles = [
    { label: 'Administrator', value: 'admin' },
    { label: 'Developer', value: 'developer' },
    { label: 'Viewer', value: 'viewer' },
];

const meta = {
    title: 'Dropdown/Dropdown',
    component: Dropdown,
    parameters: { layout: 'padded' },
    tags: ['autodocs'],
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

const ControlledDropdown = ({
    initialValue = null,
    filter = false,
    disabled = false,
    invalid = false,
}: {
    initialValue?: string | null;
    filter?: boolean;
    disabled?: boolean;
    invalid?: boolean;
}) => {
    const [value, setValue] = useState<string | null>(initialValue);
    return (
        <Dropdown<string | null>
            aria-label='Role'
            value={value}
            options={roles}
            optionLabel='label'
            optionValue='value'
            placeholder='Select a role'
            filter={filter}
            filterPlaceholder='Find a role'
            showClear
            disabled={disabled}
            invalid={invalid}
            onChange={(event) => setValue(event.value)}
            style={{ width: '18rem' }}
        />
    );
};

export const StateMatrix: Story = {
    render: () => (
        <div style={{ display: 'grid', gap: '1rem', maxWidth: '20rem' }}>
            <ControlledDropdown />
            <ControlledDropdown initialValue='developer' />
            <ControlledDropdown initialValue='viewer' disabled />
            <ControlledDropdown invalid />
        </div>
    ),
};

export const FilteredAndOpen: Story = {
    render: () => <ControlledDropdown filter />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: /show options/i }));
        await expect(await within(document.body).findByRole('listbox')).toBeTruthy();
    },
};
