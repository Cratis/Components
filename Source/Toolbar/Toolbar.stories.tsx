// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { useState, type DragEvent } from 'react';
import { Toolbar } from './Toolbar';
import { ToolbarButton } from './ToolbarButton';
import { ToolbarContext } from './ToolbarContext';
import { ToolbarFanOutItem } from './ToolbarFanOutItem';
import { ToolbarSection } from './ToolbarSection';
import { ToolbarSeparator } from './ToolbarSeparator';

const meta: Meta<typeof Toolbar> = {
    title: 'Components/Toolbar',
    component: Toolbar,
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<typeof Toolbar>;

/**
 * Demonstrates that any React node can be used as an icon on {@link ToolbarButton} and
 * {@link ToolbarFanOutItem} — here using inline SVG elements in place of PrimeIcons CSS
 * class strings.
 *
 * Existing string-based usage is unchanged; the `icon` prop now accepts `string | ReactNode`.
 */
export const WithReactNodeIcons: Story = {
    render: () => {
        const CircleIcon = () => (
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='20' height='20' fill='currentColor' aria-hidden='true'>
                <circle cx='12' cy='12' r='10' />
            </svg>
        );
        const SquareIcon = () => (
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='20' height='20' fill='currentColor' aria-hidden='true'>
                <rect x='3' y='3' width='18' height='18' rx='2' />
            </svg>
        );
        const StarIcon = () => (
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='20' height='20' fill='currentColor' aria-hidden='true'>
                <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
            </svg>
        );
        const TriangleIcon = () => (
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='20' height='20' fill='currentColor' aria-hidden='true'>
                <path d='M12 2L2 22h20L12 2z' />
            </svg>
        );
        const PentagonIcon = () => (
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='20' height='20' fill='currentColor' aria-hidden='true'>
                <path d='M12 2l9.5 6.9-3.6 11.1H6.1L2.5 8.9 12 2z' />
            </svg>
        );

        return (
            <Toolbar>
                <ToolbarButton icon={<CircleIcon />} tooltip='Circle' />
                <ToolbarButton icon={<SquareIcon />} tooltip='Rectangle' />
                <ToolbarFanOutItem icon={<StarIcon />} tooltip='More shapes'>
                    <ToolbarButton icon={<TriangleIcon />} tooltip='Triangle' />
                    <ToolbarButton icon={<PentagonIcon />} tooltip='Pentagon' />
                </ToolbarFanOutItem>
                {/* String-based icons still work unchanged */}
                <ToolbarButton icon='pi pi-undo' tooltip='Undo' />
            </Toolbar>
        );
    },
};

/** A single toolbar group with several drawing-tool buttons. */
export const Default: Story = {
    render: () => (
        <Toolbar>
            <ToolbarButton icon='pi pi-arrow-up-left' tooltip='Select' />
            <ToolbarButton icon='pi pi-clone' tooltip='Layers' />
            <ToolbarButton icon='pi pi-circle' tooltip='Shapes' />
            <ToolbarButton icon='pi pi-stop' tooltip='Rectangle' />
            <ToolbarButton icon='pi pi-file' tooltip='Sticky note' />
        </Toolbar>
    ),
};

/** Two separate toolbar groups displayed side-by-side, mirroring the Miro-style layout. */
export const MultipleGroups: Story = {
    render: () => (
        <div className='flex flex-col gap-2'>
            <Toolbar>
                <ToolbarButton icon='pi pi-arrow-up-left' tooltip='Select' />
                <ToolbarButton icon='pi pi-clone' tooltip='Layers' />
                <ToolbarButton icon='pi pi-circle' tooltip='Shapes' />
                <ToolbarButton icon='pi pi-stop' tooltip='Rectangle' />
                <ToolbarButton icon='pi pi-file' tooltip='Sticky note' />
            </Toolbar>
            <Toolbar>
                <ToolbarButton icon='pi pi-undo' tooltip='Undo' />
                <ToolbarButton icon='pi pi-refresh' tooltip='Redo' />
            </Toolbar>
        </div>
    ),
};

/** Demonstrates the active (selected) state of a toolbar button. */
export const WithActiveButton: Story = {
    render: () => {
        const ActiveDemo = () => {
            const [active, setActive] = useState<string>('select');

            return (
                <Toolbar>
                    <ToolbarButton
                        icon='pi pi-arrow-up-left'
                        tooltip='Select'
                        active={active === 'select'}
                        onClick={() => setActive('select')}
                    />
                    <ToolbarButton
                        icon='pi pi-clone'
                        tooltip='Layers'
                        active={active === 'layers'}
                        onClick={() => setActive('layers')}
                    />
                    <ToolbarButton
                        icon='pi pi-stop'
                        tooltip='Rectangle'
                        active={active === 'rectangle'}
                        onClick={() => setActive('rectangle')}
                    />
                    <ToolbarButton
                        icon='pi pi-file'
                        tooltip='Sticky note'
                        active={active === 'sticky'}
                        onClick={() => setActive('sticky')}
                    />
                </Toolbar>
            );
        };

        return <ActiveDemo />;
    },
};

/**
 * Demonstrates animated context switching within a single toolbar section.
 *
 * Click the buttons below the toolbar to switch between the "Drawing" and "Text"
 * contexts. The section fades its current items out, morphs to the new size, then
 * fades the new items in — while other sections (if present) remain unchanged.
 */
export const WithContexts: Story = {
    render: () => {
        const WithContextsDemo = () => {
            const [currentContext, setCurrentContext] = useState<string>('drawing');

            return (
                <div className='flex flex-col items-center gap-6'>
                    <Toolbar>
                        <ToolbarButton icon='pi pi-arrow-up-left' tooltip='Select' />
                        <ToolbarSection activeContext={currentContext}>
                            <ToolbarContext name='drawing'>
                                <ToolbarButton icon='pi pi-pencil' tooltip='Draw' />
                                <ToolbarButton icon='pi pi-stop' tooltip='Rectangle' />
                                <ToolbarButton icon='pi pi-circle' tooltip='Circle' />
                                <ToolbarButton icon='pi pi-minus' tooltip='Line' />
                            </ToolbarContext>
                            <ToolbarContext name='text'>
                                <ToolbarButton icon='pi pi-align-center' tooltip='Align Center' />
                                <ToolbarButton icon='pi pi-align-left' tooltip='Align Left' />
                            </ToolbarContext>
                        </ToolbarSection>
                        <ToolbarButton icon='pi pi-undo' tooltip='Undo' />
                    </Toolbar>

                    <div className='flex gap-2'>
                        <button
                            type='button'
                            onClick={() => setCurrentContext('drawing')}
                            className={`px-3 py-1 rounded text-sm transition-colors ${currentContext === 'drawing'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                                }`}
                        >
                            Drawing tools
                        </button>
                        <button
                            type='button'
                            onClick={() => setCurrentContext('text')}
                            className={`px-3 py-1 rounded text-sm transition-colors ${currentContext === 'text'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                                }`}
                        >
                            Text tools
                        </button>
                    </div>
                </div>
            );
        };

        return <WithContextsDemo />;
    },
};

/**
 * Demonstrates {@link ToolbarSeparator} in a horizontal toolbar.
 *
 * The separator renders as a thin vertical line between groups of buttons,
 * matching the style seen in canvas-based tools (e.g. Miro, Figma).
 * When the toolbar is vertical the line is horizontal.
 */
export const WithSeparators: Story = {
    render: () => (
        <Toolbar orientation='horizontal'>
            <ToolbarButton icon='pi pi-th-large' tooltip='Overview' tooltipPosition='bottom' />
            <ToolbarSeparator orientation='horizontal' />
            <ToolbarButton icon='pi pi-minus' tooltip='Zoom out' tooltipPosition='bottom' />
            <ToolbarButton icon='pi pi-plus' tooltip='Zoom in' tooltipPosition='bottom' />
            <ToolbarSeparator orientation='horizontal' />
            <ToolbarButton icon='pi pi-question-circle' tooltip='Help' tooltipPosition='bottom' />
        </Toolbar>
    ),
};

/**
 * Demonstrates a zoom-style horizontal toolbar where the center text button
 * resets the zoom level to 100% when clicked.
 */
export const ZoomBar: Story = {
    render: () => {
        const ZoomBarDemo = () => {
            const [zoom, setZoom] = useState<number>(120);

            const zoomOut = () => setZoom(current => Math.max(50, current - 10));
            const zoomIn = () => setZoom(current => Math.min(300, current + 10));
            const resetZoom = () => setZoom(100);

            return (
                <Toolbar orientation='horizontal'>
                    <ToolbarButton icon='pi pi-th-large' tooltip='Overview' tooltipPosition='bottom' />
                    <ToolbarSeparator orientation='horizontal' />
                    <ToolbarButton icon='pi pi-minus' tooltip='Zoom out' tooltipPosition='bottom' onClick={zoomOut} />
                    <ToolbarButton text={`${zoom}%`} tooltip='Reset zoom' tooltipPosition='bottom' onClick={resetZoom} />
                    <ToolbarButton icon='pi pi-plus' tooltip='Zoom in' tooltipPosition='bottom' onClick={zoomIn} />
                    <ToolbarSeparator orientation='horizontal' />
                    <ToolbarButton icon='pi pi-question-circle' tooltip='Help' tooltipPosition='bottom' />
                </Toolbar>
            );
        };

        return <ZoomBarDemo />;
    },
};

/**
 * Demonstrates a {@link ToolbarFanOutItem} inside a vertical toolbar.
 *
 * Click the "Shapes" button to expand the fan-out panel to the right.
 * Click the button again or anywhere outside the panel to collapse it.
 */
export const WithFanOut: Story = {
    render: () => {
        const WithFanOutDemo = () => {
            const [activeTool, setActiveTool] = useState<string>('select');

            return (
                <div className='flex flex-col gap-2'>
                    <Toolbar>
                        <ToolbarButton
                            icon='pi pi-arrow-up-left'
                            tooltip='Select'
                            active={activeTool === 'select'}
                            onClick={() => setActiveTool('select')}
                        />
                        <ToolbarFanOutItem
                            icon='pi pi-th-large'
                            tooltip='Shapes'
                        >
                            <ToolbarButton icon='pi pi-th-large' tooltip='Shapes' onClick={() => setActiveTool('shapes')} />
                            <ToolbarButton icon='pi pi-exclamation-circle' tooltip='Info' onClick={() => setActiveTool('info')} />
                            <ToolbarButton icon='pi pi-eye' tooltip='Preview' onClick={() => setActiveTool('preview')} />
                            <ToolbarButton icon='pi pi-cog' tooltip='Settings' onClick={() => setActiveTool('settings')} />
                            <ToolbarButton icon='pi pi-external-link' tooltip='Open' onClick={() => setActiveTool('open')} />
                        </ToolbarFanOutItem>
                        <ToolbarButton
                            icon='pi pi-stop'
                            tooltip='Rectangle'
                            active={activeTool === 'rectangle'}
                            onClick={() => setActiveTool('rectangle')}
                        />
                        <ToolbarButton
                            icon='pi pi-file'
                            tooltip='Sticky note'
                            active={activeTool === 'sticky'}
                            onClick={() => setActiveTool('sticky')}
                        />
                    </Toolbar>
                    <Toolbar>
                        <ToolbarButton icon='pi pi-undo' tooltip='Undo' />
                        <ToolbarButton icon='pi pi-refresh' tooltip='Redo' />
                    </Toolbar>
                </div>
            );
        };

        return <WithFanOutDemo />;
    },
};

/**
 * Demonstrates dragging toolbar buttons onto a canvas surface.
 *
 * Each button carries `data` that identifies the tool. Drag any button from the toolbar
 * and drop it onto the canvas area to see the tool type that was dropped.
 *
 * The toolbar-level `draggable` prop makes every child button draggable automatically;
 * individual buttons can still opt out by setting `draggable={false}`.
 */
export const DragAndDrop: Story = {
    render: () => {
        const DragAndDropDemo = () => {
            const [dropped, setDropped] = useState<string | null>(null);
            const [isDragOver, setIsDragOver] = useState(false);

            return (
                <div className='flex gap-6 items-start'>
                    <Toolbar
                        draggable
                        onItemDragStart={(data) =>
                            setDropped(`Dragging: ${(data as { tool: string }).tool}`)
                        }
                    >
                        <ToolbarButton icon='pi pi-pencil' tooltip='Pencil' data={{ tool: 'pencil' }} />
                        <ToolbarButton icon='pi pi-stop' tooltip='Rectangle' data={{ tool: 'rectangle' }} />
                        <ToolbarButton icon='pi pi-circle' tooltip='Circle' data={{ tool: 'circle' }} />
                        <ToolbarButton icon='pi pi-minus' tooltip='Line' data={{ tool: 'line' }} />
                    </Toolbar>

                    <div
                        onDragOver={(event: DragEvent<HTMLDivElement>) => { event.preventDefault?.(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(event: DragEvent<HTMLDivElement>) => {
                            event.preventDefault?.();
                            setIsDragOver(false);
                            const raw = event.dataTransfer.getData('application/json');
                            const data = JSON.parse(raw) as { tool: string } | null;
                            setDropped(data ? `Dropped: ${data.tool}` : 'Dropped: (no data)');
                        }}
                        className='flex items-center justify-center rounded-xl border-2 border-dashed transition-colors'
                        style={{
                            width: 240,
                            height: 180,
                            borderColor: isDragOver ? 'var(--primary-color)' : 'var(--surface-border)',
                            background: isDragOver ? 'var(--highlight-bg)' : 'var(--surface-card)',
                            color: 'var(--text-color-secondary)',
                            fontSize: '0.875rem',
                        }}
                    >
                        {dropped ?? 'Drop a tool here'}
                    </div>
                </div>
            );
        };

        return <DragAndDropDemo />;
    },
};
