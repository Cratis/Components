// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { PivotViewer } from './PivotViewer';

interface SampleCard {
    id: number;
    title: string;
    group: string;
}

const cards: SampleCard[] = Array.from({ length: 600 }, (_, index) => ({
    id: index + 1,
    title: `Sample Card ${index + 1}`,
    group: `Group ${Math.floor(index / 100) + 1}`,
}));

export default {
    title: 'PivotViewer/Viewport Recovery',
    component: PivotViewer,
} satisfies Meta<typeof PivotViewer>;

type Story = StoryObj<typeof PivotViewer>;

type ProbeCanvas = HTMLCanvasElement & { __pivotVisibleCardCount?: () => number };

export const RegroupAndScroll: Story = {
    render: () => (
        <div style={{ width: 680, height: 440, display: 'flex', flexDirection: 'column' }}>
            <PivotViewer<SampleCard>
                data={cards}
                dimensions={[{ key: 'group', label: 'Group', getValue: card => card.group }]}
                filters={[]}
                cardRenderer={card => ({ title: card.title })}
                getItemId={card => card.id}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const root = within(canvasElement);
        const viewport = canvasElement.querySelector('.pv-viewport') as HTMLDivElement;
        await waitFor(() => expect(canvasElement.querySelector('canvas')).not.toBeNull());
        const canvas = canvasElement.querySelector('canvas') as ProbeCanvas;
        await waitFor(() => expect(canvas.__pivotVisibleCardCount?.()).toBeGreaterThan(0), { timeout: 8000 });
        await userEvent.click(root.getByRole('button', { name: 'Grouped' }));
        // Each group has 100 bottom-up cards, so its earliest layout entries start well
        // outside the 440px viewport. Move away from the automatic bottom alignment.
        await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(1200), { timeout: 8000 });
        viewport.scrollTop = 1200;
        viewport.dispatchEvent(new Event('scroll'));
        await waitFor(() => expect(viewport.scrollTop).toBe(1200));
        await waitFor(() => expect(canvas.__pivotVisibleCardCount?.()).toBeGreaterThan(0), { timeout: 8000 });
    },
};
