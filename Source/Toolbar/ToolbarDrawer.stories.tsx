// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { useState, type DragEvent } from 'react';
import {
    FaBars,
    FaBorderAll,
    FaCircle,
    FaGripLines,
    FaHouse,
    FaLayerGroup,
    FaSquare,
    FaTableCellsLarge,
    FaTableColumns,
} from 'react-icons/fa6';
import { Toolbar } from './Toolbar';
import { ToolbarButton } from './ToolbarButton';
import { ToolbarFolder } from './ToolbarFolder';
import type { ToolbarDrawerItem } from './ToolbarDrawerItem';

const meta: Meta<typeof ToolbarFolder> = {
    title: 'Toolbar/Drawer',
    component: ToolbarFolder,
    parameters: {
        layout: 'centered',
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The catalogue belongs to the host. Stack, Row, Grid and Container are illustrative; "Masonry" is a
 * synthetic extra type that the drawer renders without any change to its internals.
 */
const layoutCatalogue: ToolbarDrawerItem[] = [
    { id: 'stack', title: 'Stack', icon: <FaBars aria-hidden='true' />, payload: { type: 'stack', direction: 'vertical' } },
    { id: 'row', title: 'Row', icon: <FaGripLines aria-hidden='true' />, payload: { type: 'row', direction: 'horizontal' } },
    { id: 'grid', title: 'Grid', icon: <FaTableCellsLarge aria-hidden='true' />, payload: { type: 'grid', columns: 2 } },
    { id: 'container', title: 'Container', icon: <FaSquare aria-hidden='true' />, payload: { type: 'container' } },
    { id: 'masonry', title: 'Masonry', icon: <FaBorderAll aria-hidden='true' />, payload: { type: 'masonry', columns: 3 } },
    {
        id: 'split',
        title: 'Split',
        icon: <FaTableColumns aria-hidden='true' />,
        payload: { type: 'split' },
        disabled: true,
        disabledReason: 'The current template does not allow new split layouts',
    },
];

const surfaceStyle = {
    width: 260,
    minHeight: 200,
    padding: '1rem',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    color: 'var(--cratis-text-color-secondary)',
    background: 'var(--cratis-surface-card)',
};

/** A sample consumer surface. It owns the drop: Components only delivers the payload. */
const SampleSurface = ({ log, onInsert }: { log: string[]; onInsert: (payload: unknown, how: string) => void }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    return (
        <div
            data-testid='surface'
            onDragOver={(event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(event: DragEvent<HTMLDivElement>) => {
                event.preventDefault();
                setIsDragOver(false);
                onInsert(JSON.parse(event.dataTransfer.getData('application/json')), 'drop');
            }}
            style={{
                ...surfaceStyle,
                border: `2px dashed ${isDragOver ? 'var(--cratis-primary-color)' : 'var(--cratis-surface-border)'}`,
            }}
        >
            <strong>Sample surface</strong>
            <ol data-testid='insertions' style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
                {log.map((entry, index) => (
                    <li key={`${entry}-${index}`}>{entry}</li>
                ))}
            </ol>
        </div>
    );
};

const LayoutDrawerDemo = ({ orientation = 'vertical' }: { orientation?: 'vertical' | 'horizontal' }) => {
    const [log, setLog] = useState<string[]>([]);
    const insert = (payload: unknown, how: string) =>
        setLog((current) => [...current, `${how}: ${JSON.stringify(payload)}`]);

    return (
        <div className='cratis:flex cratis:gap-6 cratis:items-start' style={{ minHeight: 360 }}>
            <Toolbar orientation={orientation} aria-label='Editor tools'>
                <ToolbarButton icon={<FaHouse aria-hidden='true' />} title='Home' />
                <ToolbarFolder
                    icon={<FaLayerGroup aria-hidden='true' />}
                    title='Layout'
                    presentation='drawer'
                    items={layoutCatalogue}
                    onActivate={(item) => insert(item.payload, 'click')}
                />
            </Toolbar>
            <SampleSurface log={log} onInsert={insert} />
        </div>
    );
};

/**
 * A headed **Layout** drawer. Each tile shows an icon and an always-visible title. Click, Enter and
 * Space activate a tile (the consumer decides where to insert); dragging a tile onto the sample
 * surface delivers the exact payload.
 */
export const Layout: Story = {
    render: () => <LayoutDrawerDemo />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: 'Layout' });
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await userEvent.click(trigger);
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));

        const group = canvas.getByRole('group', { name: 'Layout' });
        await expect(within(group).getByRole('button', { name: 'Masonry' })).toBeVisible();
        await userEvent.click(within(group).getByRole('button', { name: 'Masonry' }));
        await expect(canvas.getByTestId('insertions')).toHaveTextContent('click: {"type":"masonry","columns":3}');

        const split = within(group).getByRole('button', { name: /Split/ });
        await expect(split).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(split);
        await expect(canvas.getByTestId('insertions').children).toHaveLength(1);

        await userEvent.click(within(group).getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
        await waitFor(() => expect(trigger).toHaveFocus());
    },
};

