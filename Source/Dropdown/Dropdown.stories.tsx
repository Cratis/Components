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
            onChange={setValue}
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

export const SelectedOptionFocusTreatment: Story = {
    render: () => <ControlledDropdown initialValue='developer' />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: /Role/ });
        trigger.focus();
        await userEvent.keyboard('{Enter}');
        const selectedOption = await within(document.body).findByRole('option', {
            selected: true,
        });
        await expect(document.activeElement).toBe(selectedOption);
        const isFocusVisible = selectedOption.matches(':focus-visible');
        const computedStyle = getComputedStyle(selectedOption);
        const diagnostics = JSON.stringify({
            isFocusVisible,
            dataFocusVisible: selectedOption.getAttribute('data-focus-visible'),
            outline: computedStyle.outline,
            boxShadow: computedStyle.boxShadow,
        });
        await expect(isFocusVisible, diagnostics).toBe(true);
        // Either mechanism paints a real ring; this only fails if both are absent, so it
        // stays sensitive to a regression without pinning outline vs. box-shadow forever.
        const hasVisibleOutline =
            computedStyle.outlineStyle !== 'none' && parseFloat(computedStyle.outlineWidth) > 0;
        const hasVisibleBoxShadow = computedStyle.boxShadow !== 'none';
        await expect(hasVisibleOutline || hasVisibleBoxShadow, diagnostics).toBe(true);
    },
};

// Omits showClear on purpose: the clear button has a preexisting, unrelated aria-hidden-focus
// defect that axe flags independently of this fix, so this story isolates the filtered
// listbox's own arrow-key focus treatment rather than suppressing that separate violation.
const FilteredNoClearDropdown = () => {
    const [value, setValue] = useState<string | null>('admin');
    return (
        <Dropdown<string | null>
            aria-label='Role'
            value={value}
            options={roles}
            optionLabel='label'
            optionValue='value'
            placeholder='Select a role'
            filter
            filterPlaceholder='Find a role'
            onChange={setValue}
            style={{ width: '18rem' }}
        />
    );
};

export const FilteredReopenedFocusTreatment: Story = {
    render: () => <FilteredNoClearDropdown />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: /show options/i }));
        const listbox = await within(document.body).findByRole('listbox');
        await userEvent.keyboard('{ArrowDown}{ArrowUp}');
        const focusedOption = within(listbox)
            .getAllByRole('option')
            .find((option) => option.getAttribute('data-focused') === 'true');
        if (!focusedOption) throw new Error('No option received keyboard focus after ArrowDown.');
        const computedStyle = getComputedStyle(focusedOption);
        const diagnostics = JSON.stringify({
            focusedOptionText: focusedOption.textContent,
            dataSelected: focusedOption.getAttribute('data-selected'),
            dataFocused: focusedOption.getAttribute('data-focused'),
            dataFocusVisible: focusedOption.getAttribute('data-focus-visible'),
            boxShadow: computedStyle.boxShadow,
        });
        await expect(focusedOption.getAttribute('data-selected'), diagnostics).toBe('true');
        await expect(computedStyle.boxShadow, diagnostics).not.toBe('none');
    },
};
