// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { IconDisplay } from './Icon';

const meta: Meta<typeof IconDisplay> = {
    title: 'Common/IconDisplay',
    component: IconDisplay,
    parameters: {
        layout: 'centered',
    },
};

export default meta;
type Story = StoryObj<typeof IconDisplay>;

/** Renders a PrimeIcons CSS class as an `<i>` element. */
export const StringIcon: Story = {
    render: () => <IconDisplay icon='pi pi-home' />,
};

/** Renders a PrimeIcons CSS class with an additional size class. */
export const StringIconWithExtraClass: Story = {
    render: () => <IconDisplay icon='pi pi-home' className='text-3xl' />,
};

/** Renders an SVG React node directly — no wrapping `<i>` element is produced. */
export const SvgReactNode: Story = {
    render: () => (
        <IconDisplay
            icon={
                <svg
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 24 24'
                    width='24'
                    height='24'
                    fill='currentColor'
                    aria-hidden='true'
                >
                    <path d='M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z' />
                </svg>
            }
        />
    ),
};

/** Renders any arbitrary React element — here a styled emoji span — as an icon. */
export const ArbitraryReactNode: Story = {
    render: () => (
        <IconDisplay icon={<span style={{ fontSize: '1.5rem' }}>🚀</span>} />
    ),
};

/**
 * Side-by-side comparison of the same logical "home" icon expressed as
 * a CSS-class string versus a custom SVG React node.
 */
export const StringVsReactNode: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <IconDisplay icon='pi pi-home' className='text-2xl' />
                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-color-secondary)' }}>
                    string (CSS class)
                </p>
            </div>
            <div style={{ textAlign: 'center' }}>
                <IconDisplay
                    icon={
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            viewBox='0 0 24 24'
                            width='24'
                            height='24'
                            fill='currentColor'
                            aria-hidden='true'
                        >
                            <path d='M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' />
                        </svg>
                    }
                />
                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-color-secondary)' }}>
                    ReactNode (SVG)
                </p>
            </div>
        </div>
    ),
};
