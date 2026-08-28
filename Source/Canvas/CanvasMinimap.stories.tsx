// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { CanvasMinimap, type CanvasMinimapHandle } from './CanvasMinimap';

const items = [
    { x: 120, y: 100, width: 240, height: 140, color: '#2563eb' },
    { x: 760, y: 340, width: 300, height: 180, color: '#047857' },
    { x: 1380, y: 720, width: 220, height: 160, color: '#b45309' },
];

const meta = {
    title: 'Canvas/CanvasMinimap',
    component: CanvasMinimap,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
    args: {
        worldWidth: 2000,
        worldHeight: 1200,
        items,
        onRequestPan: fn(),
    },
} satisfies Meta<typeof CanvasMinimap>;

export default meta;
type Story = StoryObj<typeof meta>;

/** World-space item rectangles provide a compact overview and pointer pan target. */
export const Playground: Story = {
    play: async ({ args, canvasElement }) => {
        const minimap = canvasElement.querySelector('.canvas-minimap');
        if (!minimap) throw new Error('Canvas minimap did not render.');
        await expect(canvasElement.querySelectorAll('.canvas-minimap-item')).toHaveLength(
            items.length,
        );
        await userEvent.click(minimap);
        await expect(args.onRequestPan).toHaveBeenCalledOnce();
    },
};

/** The imperative handle synchronizes the visible viewport with the parent camera. */
export const SynchronizedViewport: Story = {
    render: (args) => {
        const SynchronizedViewportDemo = () => {
            const minimap = useRef<CanvasMinimapHandle>(null);
            useEffect(() => {
                minimap.current?.update({ x: -600, y: -300 }, 1, 900, 600);
            }, []);
            return <CanvasMinimap {...args} ref={minimap} />;
        };
        return <SynchronizedViewportDemo />;
    },
    play: async ({ canvasElement }) => {
        const viewport = canvasElement.querySelector('.canvas-minimap-viewport');
        await expect(viewport).toHaveStyle({ left: '54px', top: '30px' });
    },
};
