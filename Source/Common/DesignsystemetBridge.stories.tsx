// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { useLayoutEffect, useState, type ReactNode } from 'react';
import { expect, within } from 'storybook/test';
import { applyDesignsystemetMode } from '../.storybook/designsystemet';
import { Badge } from '../Display/Badge';
import { Dropdown } from '../Dropdown/Dropdown';
import { Button } from './Button';
import { ComboBox, type ComboBoxOption } from './ComboBox';

type Scheme = 'light' | 'dark';
type Size = 'sm' | 'md' | 'lg';

const SCHEMES: Scheme[] = ['light', 'dark'];
const SIZES: Size[] = ['sm', 'md', 'lg'];

const customers: ComboBoxOption[] = [
    { key: 'acme', label: 'Acme AS' },
    { key: 'birk', label: 'Birk Consulting' },
];

const roles = [
    { label: 'Administrator', value: 'admin' },
    { label: 'Developer', value: 'developer' },
];

const meta = {
    title: 'Theming/Designsystemet bridge',
    parameters: { layout: 'fullscreen' },
    decorators: [
        // The story applies the Designsystemet mode itself, regardless of the toolbar appearance, so the
        // baseline story matrix exercises the bridge. It runs after every render because the global
        // decorator re-applies the toolbar appearance first.
        (Story) => {
            useLayoutEffect(() => {
                applyDesignsystemetMode(document.documentElement, 'designsystemet-light', 'md');
            });
            return <Story />;
        },
    ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Controls = ({ id }: { id: string }) => {
    const [customer, setCustomer] = useState<string | null>('acme');
    const [role, setRole] = useState<string | null>('developer');
    return (
        <div style={{ display: 'grid', gap: '0.75rem', justifyItems: 'start' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <Button label='Save' />
                <Button label='Details' variant='outline' tone='neutral' />
                <Button label='Cancel' variant='ghost' />
                <Button label='Delete' tone='critical' />
                <Badge value={8} severity='info' />
                <Badge value='NEW' severity='success' />
            </div>
            <label htmlFor={`${id}-customer`}>Customer</label>
            <ComboBox
                id={`${id}-customer`}
                options={customers}
                value={customer}
                onChange={setCustomer}
            />
            <label htmlFor={`${id}-role`}>Role</label>
            <Dropdown id={`${id}-role`} value={role} options={roles} onChange={setRole} />
        </div>
    );
};

const Cell = ({ scheme, size, children }: { scheme: Scheme; size: Size; children: ReactNode }) => (
    <section
        data-color-scheme={scheme}
        data-size={size}
        data-testid={`ds-${scheme}-${size}`}
        style={{
            padding: '1rem',
            color: 'var(--ds-color-neutral-text-default)',
            backgroundColor: 'var(--ds-color-neutral-background-default)',
            fontFamily: 'var(--ds-font-family)',
        }}
    >
        <h3 style={{ margin: '0 0 0.75rem' }}>
            {scheme} / {size}
        </h3>
        {children}
    </section>
);

/** Primitives in every Designsystemet colour scheme and size mode; nested wrappers prove the bridge follows ancestors. */
export const Primitives: Story = {
    render: () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(22rem, 1fr))' }}>
            {SCHEMES.flatMap((scheme) =>
                SIZES.map((size) => (
                    <Cell key={`${scheme}-${size}`} scheme={scheme} size={size}>
                        <Controls id={`${scheme}-${size}`} />
                    </Cell>
                )),
            )}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Control heights follow data-size, so compare the rendered boxes.
        const smallInput = canvas.getAllByRole('combobox', { name: 'Customer' })[0];
        const largeInput = canvas.getAllByRole('combobox', { name: 'Customer' })[2];
        await expect(largeInput.getBoundingClientRect().height).toBeGreaterThan(
            smallInput.getBoundingClientRect().height,
        );
    },
};
