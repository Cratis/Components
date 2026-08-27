// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
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

export const Div: Story = {};
export const Section: Story = { args: { as: 'section', 'aria-label': 'Summary' } };
export const Article: Story = { args: { as: 'article', 'aria-label': 'Example article' } };
