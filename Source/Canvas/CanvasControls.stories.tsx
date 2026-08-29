// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { useRef } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CanvasControls } from './CanvasControls';

const meta = {
    title: 'Canvas/CanvasControls',
    component: CanvasControls,
    parameters: { layout: 'fullscreen' },
    tags: ['autodocs'],
    args: {
        getZoom: () => 1,
        onZoomIn: fn(),
        onZoomOut: fn(),
        onZoomReset: fn(),
        onHelp: fn(),
        showMinimapToggle: true,
    },
    decorators: [
        (Story) => (
            <div style={{ position: 'relative', width: '100vw', height: '20rem' }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof CanvasControls>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Standalone controls expose named zoom, minimap, and optional help actions. */
export const Playground: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Zoom In' }));
        await expect(args.onZoomIn).toHaveBeenCalledOnce();
        await userEvent.click(canvas.getByRole('button', { name: 'Help' }));
        await expect(args.onHelp).toHaveBeenCalledOnce();
        await userEvent.click(canvas.getByRole('button', { name: 'Toggle minimap' }));
        const minimap = canvasElement.querySelector('.canvas-minimap');
        if (!minimap) throw new Error('Canvas minimap did not render.');
        await expect(minimap).toBeVisible();
    },
};

/** A host-owned zoom value and localized accessible names remain synchronized. */
export const LocalizedControlledZoom: Story = {
    render: (args) => {
        const LocalizedControlledZoomDemo = () => {
            const zoom = useRef(0.75);
            return (
                <CanvasControls
                    {...args}
                    getZoom={() => zoom.current}
                    labels={{
                        zoomOut: 'Reduce scale',
                        resetZoom: 'Reset scale',
                        zoomIn: 'Increase scale',
                        help: 'Open help',
                    }}
                    onZoomIn={() => {
                        zoom.current += 0.25;
                    }}
                    onZoomOut={() => {
                        zoom.current -= 0.25;
                    }}
                    onZoomReset={() => {
                        zoom.current = 1;
                    }}
                    showMinimapToggle={false}
                />
            );
        };
        return <LocalizedControlledZoomDemo />;
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const readout = canvas.getByRole('button', { name: 'Reset scale' });
        await expect(readout).toHaveTextContent('75%');
        await userEvent.click(canvas.getByRole('button', { name: 'Increase scale' }));
        await expect(readout).toHaveTextContent('100%');
        await userEvent.click(canvas.getByRole('button', { name: 'Reduce scale' }));
        await expect(readout).toHaveTextContent('75%');
    },
};
