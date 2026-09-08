// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { Surface } from './Surface';

const meta = {
    title: 'Common/Surface',
    component: Surface,
    tags: ['autodocs'],
    parameters: { layout: 'centered' },
    args: { children: 'Example content', style: { padding: '1rem', width: '18rem' } },
} satisfies Meta<typeof Surface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Div: Story = {
    play: async ({ canvasElement }) => {
        await expect(
            canvasElement.querySelector('[data-cratis-part="root"]'),
        ).toHaveProperty('tagName', 'DIV');
    },
};
export const Section: Story = {
    args: { as: 'section', 'aria-label': 'Summary' },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole('region', { name: 'Summary' }),
        ).toHaveProperty('tagName', 'SECTION');
    },
};
export const Article: Story = {
    args: { as: 'article', 'aria-label': 'Example article' },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole('article', { name: 'Example article' }),
        ).toHaveProperty('tagName', 'ARTICLE');
    },
};
