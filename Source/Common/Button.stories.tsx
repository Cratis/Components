// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { Button } from './Button';

const meta = {
    title: 'Common/Button',
    component: Button,
    parameters: { layout: 'padded' },
    tags: ['autodocs'],
    args: { onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Label: Story = { args: { label: 'Save' } };
export const LabelAndIcon: Story = { args: { label: 'Save', icon: 'pi pi-check' } };
export const IconOnly: Story = { args: { icon: 'pi pi-trash', 'aria-label': 'Delete', severity: 'danger' } };
export const Loading: Story = { args: { label: 'Saving', loading: true } };
export const Text: Story = { args: { label: 'Cancel', text: true } };
export const Link: Story = { args: { label: 'Learn more', link: true } };
export const Outlined: Story = { args: { label: 'Details', outlined: true, severity: 'secondary' } };
export const WithTooltip: Story = { args: { icon: 'pi pi-info-circle', 'aria-label': 'Info', tooltip: 'More information' } };
