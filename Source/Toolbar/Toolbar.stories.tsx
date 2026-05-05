// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState, type DragEvent } from 'react';
import { Toolbar } from './Toolbar';
import { ToolbarButton } from './ToolbarButton';
import { ToolbarContext } from './ToolbarContext';
import { ToolbarFanOutItem } from './ToolbarFanOutItem';
import { ToolbarFolder } from './ToolbarFolder';
import { ToolbarGroup } from './ToolbarGroup';
import { ToolbarSection } from './ToolbarSection';
import { ToolbarSeparator } from './ToolbarSeparator';
import { ToolbarSlot, ToolbarSlotProvider } from './ToolbarSlot';

const meta: Meta<typeof Toolbar> = {
    title: 'Components/Toolbar',
    component: Toolbar,
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<typeof Toolbar>;

const folderIcons: string[] = [
    'pi pi-exclamation-circle',
    'pi pi-eye',
    'pi pi-cog',
    'pi pi-external-link',
    'pi pi-clock',
    'pi pi-globe',
    'pi pi-bookmark',
    'pi pi-send',
    'pi pi-search',
    'pi pi-car',
    'pi pi-box',
    'pi pi-bolt',
    'pi pi-database',
    'pi pi-cloud',
    'pi pi-star',
    'pi pi-heart',
    'pi pi-map',
    'pi pi-wifi',
    'pi pi-lock',
    'pi pi-bell',
];

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
                <ToolbarButton icon={<CircleIcon />} title='Circle' />
                <ToolbarButton icon={<SquareIcon />} title='Rectangle' />
                <ToolbarFanOutItem icon={<StarIcon />} tooltip='More shapes'>
                    <ToolbarButton icon={<TriangleIcon />} title='Triangle' />
                    <ToolbarButton icon={<PentagonIcon />} title='Pentagon' />
                </ToolbarFanOutItem>
                {/* String-based icons still work unchanged */}
                <ToolbarButton icon='pi pi-undo' title='Undo' />
            </Toolbar>
        );
    },
};

/** A single toolbar group with several drawing-tool buttons. */
export const Default: Story = {
    render: () => (
        <Toolbar>
            <ToolbarButton icon='pi pi-arrow-up-left' title='Select' />
            <ToolbarButton icon='pi pi-clone' title='Layers' />
            <ToolbarButton icon='pi pi-circle' title='Shapes' />
            <ToolbarButton icon='pi pi-stop' title='Rectangle' />
            <ToolbarButton icon='pi pi-file' title='Sticky note' />
        </Toolbar>
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
                        title='Select'
                        active={active === 'select'}
                        onClick={() => setActive('select')}
                    />
                    <ToolbarButton
                        icon='pi pi-clone'
                        title='Layers'
                        active={active === 'layers'}
                        onClick={() => setActive('layers')}
                    />
                    <ToolbarButton
                        icon='pi pi-stop'
                        title='Rectangle'
                        active={active === 'rectangle'}
                        onClick={() => setActive('rectangle')}
                    />
                    <ToolbarButton
                        icon='pi pi-file'
                        title='Sticky note'
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
                        <ToolbarButton icon='pi pi-arrow-up-left' title='Select' />
                        <ToolbarSection activeContext={currentContext}>
                            <ToolbarContext name='drawing'>
                                <ToolbarButton icon='pi pi-pencil' title='Draw' />
                                <ToolbarButton icon='pi pi-stop' title='Rectangle' />
                                <ToolbarButton icon='pi pi-circle' title='Circle' />
                                <ToolbarButton icon='pi pi-minus' title='Line' />
                            </ToolbarContext>
                            <ToolbarContext name='text'>
                                <ToolbarButton icon='pi pi-align-center' title='Align Center' />
                                <ToolbarButton icon='pi pi-align-left' title='Align Left' />
                            </ToolbarContext>
                        </ToolbarSection>
                        <ToolbarButton icon='pi pi-undo' title='Undo' />
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
            <ToolbarButton icon='pi pi-th-large' title='Overview' tooltipPosition='bottom' />
            <ToolbarSeparator orientation='horizontal' />
            <ToolbarButton icon='pi pi-minus' title='Zoom out' tooltipPosition='bottom' />
            <ToolbarButton icon='pi pi-plus' title='Zoom in' tooltipPosition='bottom' />
            <ToolbarSeparator orientation='horizontal' />
            <ToolbarButton icon='pi pi-question-circle' title='Help' tooltipPosition='bottom' />
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
                    <ToolbarButton icon='pi pi-th-large' title='Overview' tooltipPosition='bottom' />
                    <ToolbarSeparator orientation='horizontal' />
                    <ToolbarButton icon='pi pi-minus' title='Zoom out' tooltipPosition='bottom' onClick={zoomOut} />
                    <ToolbarButton text={`${zoom}%`} title='Reset zoom' tooltipPosition='bottom' onClick={resetZoom} />
                    <ToolbarButton icon='pi pi-plus' title='Zoom in' tooltipPosition='bottom' onClick={zoomIn} />
                    <ToolbarSeparator orientation='horizontal' />
                    <ToolbarButton icon='pi pi-question-circle' title='Help' tooltipPosition='bottom' />
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
                            title='Select'
                            active={activeTool === 'select'}
                            onClick={() => setActiveTool('select')}
                        />
                        <ToolbarFanOutItem
                            icon='pi pi-th-large'
                            tooltip='Shapes'
                        >
                            <ToolbarButton icon='pi pi-th-large' title='Shapes' onClick={() => setActiveTool('shapes')} />
                            <ToolbarButton icon='pi pi-exclamation-circle' title='Info' onClick={() => setActiveTool('info')} />
                            <ToolbarButton icon='pi pi-eye' title='Preview' onClick={() => setActiveTool('preview')} />
                            <ToolbarButton icon='pi pi-cog' title='Settings' onClick={() => setActiveTool('settings')} />
                            <ToolbarButton icon='pi pi-external-link' title='Open' onClick={() => setActiveTool('open')} />
                        </ToolbarFanOutItem>
                        <ToolbarButton
                            icon='pi pi-stop'
                            title='Rectangle'
                            active={activeTool === 'rectangle'}
                            onClick={() => setActiveTool('rectangle')}
                        />
                        <ToolbarButton
                            icon='pi pi-file'
                            title='Sticky note'
                            active={activeTool === 'sticky'}
                            onClick={() => setActiveTool('sticky')}
                        />
                    </Toolbar>
                    <Toolbar>
                        <ToolbarButton icon='pi pi-undo' title='Undo' />
                        <ToolbarButton icon='pi pi-refresh' title='Redo' />
                    </Toolbar>
                </div>
            );
        };

        return <WithFanOutDemo />;
    },
};

