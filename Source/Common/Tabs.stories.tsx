// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Tabs } from './Tabs';

const requestTabs = [
    { id: 'open', label: 'Open', content: 'Requests waiting for a decision.' },
    { id: 'closed', label: 'Closed', content: 'Requests that have been settled.' },
    { id: 'draft', label: 'Draft', content: 'Not submitted yet.' },
];

const meta = {
    title: 'Common/Tabs',
    component: Tabs,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A tab set. Arrow keys move between tabs, Home and End jump to the ends, and the list ' +
                    'holds one tab stop — what the `tablist` role promises and a row of buttons does not keep. ' +
                    'Each tab owns a panel and is wired to it through `aria-controls`. A choice that drives a ' +
                    'view rendered elsewhere is a value rather than a panel — use `ToggleGroup` for that.',
            },
        },
    },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const Controlled = ({
    tabs = requestTabs,
    ...rest
}: Partial<React.ComponentProps<typeof Tabs>>) => {
    const [value, setValue] = useState(tabs[0]!.id);
    return (
        <Tabs
            tabs={tabs}
            value={value}
            onChange={setValue}
            aria-label='Requests'
            {...rest}
        />
    );
};

/** Tabs with panels. */
export const Default: Story = {
    args: { tabs: requestTabs, value: 'open', onChange: () => undefined },
    render: () => <Controlled />,
};

/** Two tabs, each owning its panel. A choice that drives a view rendered elsewhere is a value — use `ToggleGroup`. */
export const TwoTabs: Story = {
    args: { tabs: requestTabs, value: 'open', onChange: () => undefined },
    render: () => (
        <Controlled
            tabs={[
                { id: 'all', label: 'All', content: 'Every request.' },
                { id: 'mine', label: 'Mine', content: 'Requests you own.' },
            ]}
        />
    ),
};

/** A tab may be unavailable. */
export const DisabledTab: Story = {
    args: { tabs: requestTabs, value: 'open', onChange: () => undefined },
    render: () => (
        <Controlled
            tabs={[
                { id: 'open', label: 'Open', content: 'Open' },
                { id: 'closed', label: 'Closed', content: 'Closed', disabled: true },
            ]}
        />
    ),
};

/** Arrow keys move the selection and the panel follows. */
export const KeyboardNavigation: Story = {
    args: { tabs: requestTabs, value: 'open', onChange: () => undefined },
    render: () => <Controlled />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const [open] = canvas.getAllByRole('tab');

        open.focus();
        await userEvent.keyboard('{ArrowRight}');

        await expect(canvas.getByRole('tab', { name: 'Closed' })).toHaveAttribute(
            'aria-selected',
            'true',
        );
        await expect(canvas.getByRole('tabpanel')).toHaveTextContent(
            'Requests that have been settled.',
        );
    },
};