/** The drawer can close itself once an item has been inserted. */
export const ClosesAfterInsert: Story = {
    render: () => {
        const Demo = () => {
            const [log, setLog] = useState<string[]>([]);
            return (
                <div className='cratis:flex cratis:gap-6 cratis:items-start' style={{ minHeight: 360 }}>
                    <Toolbar aria-label='Editor tools'>
                        <ToolbarFolder
                            icon={<FaLayerGroup aria-hidden='true' />}
                            title='Layout'
                            presentation='drawer'
                            items={layoutCatalogue}
                            closeOnInsert
                            onActivate={(item) => setLog((current) => [...current, `click: ${item.id}`])}
                        />
                    </Toolbar>
                    <SampleSurface log={log} onInsert={() => undefined} />
                </div>
            );
        };
        return <Demo />;
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: 'Layout' });
        await userEvent.click(trigger);
        await userEvent.click(await canvas.findByRole('button', { name: 'Stack' }));
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
        await waitFor(() => expect(trigger).toHaveFocus());
    },
};

/** Keyboard path: Enter on a focused tile activates it; Escape closes the drawer and returns focus. */
export const KeyboardActivation: Story = {
    render: () => <LayoutDrawerDemo />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: 'Layout' });
        await userEvent.click(trigger);
        const tile = await canvas.findByRole('button', { name: 'Grid' });
        tile.focus();
        await userEvent.keyboard('{Enter}');
        await expect(canvas.getByTestId('insertions')).toHaveTextContent('click: {"type":"grid","columns":2}');
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
        await waitFor(() => expect(trigger).toHaveFocus());
    },
};

/** Long and localized titles wrap to two lines and keep the full title as the accessible name. */
export const LongLocalizedTitles: Story = {
    render: () => (
        <Toolbar aria-label='Editor tools'>
            <ToolbarFolder
                icon={<FaLayerGroup aria-hidden='true' />}
                title='Oppsett'
                heading='Oppsett og strukturelementer'
                closeLabel='Lukk'
                presentation='drawer'
                items={[
                    { id: 'stack', title: 'Vertikal stabel', icon: <FaBars aria-hidden='true' />, payload: 'stack' },
                    { id: 'row', title: 'Horisontal rekke', icon: <FaGripLines aria-hidden='true' />, payload: 'row' },
                    { id: 'grid', title: 'Fleksibelt rutenett med tilpassede kolonner', icon: <FaTableCellsLarge aria-hidden='true' />, payload: 'grid' },
                    { id: 'container', title: 'Beholder', icon: <FaSquare aria-hidden='true' />, payload: 'container' },
                ]}
            />
        </Toolbar>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Oppsett' }));
        await expect(await canvas.findByRole('button', { name: 'Fleksibelt rutenett med tilpassede kolonner' })).toBeVisible();
        await expect(canvas.getByRole('button', { name: 'Lukk' })).toBeVisible();
    },
};

/**
 * Edge placement: the toolbar sits at the bottom of a short, narrow frame. The drawer slides up to
 * stay inside the viewport and scrolls when it still does not fit.
 */
export const EdgePlacement: Story = {
    parameters: { layout: 'fullscreen' },
    render: () => (
        <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 8, bottom: 8 }}>
                <Toolbar aria-label='Editor tools'>
                    <ToolbarFolder
                        icon={<FaLayerGroup aria-hidden='true' />}
                        title='Layout'
                        presentation='drawer'
                        items={layoutCatalogue}
                    />
                </Toolbar>
            </div>
            <div style={{ position: 'absolute', right: 8, top: 8 }}>
                <Toolbar aria-label='Right-edge tools' orientation='horizontal'>
                    <ToolbarFolder
                        icon={<FaCircle aria-hidden='true' />}
                        title='Right edge'
                        folderDirection='left'
                        presentation='drawer'
                        items={layoutCatalogue}
                    />
                </Toolbar>
            </div>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Layout' }));
        const panel = await canvas.findByRole('group', { name: 'Layout' });
        await waitFor(() => {
            const rectangle = panel.getBoundingClientRect();
            expect(rectangle.bottom).toBeLessThanOrEqual(window.innerHeight);
            expect(rectangle.top).toBeGreaterThanOrEqual(0);
        });
    },
};

/** A drawer composed from children: ToolbarButton renders as a labeled tile inside a drawer folder. */
export const ComposedFromChildren: Story = {
    render: () => (
        <Toolbar aria-label='Editor tools' draggable>
            <ToolbarFolder icon={<FaLayerGroup aria-hidden='true' />} title='Shapes' presentation='drawer'>
                <ToolbarButton icon={<FaSquare aria-hidden='true' />} title='Square' data={{ shape: 'square' }} />
                <ToolbarButton icon={<FaCircle aria-hidden='true' />} title='Circle' data={{ shape: 'circle' }} />
            </ToolbarFolder>
        </Toolbar>
    ),
};
