// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { NumberInput } from './NumberInput';

const meta = {
    title: 'Common/NumberInput',
    component: NumberInput,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
    args: { value: 1234.5, onChange: fn(), locale: 'en-US' },
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Controlled wrapper for interactive stories. */
const ControlledNumberInput = ({
    initialValue = null,
    ...props
}: Omit<React.ComponentProps<typeof NumberInput>, 'value' | 'onChange'> & {
    initialValue?: number | null;
}) => {
    const [value, setValue] = useState<number | null>(initialValue);
    return (
        <NumberInput
            {...props}
            value={value}
            onChange={setValue}
        />
    );
};

/** Currency input with inline prefix decoration and two fixed decimal places. */
export const Currency: Story = {
    render: () => (
        <ControlledNumberInput
            initialValue={12500.5}
            locale='en-US'
            prefix='$'
            minimumFractionDigits={2}
            maximumFractionDigits={2}
            aria-label='Price'
            style={{ width: '14rem' }}
        />
    ),
};

/** Percentage input with inline suffix and range constraints. */
export const Percentage: Story = {
    render: () => (
        <ControlledNumberInput
            initialValue={75}
            locale='en-US'
            suffix='%'
            min={0}
            max={100}
            step={1}
            aria-label='Completion'
            style={{ width: '10rem' }}
        />
    ),
};

/** Plain integer showing locale-specific grouping separators. */
export const PlainInteger: Story = {
    render: () => (
        <ControlledNumberInput
            initialValue={1234567}
            locale='de-DE'
            aria-label='Population'
            style={{ width: '14rem' }}
        />
    ),
};

/** Showcase of all visual configurations. */
export const Showcase: Story = {
    render: () => (
        <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '18rem' }}>
            <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    Currency (en-US)
                </label>
                <ControlledNumberInput
                    initialValue={9999.99}
                    locale='en-US'
                    prefix='$'
                    minimumFractionDigits={2}
                    maximumFractionDigits={2}
                    aria-label='Currency amount'
                />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    Percentage (en-US)
                </label>
                <ControlledNumberInput
                    initialValue={42}
                    locale='en-US'
                    suffix='%'
                    min={0}
                    max={100}
                    aria-label='Percentage value'
                />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    Rate with unit (fr-FR)
                </label>
                <ControlledNumberInput
                    initialValue={850}
                    locale='fr-FR'
                    prefix='€'
                    suffix='/hr'
                    aria-label='Hourly rate'
                />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    Empty field
                </label>
                <ControlledNumberInput
                    initialValue={null}
                    locale='en-US'
                    placeholder='Enter a number'
                    aria-label='Empty number field'
                />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    Disabled
                </label>
                <ControlledNumberInput
                    initialValue={500}
                    locale='en-US'
                    disabled
                    aria-label='Disabled field'
                />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    Invalid
                </label>
                <ControlledNumberInput
                    initialValue={-5}
                    locale='en-US'
                    invalid
                    min={0}
                    aria-label='Invalid field'
                />
            </div>
        </div>
    ),
};

/** Interactive keyboard stepping with constrained range. */
export const Interactive: Story = {
    render: () => (
        <ControlledNumberInput
            initialValue={50}
            locale='en-US'
            min={0}
            max={100}
            step={5}
            suffix='%'
            aria-label='Interactive percentage'
            style={{ width: '10rem' }}
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByRole('textbox');
        await userEvent.click(input);
        await userEvent.keyboard('{ArrowUp}');
        await expect(input).toHaveValue('55');
    },
};
