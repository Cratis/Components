// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ColumnFilterMenu } from './ColumnFilterMenu';

const meta = {
    title: 'DataTables/ColumnFilterMenu',
    component: ColumnFilterMenu,
    args: {
        field: 'name',
        dataType: 'text',
        placeholder: 'Filter value',
        onApply: fn(),
        onClear: fn(),
    },
    parameters: { layout: 'centered' },
} satisfies Meta<typeof ColumnFilterMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const openMenu = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /filter by/i }));
    await expect(await within(document.body).findByRole('dialog')).toBeTruthy();
};

export const Text: Story = { play: openMenu };
export const Numeric: Story = {
    args: { field: 'amount', dataType: 'numeric' },
    play: openMenu,
};
export const DateValue: Story = {
    args: { field: 'createdAt', dataType: 'date' },
    play: openMenu,
};
export const Boolean: Story = {
    args: { field: 'active', dataType: 'boolean' },
    play: openMenu,
};

export const LocalizedAndCustomized: Story = {
    args: {
        labels: {
            valueAriaLabel: () => 'Filterverdi',
            apply: 'Bruk',
            clear: 'Tøm',
        },
        pt: {
            menu: { style: { boxShadow: 'var(--cratis-shadow-overlay)' } },
        },
    },
    play: async (context) => {
        await openMenu(context);
        const body = within(document.body);
        await expect(body.getByLabelText('Filterverdi')).toBeTruthy();
        await expect(body.getByRole('button', { name: 'Bruk' })).toBeTruthy();
        await expect(body.getByRole('button', { name: 'Tøm' })).toBeTruthy();
    },
};
