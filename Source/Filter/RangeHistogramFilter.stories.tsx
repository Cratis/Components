// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { RangeHistogramFilter } from './RangeHistogramFilter';

const values = [
    4, 8, 12, 12, 18, 22, 31, 35, 38, 42, 48, 51, 55, 63, 67, 72, 78, 81, 86, 94,
];

const meta = {
    title: 'Filter/RangeHistogramFilter',
    component: RangeHistogramFilter,
    args: {
        values,
        min: 0,
        max: 100,
        buckets: 10,
        selectedRange: [20, 80],
        onChange: fn(),
    },
    parameters: { layout: 'centered' },
} satisfies Meta<typeof RangeHistogramFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const minimum = canvas.getByRole('slider', { name: 'Minimum value' });
        minimum.focus();
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => {
            expect(
                [...canvasElement.querySelectorAll('.pv-range-value')].map(
                    (element) => element.textContent,
                ),
            ).toEqual(['30', '80']);
        });
        await userEvent.click(canvas.getByRole('button', { name: /^0 - 10:/ }));
        await waitFor(() => {
            expect(
                [...canvasElement.querySelectorAll('.pv-range-value')].map(
                    (element) => element.textContent,
                ),
            ).toEqual(['0', '10']);
        });
    },
    render: (args) => {
        const [range, setRange] = useState<[number, number] | null>(args.selectedRange);
        return (
            <div style={{ width: '32rem' }}>
                <RangeHistogramFilter
                    {...args}
                    selectedRange={range}
                    onChange={setRange}
                />
            </div>
        );
    },
};

export const Currency: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole('slider', { name: 'Minimum order value' }),
        ).toBeTruthy();
        await userEvent.click(canvas.getByRole('button', { name: /^\$0 - \$10:/ }));
        await expect(args.onChange).toHaveBeenCalledWith(
            [0, 10],
            expect.objectContaining({
                source: 'user',
                nativeEvent: expect.objectContaining({ type: 'click' }),
            }),
        );
    },
    args: {
        min: 0,
        max: 100,
        formatValue: (value) => `$${value}`,
        itemsLabel: 'orders',
        minimumAriaLabel: 'Minimum order value',
        maximumAriaLabel: 'Maximum order value',
    },
};
