// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { CanvasOverlay } from './CanvasOverlay';

const meta = {
    title: 'Canvas/CanvasOverlay',
    component: CanvasOverlay,
    parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CanvasOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InspectorPanel: Story = {
    args: {
        children: (
            <aside
                aria-label='Canvas inspector'
                style={{
                    position: 'fixed',
                    top: '2rem',
                    right: '2rem',
                    width: '18rem',
                    padding: '1rem',
                    border: '1px solid var(--cratis-surface-border)',
                    borderRadius: '0.75rem',
                    background: 'var(--cratis-surface-card)',
                    color: 'var(--cratis-text-color)',
                    boxShadow: 'var(--cratis-shadow-overlay)',
                }}
            >
                <strong>Canvas inspector</strong>
                <p style={{ color: 'var(--cratis-text-color-secondary)' }}>
                    Portaled content stays above the spatial surface.
                </p>
            </aside>
        ),
    },
};
