// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { DatePickerInput } from './DatePickerInput';

const meta = {
    title: 'Common/DatePickerInput visual parity',
    component: DatePickerInput,
    parameters: { layout: 'padded' },
    tags: ['autodocs'],
} satisfies Meta<typeof DatePickerInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const ControlledPicker = ({
    initialValue = null,
    disabled = false,
    invalid = false,
}: {
    initialValue?: Date | null;
    disabled?: boolean;
    invalid?: boolean;
}) => {
    const [value, setValue] = useState<Date | null>(initialValue);
    return (
        <DatePickerInput
            aria-label='Delivery date'
            value={value}
            onChange={setValue}
            placeholder='Choose a date'
            showButtonBar
            disabled={disabled}
            invalid={invalid}
            style={{ width: '18rem' }}
        />
    );
};

export const StateMatrix: Story = {
    render: () => (
        <div style={{ display: 'grid', gap: '1rem', maxWidth: '20rem' }}>
            <ControlledPicker />
            <ControlledPicker initialValue={new Date(2024, 5, 15)} />
            <ControlledPicker initialValue={new Date(2024, 5, 15)} disabled />
            <ControlledPicker invalid />
        </div>
    ),
};

export const OpenCalendar: Story = {
    render: () => <ControlledPicker initialValue={new Date(2024, 5, 15)} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Open calendar' }));
        await expect(within(document.body).getByRole('dialog')).toBeTruthy();
    },
};
