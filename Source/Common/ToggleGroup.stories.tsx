// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { ToggleGroup } from './ToggleGroup';

const periods = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
];

const meta = {
    title: 'Common/ToggleGroup',
    component: ToggleGroup,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A single-selection group of exclusive choices — a segmented control. It carries ' +
                    '`radiogroup`/`radio` semantics, not `tablist`/`tab`: this is a value choice, not a panel ' +
                    'switcher. Arrow keys move focus within the group and Space or Enter commits, so arrowing ' +
                    'past an option never runs the query behind it.',
            },
        },
    },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const Controlled = ({
    initial = 'day',
    ...rest
}: { initial?: string } & Partial<React.ComponentProps<typeof ToggleGroup>>) => {
    const [value, setValue] = useState(initial);
    return (
        <ToggleGroup
            options={periods}
            value={value}
            onChange={setValue}
            aria-label='Period'
            {...rest}
        />
    );
};

/** The default: three exclusive choices. */
export const Default: Story = {
    args: { options: periods, value: 'day', onChange: () => undefined },
    render: () => <Controlled />,
};

/** An option may carry a decorative icon before its label. */
export const WithIcons: Story = {
    args: { options: periods, value: 'list', onChange: () => undefined },
    render: () => (
        <Controlled
            initial='list'
            options={[
                { value: 'list', label: 'List', icon: <span aria-hidden='true'>☰</span> },
                { value: 'grid', label: 'Grid', icon: <span aria-hidden='true'>▦</span> },
            ]}
        />
    ),
};

/** A single option, or the whole group, can be unavailable. */
export const Disabled: Story = {
    args: { options: periods, value: 'day', onChange: () => undefined },
    render: () => (
        <div className='cratis:flex cratis:flex-col cratis:gap-4'>
            <Controlled
                options={[
                    { value: 'day', label: 'Day' },
                    { value: 'week', label: 'Week', disabled: true },
                    { value: 'month', label: 'Month' },
                ]}
            />
            <Controlled disabled />
        </div>
    ),
};

/** Marked invalid and described by the error text a form field owns. */
export const Invalid: Story = {
    args: { options: periods, value: 'day', onChange: () => undefined },
    render: () => (
        <div className='cratis:flex cratis:flex-col cratis:gap-1'>
            <span id='period-label'>Period</span>
            <Controlled
                invalid
                aria-label={undefined}
                aria-labelledby='period-label'
                aria-describedby='period-error'
            />
            <span id='period-error'>Choose a period.</span>
        </div>
    ),
};

/** Arrow to the next option and commit it with Space. */
export const KeyboardSelection: Story = {
    args: { options: periods, value: 'day', onChange: () => undefined },
    render: () => <Controlled />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const group = canvas.getByRole('radiogroup', { name: 'Period' });
        const [day, week] = within(group).getAllByRole('radio');

        await expect(day).toHaveAttribute('aria-checked', 'true');
        day.focus();
        await userEvent.keyboard('{ArrowRight}');
        await userEvent.keyboard(' ');
        await expect(week).toHaveAttribute('aria-checked', 'true');
    },
};
