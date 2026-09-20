// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { Breadcrumbs } from './Breadcrumbs';

const trail = [
    { label: 'Requests', href: '/requests' },
    { label: 'Equinor ASA', href: '/requests/equinor' },
    { label: 'FRP-1284' },
];

const meta = {
    title: 'Common/Breadcrumbs',
    component: Breadcrumbs,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A breadcrumb trail: an ordered list inside a navigation landmark. The last segment is ' +
                    'the current page — it carries `aria-current="page"`, has no destination and is out of ' +
                    'the tab order, which is what tells a screen-reader user where the trail ends.',
            },
        },
    },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A three-segment trail. */
export const Default: Story = {
    args: { items: trail, 'aria-label': 'Breadcrumb' },
};

/** The separator is a slot; anything decorative fits. */
export const CustomSeparator: Story = {
    args: { items: trail, separator: '›', 'aria-label': 'Breadcrumb' },
};

/** A router owns navigation through `onNavigate` instead of an href. */
export const RouterOwned: Story = {
    args: {
        'aria-label': 'Breadcrumb',
        items: [
            { label: 'Home', onNavigate: () => undefined },
            { label: 'Consultants', onNavigate: () => undefined },
            { label: 'Kari Nordmann' },
        ],
    },
};

/** The last segment is the current page. */
export const MarksTheCurrentPage: Story = {
    args: { items: trail, 'aria-label': 'Breadcrumb' },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('navigation', { name: 'Breadcrumb' })).toBeTruthy();
        await expect(canvas.getByText('FRP-1284')).toHaveAttribute('aria-current', 'page');
    },
};