/** Demonstrates a folder with a single nested button. */
export const WithFolderOneButton: Story = {
    render: () => (
        <Toolbar>
            <ToolbarButton icon='pi pi-arrow-up-left' title='Select' />
            <ToolbarFolder icon='pi pi-th-large' title='Folder (1 item)'>
                <ToolbarButton icon={folderIcons[0]} title='Action 1' />
            </ToolbarFolder>
            <ToolbarButton icon='pi pi-stop' title='Rectangle' />
        </Toolbar>
    ),
};

/** Demonstrates a folder with four nested buttons in a balanced 2x2 grid. */
export const WithFolderFourButtons: Story = {
    render: () => (
        <Toolbar>
            <ToolbarButton icon='pi pi-arrow-up-left' title='Select' />
            <ToolbarFolder icon='pi pi-th-large' title='Folder (4 items)'>
                {folderIcons.slice(0, 4).map((icon, index) => (
                    <ToolbarButton key={`folder-4-${index}`} icon={icon} title={`Action ${index + 1}`} />
                ))}
            </ToolbarFolder>
            <ToolbarButton icon='pi pi-stop' title='Rectangle' />
        </Toolbar>
    ),
};

/** Demonstrates a folder with twenty nested buttons and dynamic multi-row sizing. */
export const WithFolderTwentyButtons: Story = {
    render: () => (
        <Toolbar>
            <ToolbarButton icon='pi pi-arrow-up-left' title='Select' />
            <ToolbarFolder icon='pi pi-th-large' title='Folder (20 items)'>
                {folderIcons.slice(0, 20).map((icon, index) => (
                    <ToolbarButton key={`folder-20-${index}`} icon={icon} title={`Action ${index + 1}`} />
                ))}
            </ToolbarFolder>
            <ToolbarButton icon='pi pi-stop' title='Rectangle' />
        </Toolbar>
    ),
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
                        <ToolbarButton icon='pi pi-pencil' title='Pencil' data={{ tool: 'pencil' }} />
                        <ToolbarButton icon='pi pi-stop' title='Rectangle' data={{ tool: 'rectangle' }} />
                        <ToolbarButton icon='pi pi-circle' title='Circle' data={{ tool: 'circle' }} />
                        <ToolbarButton icon='pi pi-minus' title='Line' data={{ tool: 'line' }} />
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

// ── ToolbarGroup ─────────────────────────────────────────────────────────────

/**
 * Demonstrates {@link ToolbarGroup} inside a vertical toolbar.
 *
 * Groups cluster related buttons into logical units. Adjacent groups receive a
 * subtle separator line so the visual structure is clear without needing explicit
 * {@link ToolbarSeparator} elements.
 */
export const WithGroups: Story = {
    render: () => (
        <Toolbar>
            <ToolbarGroup>
                <ToolbarButton icon='pi pi-arrow-up-left' title='Select' />
                <ToolbarButton icon='pi pi-hand-paper' title='Pan' />
            </ToolbarGroup>
            <ToolbarGroup>
                <ToolbarButton icon='pi pi-pencil' title='Draw' />
                <ToolbarButton icon='pi pi-stop' title='Rectangle' />
                <ToolbarButton icon='pi pi-circle' title='Circle' />
                <ToolbarButton icon='pi pi-minus' title='Line' />
            </ToolbarGroup>
            <ToolbarGroup>
                <ToolbarButton icon='pi pi-undo' title='Undo' />
                <ToolbarButton icon='pi pi-refresh' title='Redo' />
            </ToolbarGroup>
        </Toolbar>
    ),
};

// ── ToolbarFolder list mode ───────────────────────────────────────────────────

/**
 * Demonstrates {@link ToolbarFolder} in `list` mode.
 *
 * Each item in the folder shows the button's icon alongside its tooltip text as a
 * label. This is useful when the icon alone is not self-explanatory and a label
 * adds important context.
 */
export const WithFolderListMode: Story = {
    render: () => (
        <Toolbar>
            <ToolbarButton icon='pi pi-arrow-up-left' title='Select' />
            <ToolbarFolder icon='pi pi-th-large' title='Tools' mode='list'>
                <ToolbarButton icon='pi pi-pencil' title='Draw freehand' />
                <ToolbarButton icon='pi pi-stop' title='Rectangle' />
                <ToolbarButton icon='pi pi-circle' title='Ellipse' />
                <ToolbarButton icon='pi pi-minus' title='Straight line' />
            </ToolbarFolder>
            <ToolbarButton icon='pi pi-undo' title='Undo' />
        </Toolbar>
    ),
};

/**
 * Side-by-side comparison of grid mode (default) and list mode for {@link ToolbarFolder}.
 */
export const FolderGridVsList: Story = {
    render: () => (
        <div className='flex gap-8 items-start'>
            <div className='flex flex-col items-center gap-2'>
                <span style={{ color: 'var(--text-color-secondary)', fontSize: '0.75rem' }}>Grid (default)</span>
                <Toolbar>
                    <ToolbarFolder icon='pi pi-th-large' title='Tools' mode='grid'>
                        <ToolbarButton icon='pi pi-pencil' title='Draw' />
                        <ToolbarButton icon='pi pi-stop' title='Rectangle' />
                        <ToolbarButton icon='pi pi-circle' title='Ellipse' />
                        <ToolbarButton icon='pi pi-minus' title='Line' />
                        <ToolbarButton icon='pi pi-cog' title='Settings' />
                        <ToolbarButton icon='pi pi-star' title='Favorite' />
                    </ToolbarFolder>
                </Toolbar>
            </div>
            <div className='flex flex-col items-center gap-2'>
                <span style={{ color: 'var(--text-color-secondary)', fontSize: '0.75rem' }}>List</span>
                <Toolbar>
                    <ToolbarFolder icon='pi pi-list' title='Tools' mode='list'>
                        <ToolbarButton icon='pi pi-pencil' title='Draw freehand' />
                        <ToolbarButton icon='pi pi-stop' title='Rectangle' />
                        <ToolbarButton icon='pi pi-circle' title='Ellipse' />
                        <ToolbarButton icon='pi pi-minus' title='Straight line' />
                        <ToolbarButton icon='pi pi-cog' title='Settings' />
                        <ToolbarButton icon='pi pi-star' title='Favorite' />
                    </ToolbarFolder>
                </Toolbar>
            </div>
        </div>
    ),
};

// ── ToolbarSlot ───────────────────────────────────────────────────────────────

/**
 * Demonstrates two {@link ToolbarGroup}s where buttons in the first group drive the
 * content of the second group via the slot system.
 *
 * - **Group 1** — mode switcher (Draw / Shape / Select). Clicking a button marks it active.
 * - **Group 2** — context-sensitive tools injected via {@link ToolbarSlot}. The active mode
 *   component mounts a `ToolbarSlot` that fills the `'tool-options'` slot in group 2.
 *
 * No props flow between the two groups — they communicate only through the shared
 * {@link ToolbarSlotProvider} context.
 */
export const WithSlotInGroup: Story = {
    render: () => {
        const WithSlotInGroupDemo = () => {
            const [mode, setMode] = useState<'draw' | 'shape' | 'select'>('draw');

            // Each mode contributes its own set of tools into the 'tool-options' slot.
            // Draw mode has the most tools (8) to make slot transitions visually dramatic.
            const drawTools = useMemo(() => (
                <>
                    <ToolbarButton icon='pi pi-pencil' title='Pencil' />
                    <ToolbarButton icon='pi pi-eraser' title='Eraser' />
                    <ToolbarButton icon='pi pi-palette' title='Color' />
                    <ToolbarButton icon='pi pi-bolt' title='Airbrush' />
                    <ToolbarButton icon='pi pi-image' title='Stamp' />
                    <ToolbarButton icon='pi pi-filter' title='Blur' />
                    <ToolbarButton icon='pi pi-sun' title='Dodge' />
                    <ToolbarButton icon='pi pi-moon' title='Burn' />
                </>
            ), []);

            const shapeTools = useMemo(() => (
                <>
                    <ToolbarButton icon='pi pi-stop' title='Rectangle' />
                    <ToolbarButton icon='pi pi-circle' title='Circle' />
                    <ToolbarButton icon='pi pi-minus' title='Line' />
                    <ToolbarButton icon='pi pi-sort-up' title='Triangle' />
                    <ToolbarButton icon='pi pi-star' title='Polygon' />
                </>
            ), []);

            const selectTools = useMemo(() => (
                <>
                    <ToolbarButton icon='pi pi-arrows-alt' title='Move' />
                    <ToolbarButton icon='pi pi-clone' title='Duplicate' />
                    <ToolbarButton icon='pi pi-refresh' title='Rotate' />
                    <ToolbarButton icon='pi pi-expand' title='Scale' />
                </>
            ), []);

            return (
                <ToolbarSlotProvider>
                    {/* Slot filled by whichever mode is active — only one mounts at a time */}
                    {mode === 'draw' && <ToolbarSlot slotName='tool-options'>{drawTools}</ToolbarSlot>}
                    {mode === 'shape' && <ToolbarSlot slotName='tool-options'>{shapeTools}</ToolbarSlot>}
                    {mode === 'select' && <ToolbarSlot slotName='tool-options'>{selectTools}</ToolbarSlot>}

                    <Toolbar>
                        {/* Group 1: mode switcher — clicking a button changes which slot content is mounted */}
                        <ToolbarGroup>
                            <ToolbarButton icon='pi pi-pencil' title='Draw mode' active={mode === 'draw'} onClick={() => setMode('draw')} />
                            <ToolbarButton icon='pi pi-stop' title='Shape mode' active={mode === 'shape'} onClick={() => setMode('shape')} />
                            <ToolbarButton icon='pi pi-arrow-up-left' title='Select mode' active={mode === 'select'} onClick={() => setMode('select')} />
                        </ToolbarGroup>

                        {/* Group 2: receives context-sensitive tools from the active mode via the slot */}
                        <ToolbarGroup slotName='tool-options' />
                    </Toolbar>
                </ToolbarSlotProvider>
            );
        };

        return <WithSlotInGroupDemo />;
    },
};

/**
 * Demonstrates the slot system with {@link ToolbarContext} inside a {@link ToolbarSection}.
 *
 * Two independent controls are shown:
 * - **Context switcher** — animates the toolbar between `drawing` and `text` contexts.
 * - **Slot content switcher** — swaps what is injected into the `drawing-extras` slot
 *   while the context stays active, showing the slot updating live.
 */
export const WithSlotInContext: Story = {
    render: () => {
        const WithSlotInContextDemo = () => {
            const [currentContext, setCurrentContext] = useState<string>('drawing');
            const [slotContent, setSlotContent] = useState<'favorite' | 'bookmark' | 'none'>('favorite');

            const favoriteBtn = useMemo(() => <ToolbarButton icon='pi pi-star' title='Favorite' />, []);
            const bookmarkBtn = useMemo(() => <ToolbarButton icon='pi pi-bookmark' title='Bookmark' />, []);

            return (
                <ToolbarSlotProvider>
                    <div className='flex flex-col items-center gap-6'>
                        <Toolbar>
                            <ToolbarSection activeContext={currentContext}>
                                <ToolbarContext name='drawing' slotName='drawing-extras'>
                                    <ToolbarButton icon='pi pi-pencil' title='Draw' />
                                    <ToolbarButton icon='pi pi-stop' title='Rectangle' />
                                </ToolbarContext>
                                <ToolbarContext name='text'>
                                    <ToolbarButton icon='pi pi-align-left' title='Align Left' />
                                    <ToolbarButton icon='pi pi-align-center' title='Align Center' />
                                </ToolbarContext>
                            </ToolbarSection>
                        </Toolbar>

                        {/* Slot content is swapped by mounting a different ToolbarSlot */}
                        {slotContent === 'favorite' && <ToolbarSlot slotName='drawing-extras' order={5}>{favoriteBtn}</ToolbarSlot>}
                        {slotContent === 'bookmark' && <ToolbarSlot slotName='drawing-extras' order={5}>{bookmarkBtn}</ToolbarSlot>}

                        <div className='flex flex-col gap-4 items-center'>
                            <div className='flex flex-col gap-2 items-center'>
                                <span className='text-xs' style={{ color: 'var(--text-color-secondary)' }}>Context</span>
                                <div className='flex gap-2'>
                                    {(['drawing', 'text'] as const).map(ctx => (
                                        <button
                                            key={ctx}
                                            type='button'
                                            onClick={() => setCurrentContext(ctx)}
                                            className={`px-3 py-1 rounded text-sm transition-colors ${
                                                currentContext === ctx
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                                            }`}
                                        >
                                            {ctx}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className='flex flex-col gap-2 items-center'>
                                <span className='text-xs' style={{ color: 'var(--text-color-secondary)' }}>Slot content (drawing-extras)</span>
                                <div className='flex gap-2'>
                                    {(['none', 'favorite', 'bookmark'] as const).map(s => (
                                        <button
                                            key={s}
                                            type='button'
                                            onClick={() => setSlotContent(s)}
                                            className={`px-3 py-1 rounded text-sm transition-colors ${
                                                slotContent === s
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                                            }`}
                                        >
                                            {s === 'none' ? 'None' : s === 'favorite' ? 'Favorite ★' : 'Bookmark 🔖'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </ToolbarSlotProvider>
            );
        };

        return <WithSlotInContextDemo />;
    },
};

/**
 * Demonstrates multiple independent components each injecting a button into the same slot.
 * The `order` prop controls which injected button appears first (lower = earlier).
 */
export const WithMultipleSlotContributors: Story = {
    render: () => {
        const ButtonA = () => {
            const btn = useMemo(() => <ToolbarButton icon='pi pi-star' title='Slot A (order 10)' />, []);
            return <ToolbarSlot slotName='shared' order={10}>{btn}</ToolbarSlot>;
        };
        const ButtonB = () => {
            const btn = useMemo(() => <ToolbarButton icon='pi pi-heart' title='Slot B (order 5)' />, []);
            return <ToolbarSlot slotName='shared' order={5}>{btn}</ToolbarSlot>;
        };
        const ButtonC = () => {
            const btn = useMemo(() => <ToolbarButton icon='pi pi-bell' title='Slot C (order 20)' />, []);
            return <ToolbarSlot slotName='shared' order={20}>{btn}</ToolbarSlot>;
        };

        return (
            <ToolbarSlotProvider>
                <div className='flex gap-6 items-start'>
                    <Toolbar>
                        <ToolbarGroup slotName='shared'>
                            <ToolbarButton icon='pi pi-pencil' title='Draw (always first)' />
                        </ToolbarGroup>
                    </Toolbar>

                    <div
                        className='flex flex-col gap-1 p-4 rounded-lg border text-sm'
                        style={{ borderColor: 'var(--surface-border)', background: 'var(--surface-ground)', color: 'var(--text-color-secondary)' }}
                    >
                        <strong style={{ color: 'var(--text-color)' }}>Three independent contributors</strong>
                        <p>Rendered order: B (5) → A (10) → C (20)</p>
                        <ButtonA />
                        <ButtonB />
                        <ButtonC />
                    </div>
                </div>
            </ToolbarSlotProvider>
        );
    },
};
