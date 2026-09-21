// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { ComboBox, type ComboBoxOption } from './ComboBox';

const StoryContainer = ({
    children,
}: {
    children: ReactNode;
    size?: string;
    asCard?: boolean;
}) => <div className='cratis:flex cratis:flex-col cratis:gap-4'>{children}</div>;
const StorySection = ({ children }: { children: ReactNode }) => (
    <section>{children}</section>
);

const customers: ComboBoxOption[] = [
    { key: 'acme', label: 'Acme AS', description: '987 654 325' },
    { key: 'birk', label: 'Birk Consulting', description: '912 345 688' },
    { key: 'cirrus', label: 'Cirrus Cloud', description: '923 456 780' },
    { key: 'delta', label: 'Delta Energi', description: '934 567 891', disabled: true },
];

const meta = {
    title: 'Common/ComboBox',
    component: ComboBox,
    tags: ['autodocs'],
    parameters: { layout: 'centered' },
} satisfies Meta<typeof ComboBox>;

export default meta;
type Story = StoryObj<typeof meta>;

const Picker = ({
    initialValue = null,
    ...props
}: Partial<ComponentProps<typeof ComboBox>> & { initialValue?: string | null }) => {
    const [value, setValue] = useState<string | null>(initialValue);
    return (
        <StoryContainer size='sm' asCard>
            <StorySection>
                <label htmlFor='customer'>Customer</label>
                <ComboBox
                    id='customer'
                    options={customers}
                    value={value}
                    onChange={setValue}
                    placeholder='Search customers'
                    emptyMessage='No customer matches.'
                    {...props}
                />
                <p>Selected: {value ?? 'none'}</p>
            </StorySection>
        </StoryContainer>
    );
};

/** Type to filter, arrow to move, Enter to pick. Descriptions sit beside the label. */
export const Playground: Story = {
    args: { options: customers, value: null, onChange: () => undefined },
    render: () => <Picker />,
};

/** Opens on focus so the roster is visible before typing; descriptions stack under the label. */
export const OpenOnFocusStacked: Story = {
    args: { options: customers, value: null, onChange: () => undefined },
    render: () => <Picker openOnFocus optionLayout='stacked' />,
    play: async ({ canvasElement }) => {
        const input = within(canvasElement).getByRole('combobox', { name: 'Customer' });
        await userEvent.click(input);
        await expect(input).toHaveAttribute('aria-expanded', 'true');
        await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
        await expect(input).toHaveValue('Birk Consulting');
    },
};

const plainCustomers: ComboBoxOption[] = customers.map(({ key, label, disabled }) => ({
    key,
    label,
    disabled,
}));

/** A selection never hides the rest: opening the list again offers every option. */
export const ReopenedWithASelection: Story = {
    args: { options: customers, value: null, onChange: () => undefined },
    render: () => <Picker options={plainCustomers} initialValue='birk' />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByRole('combobox', { name: 'Customer' });
        await expect(input).toHaveValue('Birk Consulting');

        await userEvent.click(canvas.getByRole('button'));

        await expect(input).toHaveAttribute('aria-expanded', 'true');
        const list = await within(document.body).findByRole('listbox');
        await expect(within(list).getAllByRole('option')).toHaveLength(
            plainCustomers.length,
        );
    },
};

/** The roster is still loading. */
export const Loading: Story = {
    args: { options: [], value: null, onChange: () => undefined },
    render: () => (
        <Picker options={[]} loading loadingMessage='Loading customers…' openOnFocus />
    ),
};

/** The roster query failed; the failure replaces the list and is announced. */
export const Failure: Story = {
    args: { options: [], value: null, onChange: () => undefined },
    render: () => (
        <Picker
            options={[]}
            failure='The customer roster could not be read. Try again.'
            openOnFocus
        />
    ),
};

/** An add-new row after the options receives the typed text. */
export const WithAction: Story = {
    args: { options: customers, value: null, onChange: () => undefined },
    render: () => {
        const [created, setCreated] = useState<string | null>(null);
        return (
            <>
                <Picker
                    openOnFocus
                    action={{
                        label: 'Register a new customer…',
                        onAction: (text) => setCreated(text),
                    }}
                />
                <p>Would register: {created ?? '—'}</p>
            </>
        );
    },
};

/** Invalid, with the message associated; and disabled. */
export const States: Story = {
    args: { options: customers, value: null, onChange: () => undefined },
    render: () => (
        <StoryContainer size='sm' asCard>
            <StorySection>
                <ComboBox
                    aria-label='Customer (invalid)'
                    options={customers}
                    value={null}
                    onChange={() => undefined}
                    invalid
                    required
                    errorMessage='Choose a customer.'
                />
                <ComboBox
                    aria-label='Customer (disabled)'
                    options={customers}
                    value='acme'
                    onChange={() => undefined}
                    disabled
                />
            </StorySection>
        </StoryContainer>
    ),
};
