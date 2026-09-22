// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { Dropdown } from './Dropdown';

const DynamicRoleLabels = () => {
    const [replaced, setReplaced] = useState(false);
    const [prepended, setPrepended] = useState(false);
    return (
        <>
            {prepended && <label htmlFor='external-role'>Additional role label</label>}
            <label key={String(replaced)} htmlFor='external-role'>{replaced ? 'Updated project role' : 'Project role'}</label>
            <button type='button' onClick={() => setReplaced(true)}>Replace role label</button>
            <button type='button' onClick={() => setPrepended(true)}>Add role label</button>
        </>
    );
};

const ExternalLabelExamples = () => {
    const [value, setValue] = useState<string | null>('developer');
    return (
        <div style={{ display: 'grid', gap: '1rem', maxWidth: '22rem' }}>
            <DynamicRoleLabels />
            <Dropdown id='external-role' value={value} options={roles} onChange={setValue} />
            <label htmlFor='external-filtered-role'>Search role</label>
            <Dropdown id='external-filtered-role' value='developer' options={roles} filter />
            <label htmlFor='external-multiple-role'>Selected roles</label>
            <Dropdown id='external-multiple-role' value={['developer']} options={roles} multiple filter />
            <label htmlFor='external-native-roles'>Available roles</label>
            <Dropdown id='external-native-roles' value={['developer']} options={roles} multiple />
        </div>
    );
};

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

export const ExternalLabels: Story = {
    render: () => <ExternalLabelExamples />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: 'Project role Developer' });
        await expect(canvas.getByRole('combobox', { name: 'Search role' })).toBeVisible();
        await expect(canvas.getByRole('combobox', { name: 'Selected roles' })).toBeVisible();
        await expect(canvas.getByRole('listbox', { name: 'Available roles' })).toBeVisible();
        // An external native label retains both its click-to-focus behavior and its spoken name.
        await userEvent.click(canvas.getByText('Project role', { selector: 'label' }));
        await expect(trigger).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        const listboxId = trigger.getAttribute('aria-controls');
        const listbox = listboxId ? document.getElementById(listboxId) : null;
        if (!listbox) throw new Error('The trigger did not identify its open listbox.');
        await userEvent.click(within(listbox).getByRole('option', { name: 'Viewer' }));
        await expect(canvas.getByRole('button', { name: 'Project role Viewer' })).toBeVisible();
        await userEvent.click(canvas.getByRole('button', { name: 'Replace role label' }));
        await expect(await canvas.findByRole('button', { name: 'Updated project role Viewer' })).toBe(trigger);
        await userEvent.click(canvas.getByRole('button', { name: 'Add role label' }));
        await expect(await canvas.findByRole('button', { name: 'Additional role label Updated project role Viewer' })).toBe(trigger);
    },
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

// Deliberately hands the Dropdown no `value`: the keyboard has to finish its own commit - close the
// overlay and settle the filter text on the chosen option - without an application feeding the
// emitted value back in.
const UnboundFilteredDropdown = () => {
    const [committed, setCommitted] = useState<string | null>(null);
    return (
        <div style={{ display: 'grid', gap: '0.5rem', maxWidth: '18rem' }}>
            <Dropdown<string | null>
                aria-label='Role'
                options={roles}
                optionLabel='label'
                optionValue='value'
                placeholder='Select a role'
                filter
                filterPlaceholder='Find a role'
                onChange={setCommitted}
            />
            <span>Committed: {committed ?? 'none'}</span>
        </div>
    );
};

export const FilteredKeyboardCommit: Story = {
    render: () => <UnboundFilteredDropdown />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const filter = canvas.getByRole('combobox', { name: 'Role' });
        await userEvent.click(filter);
        await userEvent.keyboard('dev');
        const listbox = await within(document.body).findByRole('listbox');
        await expect(within(listbox).getAllByRole('option')).toHaveLength(1);
        await userEvent.keyboard('{ArrowDown}');
        await expect(filter.getAttribute('aria-activedescendant')).toBe(
            within(listbox).getByRole('option').id,
        );
        await userEvent.keyboard('{Enter}');
        await expect(canvas.getByText('Committed: developer')).toBeVisible();
        await expect(filter).toHaveValue('Developer');
        await expect(filter).toHaveAttribute('aria-expanded', 'false');
        await expect(within(document.body).queryByRole('listbox')).toBeNull();
    },
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
