// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { useLayoutEffect, useState, type ReactNode } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { applyDesignsystemetMode } from '../.storybook/designsystemet';
import { unstable_RendererScope as RendererScope } from '../renderer';
import { unstable_cratisBuiltIn } from '../renderer/builtin';
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
            // The bridge maps Designsystemet tokens onto the built-in renderer's CSS custom properties, so
            // the story pins the built-in renderer locally; adapter renderers bring their own styling.
            return (
                <RendererScope use={unstable_cratisBuiltIn}>
                    <Story />
                </RendererScope>
            );
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
        // The bridge's contract is the control min-height token following data-size. The rendered box
        // also depends on content and global preview CSS, so compare the computed min-height.
        const [small, medium, large] = canvas
            .getAllByRole('combobox', { name: 'Customer' })
            .slice(0, 3)
            .map((input) => parseFloat(getComputedStyle(input.parentElement!).minHeight));
        await expect(small).toBeLessThan(medium);
        await expect(medium).toBeLessThan(large);
    },
};

const resolve = (element: HTMLElement, property: string, value: string): string => {
    const probe = document.createElement('span');
    probe.style.setProperty(property, value);
    element.appendChild(probe);
    const resolved = getComputedStyle(probe).getPropertyValue(property);
    probe.remove();
    return resolved;
};

/** Keyboard focus draws the Designsystemet double ring: an outer outline and an inner box-shadow. */
export const FocusMatchesDesignsystemet: Story = {
    render: () => (
        <div style={{ display: 'grid' }}>
            {SCHEMES.map((scheme) => (
                <Cell key={scheme} scheme={scheme} size='md'>
                    <Controls id={`focus-${scheme}`} />
                </Cell>
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const scheme of SCHEMES) {
            const cell = canvas.getByTestId(`ds-${scheme}-md`);
            const button = within(cell).getByRole('button', { name: 'Save' });
            button.focus();
            await userEvent.tab({ shift: true });
            await userEvent.tab();
            await expect(button).toHaveFocus();

            const style = getComputedStyle(button);
            const outer = resolve(button, 'color', 'var(--ds-color-focus-outer)');
            const inner = resolve(button, 'color', 'var(--ds-color-focus-inner)');
            await expect(style.outlineStyle).not.toBe('none');
            await expect(style.outlineColor).toBe(outer);
            await expect(style.boxShadow).toContain(inner);
        }
    },
};
