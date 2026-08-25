// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState, type DragEvent } from 'react';
import type { IconType } from 'react-icons';
import {
    FaAlignCenter,
    FaAlignLeft,
    FaArrowPointer,
    FaArrowUpRightFromSquare,
    FaArrowsRotate,
    FaBell,
    FaBold,
    FaBolt,
    FaBookmark,
    FaCircle,
    FaCircleExclamation,
    FaCircleQuestion,
    FaClockRotateLeft,
    FaClone,
    FaComment,
    FaEraser,
    FaExpand,
    FaEye,
    FaFile,
    FaFilePen,
    FaFilter,
    FaFloppyDisk,
    FaFolderOpen,
    FaGear,
    FaHand,
    FaHeart,
    FaHouse,
    FaImage,
    FaLink,
    FaList,
    FaMinus,
    FaMoon,
    FaPalette,
    FaPencil,
    FaPlay,
    FaPlus,
    FaRotateLeft,
    FaShareNodes,
    FaSitemap,
    FaSortUp,
    FaSquare,
    FaSquareCheck,
    FaStar,
    FaStopwatch,
    FaSun,
    FaTable,
    FaTableCellsLarge,
    FaUnderline,
    FaUpDownLeftRight,
    FaUpload,
    FaWrench,
} from 'react-icons/fa6';
import { Toolbar } from './Toolbar';
import { ToolbarButton } from './ToolbarButton';
import { ToolbarContext } from './ToolbarContext';
import { ToolbarFanOutItem } from './ToolbarFanOutItem';
import { ToolbarFolder } from './ToolbarFolder';
import { ToolbarGroup } from './ToolbarGroup';
import { ToolbarSection } from './ToolbarSection';
import { ToolbarSeparator } from './ToolbarSeparator';
import { ToolbarSlot, ToolbarSlotProvider } from './ToolbarSlot';
import { ToolbarLayout } from './ToolbarLayout';

const meta: Meta<typeof Toolbar> = {
    title: 'Components/Toolbar',
    component: Toolbar,
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<typeof Toolbar>;

const toolIcons: Record<string, IconType> = {
    'align-center': FaAlignCenter,
    'align-left': FaAlignLeft,
    'arrow-up-left': FaArrowPointer,
    'arrows-alt': FaUpDownLeftRight,
    bell: FaBell,
    bold: FaBold,
    bolt: FaBolt,
    bookmark: FaBookmark,
    'check-square': FaSquareCheck,
    circle: FaCircle,
    clone: FaClone,
    cog: FaGear,
    comment: FaComment,
    eraser: FaEraser,
    'exclamation-circle': FaCircleExclamation,
    expand: FaExpand,
    'external-link': FaArrowUpRightFromSquare,
    eye: FaEye,
    file: FaFile,
    'file-edit': FaFilePen,
    filter: FaFilter,
    'folder-open': FaFolderOpen,
    'hand-paper': FaHand,
    heart: FaHeart,
    history: FaClockRotateLeft,
    home: FaHouse,
    image: FaImage,
    link: FaLink,
    list: FaList,
    minus: FaMinus,
    moon: FaMoon,
    palette: FaPalette,
    pencil: FaPencil,
    play: FaPlay,
    plus: FaPlus,
    'question-circle': FaCircleQuestion,
    refresh: FaArrowsRotate,
    save: FaFloppyDisk,
    'share-alt': FaShareNodes,
    sitemap: FaSitemap,
    'sort-up': FaSortUp,
    star: FaStar,
    stop: FaSquare,
    stopwatch: FaStopwatch,
    sun: FaSun,
    table: FaTable,
    'th-large': FaTableCellsLarge,
    underline: FaUnderline,
    undo: FaRotateLeft,
    upload: FaUpload,
};

const ToolGlyph = ({ name }: { name: string }) => {
    const Icon = toolIcons[name] ?? FaWrench;
    return <Icon aria-hidden='true' />;
};

const folderIcons: string[] = [
    'exclamation-circle',
    'eye',
    'cog',
    'external-link',
    'clock',
    'globe',
    'bookmark',
    'send',
    'search',
    'car',
    'box',
    'bolt',
    'database',
    'cloud',
    'star',
    'heart',
    'map',
    'wifi',
    'lock',
    'bell',
];

/**
 * Demonstrates that any React node can be used as an icon on {@link ToolbarButton} and
 * {@link ToolbarFanOutItem} — here using inline SVG elements instead of relying on an icon-font stylesheet.
 *
 * Consumer-owned icon-font class strings remain supported, while React nodes work without extra CSS.
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
                <ToolbarButton icon={<ToolGlyph name='undo' />} title='Undo' />
            </Toolbar>
        );
    },
};

/** A single toolbar group with several drawing-tool buttons. */
export const Default: Story = {
    render: () => (
        <Toolbar>
            <ToolbarButton icon={<ToolGlyph name='arrow-up-left' />} title='Select' />
            <ToolbarButton icon={<ToolGlyph name='clone' />} title='Layers' />
            <ToolbarButton icon={<ToolGlyph name='circle' />} title='Shapes' />
            <ToolbarButton icon={<ToolGlyph name='stop' />} title='Rectangle' />
            <ToolbarButton icon={<ToolGlyph name='file' />} title='Sticky note' />
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
                        icon={<ToolGlyph name='arrow-up-left' />}
                        title='Select'
                        active={active === 'select'}
                        onClick={() => setActive('select')}
                    />
                    <ToolbarButton
                        icon={<ToolGlyph name='clone' />}
                        title='Layers'
                        active={active === 'layers'}
                        onClick={() => setActive('layers')}
                    />
                    <ToolbarButton
                        icon={<ToolGlyph name='stop' />}
                        title='Rectangle'
                        active={active === 'rectangle'}
                        onClick={() => setActive('rectangle')}
                    />
                    <ToolbarButton
                        icon={<ToolGlyph name='file' />}
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
                <div className='cratis:flex cratis:flex-col cratis:items-center cratis:gap-6'>
                    <Toolbar>
                        <ToolbarButton icon={<ToolGlyph name='arrow-up-left' />} title='Select' />
                        <ToolbarSection activeContext={currentContext}>
                            <ToolbarContext name='drawing'>
                                <ToolbarButton icon={<ToolGlyph name='pencil' />} title='Draw' />
                                <ToolbarButton icon={<ToolGlyph name='stop' />} title='Rectangle' />
                                <ToolbarButton icon={<ToolGlyph name='circle' />} title='Circle' />
                                <ToolbarButton icon={<ToolGlyph name='minus' />} title='Line' />
                            </ToolbarContext>
                            <ToolbarContext name='text'>
                                <ToolbarButton icon={<ToolGlyph name='align-center' />} title='Align Center' />
                                <ToolbarButton icon={<ToolGlyph name='align-left' />} title='Align Left' />
                            </ToolbarContext>
                        </ToolbarSection>
                        <ToolbarButton icon={<ToolGlyph name='undo' />} title='Undo' />
                    </Toolbar>

                    <div className='cratis:flex cratis:gap-2'>
                        <button
                            type='button'
                            onClick={() => setCurrentContext('drawing')}
                            className={`cratis:px-3 cratis:py-1 cratis:rounded cratis:text-sm cratis:transition-colors ${currentContext === 'drawing'
                                ? 'cratis:bg-blue-600 cratis:text-white'
                                : 'cratis:bg-gray-600 cratis:text-gray-200 cratis:hover:bg-gray-500'
                                }`}
                        >
                            Drawing tools
                        </button>
                        <button
                            type='button'
                            onClick={() => setCurrentContext('text')}
                            className={`cratis:px-3 cratis:py-1 cratis:rounded cratis:text-sm cratis:transition-colors ${currentContext === 'text'
                                ? 'cratis:bg-blue-600 cratis:text-white'
                                : 'cratis:bg-gray-600 cratis:text-gray-200 cratis:hover:bg-gray-500'
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
            <ToolbarButton icon={<ToolGlyph name='th-large' />} title='Overview' tooltipPosition='bottom' />
            <ToolbarSeparator orientation='horizontal' />
            <ToolbarButton icon={<ToolGlyph name='minus' />} title='Zoom out' tooltipPosition='bottom' />
            <ToolbarButton icon={<ToolGlyph name='plus' />} title='Zoom in' tooltipPosition='bottom' />
            <ToolbarSeparator orientation='horizontal' />
            <ToolbarButton icon={<ToolGlyph name='question-circle' />} title='Help' tooltipPosition='bottom' />
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
                    <ToolbarButton icon={<ToolGlyph name='th-large' />} title='Overview' tooltipPosition='bottom' />
                    <ToolbarSeparator orientation='horizontal' />
                    <ToolbarButton icon={<ToolGlyph name='minus' />} title='Zoom out' tooltipPosition='bottom' onClick={zoomOut} />
                    <ToolbarButton text={`${zoom}%`} title='Reset zoom' tooltipPosition='bottom' onClick={resetZoom} />
                    <ToolbarButton icon={<ToolGlyph name='plus' />} title='Zoom in' tooltipPosition='bottom' onClick={zoomIn} />
                    <ToolbarSeparator orientation='horizontal' />
                    <ToolbarButton icon={<ToolGlyph name='question-circle' />} title='Help' tooltipPosition='bottom' />
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
                <div className='cratis:flex cratis:flex-col cratis:gap-2'>
                    <Toolbar>
                        <ToolbarButton
                            icon={<ToolGlyph name='arrow-up-left' />}
                            title='Select'
                            active={activeTool === 'select'}
                            onClick={() => setActiveTool('select')}
                        />
                        <ToolbarFanOutItem
                            icon={<ToolGlyph name='th-large' />}
                            tooltip='Shapes'
                        >
                            <ToolbarButton icon={<ToolGlyph name='th-large' />} title='Shapes' onClick={() => setActiveTool('shapes')} />
                            <ToolbarButton icon={<ToolGlyph name='exclamation-circle' />} title='Info' onClick={() => setActiveTool('info')} />
                            <ToolbarButton icon={<ToolGlyph name='eye' />} title='Preview' onClick={() => setActiveTool('preview')} />
                            <ToolbarButton icon={<ToolGlyph name='cog' />} title='Settings' onClick={() => setActiveTool('settings')} />
                            <ToolbarButton icon={<ToolGlyph name='external-link' />} title='Open' onClick={() => setActiveTool('open')} />
                        </ToolbarFanOutItem>
                        <ToolbarButton
                            icon={<ToolGlyph name='stop' />}
                            title='Rectangle'
                            active={activeTool === 'rectangle'}
                            onClick={() => setActiveTool('rectangle')}
                        />
                        <ToolbarButton
                            icon={<ToolGlyph name='file' />}
                            title='Sticky note'
                            active={activeTool === 'sticky'}
                            onClick={() => setActiveTool('sticky')}
                        />
                    </Toolbar>
                    <Toolbar>
                        <ToolbarButton icon={<ToolGlyph name='undo' />} title='Undo' />
                        <ToolbarButton icon={<ToolGlyph name='refresh' />} title='Redo' />
                    </Toolbar>
                </div>
            );
        };

        return <WithFanOutDemo />;
    },
};

/** Demonstrates a {@link ToolbarFanOutItem} that fans out downwards. */
export const WithFanOutDown: Story = {
    render: () => (
        <Toolbar orientation='horizontal'>
            <ToolbarButton icon={<ToolGlyph name='arrow-up-left' />} title='Select' tooltipPosition='bottom' />
            <ToolbarFanOutItem
                icon={<ToolGlyph name='th-large' />}
                tooltip='Shapes'
                tooltipPosition='bottom'
                fanOutDirection='down'
            >
                <ToolbarButton icon={<ToolGlyph name='th-large' />} title='Shapes' tooltipPosition='bottom' />
                <ToolbarButton icon={<ToolGlyph name='exclamation-circle' />} title='Info' tooltipPosition='bottom' />
                <ToolbarButton icon={<ToolGlyph name='eye' />} title='Preview' tooltipPosition='bottom' />
            </ToolbarFanOutItem>
            <ToolbarButton icon={<ToolGlyph name='stop' />} title='Rectangle' tooltipPosition='bottom' />
        </Toolbar>
    ),
};

/** Demonstrates a folder with a single nested button. */
export const WithFolderOneButton: Story = {
    render: () => (
        <Toolbar>
            <ToolbarButton icon={<ToolGlyph name='arrow-up-left' />} title='Select' />
            <ToolbarFolder icon={<ToolGlyph name='th-large' />} title='Folder (1 item)'>
                <ToolbarButton icon={<ToolGlyph name={folderIcons[0]} />} title='Action 1' />
            </ToolbarFolder>
            <ToolbarButton icon={<ToolGlyph name='stop' />} title='Rectangle' />
        </Toolbar>
    ),
};

/** Demonstrates a folder with four nested buttons in a balanced 2x2 grid. */
export const WithFolderFourButtons: Story = {
    render: () => (
        <Toolbar>
            <ToolbarButton icon={<ToolGlyph name='arrow-up-left' />} title='Select' />
            <ToolbarFolder icon={<ToolGlyph name='th-large' />} title='Folder (4 items)'>
                {folderIcons.slice(0, 4).map((icon, index) => (
                    <ToolbarButton key={`folder-4-${index}`} icon={<ToolGlyph name={icon} />} title={`Action ${index + 1}`} />
                ))}
            </ToolbarFolder>
            <ToolbarButton icon={<ToolGlyph name='stop' />} title='Rectangle' />
        </Toolbar>
    ),
};

/** Demonstrates a folder with twenty nested buttons and dynamic multi-row sizing. */
export const WithFolderTwentyButtons: Story = {
    render: () => (
        <Toolbar>
            <ToolbarButton icon={<ToolGlyph name='arrow-up-left' />} title='Select' />
            <ToolbarFolder icon={<ToolGlyph name='th-large' />} title='Folder (20 items)'>
                {folderIcons.slice(0, 20).map((icon, index) => (
                    <ToolbarButton key={`folder-20-${index}`} icon={<ToolGlyph name={icon} />} title={`Action ${index + 1}`} />
                ))}
            </ToolbarFolder>
            <ToolbarButton icon={<ToolGlyph name='stop' />} title='Rectangle' />
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
                <div className='cratis:flex cratis:gap-6 cratis:items-start'>
                    <Toolbar
                        draggable
                        onItemDragStart={(data) =>
                            setDropped(`Dragging: ${(data as { tool: string }).tool}`)
                        }
                    >
                        <ToolbarButton icon={<ToolGlyph name='pencil' />} title='Pencil' data={{ tool: 'pencil' }} />
                        <ToolbarButton icon={<ToolGlyph name='stop' />} title='Rectangle' data={{ tool: 'rectangle' }} />
                        <ToolbarButton icon={<ToolGlyph name='circle' />} title='Circle' data={{ tool: 'circle' }} />
                        <ToolbarButton icon={<ToolGlyph name='minus' />} title='Line' data={{ tool: 'line' }} />
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
                        className='cratis:flex cratis:items-center cratis:justify-center cratis:rounded-xl cratis:border-2 cratis:border-dashed cratis:transition-colors'
                        style={{
                            width: 240,
                            height: 180,
                            borderColor: isDragOver ? 'var(--cratis-primary-color)' : 'var(--cratis-surface-border)',
                            background: isDragOver ? 'var(--cratis-highlight-bg)' : 'var(--cratis-surface-card)',
                            color: 'var(--cratis-text-color-secondary)',
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
                <ToolbarButton icon={<ToolGlyph name='arrow-up-left' />} title='Select' />
                <ToolbarButton icon={<ToolGlyph name='hand-paper' />} title='Pan' />
            </ToolbarGroup>
            <ToolbarGroup>
                <ToolbarButton icon={<ToolGlyph name='pencil' />} title='Draw' />
                <ToolbarButton icon={<ToolGlyph name='stop' />} title='Rectangle' />
                <ToolbarButton icon={<ToolGlyph name='circle' />} title='Circle' />
                <ToolbarButton icon={<ToolGlyph name='minus' />} title='Line' />
            </ToolbarGroup>
            <ToolbarGroup>
                <ToolbarButton icon={<ToolGlyph name='undo' />} title='Undo' />
                <ToolbarButton icon={<ToolGlyph name='refresh' />} title='Redo' />
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
            <ToolbarButton icon={<ToolGlyph name='arrow-up-left' />} title='Select' />
            <ToolbarFolder icon={<ToolGlyph name='th-large' />} title='Tools' mode='list'>
                <ToolbarButton icon={<ToolGlyph name='pencil' />} title='Draw freehand' />
                <ToolbarButton icon={<ToolGlyph name='stop' />} title='Rectangle' />
                <ToolbarButton icon={<ToolGlyph name='circle' />} title='Ellipse' />
                <ToolbarButton icon={<ToolGlyph name='minus' />} title='Straight line' />
            </ToolbarFolder>
            <ToolbarButton icon={<ToolGlyph name='undo' />} title='Undo' />
        </Toolbar>
    ),
};

/**
 * Side-by-side comparison of grid mode (default) and list mode for {@link ToolbarFolder}.
 */
export const FolderGridVsList: Story = {
    render: () => (
        <div className='cratis:flex cratis:gap-8 cratis:items-start'>
            <div className='cratis:flex cratis:flex-col cratis:items-center cratis:gap-2'>
                <span style={{ color: 'var(--cratis-text-color-secondary)', fontSize: '0.75rem' }}>Grid (default)</span>
                <Toolbar>
                    <ToolbarFolder icon={<ToolGlyph name='th-large' />} title='Tools' mode='grid'>
                        <ToolbarButton icon={<ToolGlyph name='pencil' />} title='Draw' />
                        <ToolbarButton icon={<ToolGlyph name='stop' />} title='Rectangle' />
                        <ToolbarButton icon={<ToolGlyph name='circle' />} title='Ellipse' />
                        <ToolbarButton icon={<ToolGlyph name='minus' />} title='Line' />
                        <ToolbarButton icon={<ToolGlyph name='cog' />} title='Settings' />
                        <ToolbarButton icon={<ToolGlyph name='star' />} title='Favorite' />
                    </ToolbarFolder>
                </Toolbar>
            </div>
            <div className='cratis:flex cratis:flex-col cratis:items-center cratis:gap-2'>
                <span style={{ color: 'var(--cratis-text-color-secondary)', fontSize: '0.75rem' }}>List</span>
                <Toolbar>
                    <ToolbarFolder icon={<ToolGlyph name='list' />} title='Tools' mode='list'>
                        <ToolbarButton icon={<ToolGlyph name='pencil' />} title='Draw freehand' />
                        <ToolbarButton icon={<ToolGlyph name='stop' />} title='Rectangle' />
                        <ToolbarButton icon={<ToolGlyph name='circle' />} title='Ellipse' />
                        <ToolbarButton icon={<ToolGlyph name='minus' />} title='Straight line' />
                        <ToolbarButton icon={<ToolGlyph name='cog' />} title='Settings' />
                        <ToolbarButton icon={<ToolGlyph name='star' />} title='Favorite' />
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
                    <ToolbarButton icon={<ToolGlyph name='pencil' />} title='Pencil' />
                    <ToolbarButton icon={<ToolGlyph name='eraser' />} title='Eraser' />
                    <ToolbarButton icon={<ToolGlyph name='palette' />} title='Color' />
                    <ToolbarButton icon={<ToolGlyph name='bolt' />} title='Airbrush' />
                    <ToolbarButton icon={<ToolGlyph name='image' />} title='Stamp' />
                    <ToolbarButton icon={<ToolGlyph name='filter' />} title='Blur' />
                    <ToolbarButton icon={<ToolGlyph name='sun' />} title='Dodge' />
                    <ToolbarButton icon={<ToolGlyph name='moon' />} title='Burn' />
                </>
            ), []);

            const shapeTools = useMemo(() => (
                <>
                    <ToolbarButton icon={<ToolGlyph name='stop' />} title='Rectangle' />
                    <ToolbarButton icon={<ToolGlyph name='circle' />} title='Circle' />
                    <ToolbarButton icon={<ToolGlyph name='minus' />} title='Line' />
                    <ToolbarButton icon={<ToolGlyph name='sort-up' />} title='Triangle' />
                    <ToolbarButton icon={<ToolGlyph name='star' />} title='Polygon' />
                </>
            ), []);

            const selectTools = useMemo(() => (
                <>
                    <ToolbarButton icon={<ToolGlyph name='arrows-alt' />} title='Move' />
                    <ToolbarButton icon={<ToolGlyph name='clone' />} title='Duplicate' />
                    <ToolbarButton icon={<ToolGlyph name='refresh' />} title='Rotate' />
                    <ToolbarButton icon={<ToolGlyph name='expand' />} title='Scale' />
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
                            <ToolbarButton icon={<ToolGlyph name='pencil' />} title='Draw mode' active={mode === 'draw'} onClick={() => setMode('draw')} />
                            <ToolbarButton icon={<ToolGlyph name='stop' />} title='Shape mode' active={mode === 'shape'} onClick={() => setMode('shape')} />
                            <ToolbarButton icon={<ToolGlyph name='arrow-up-left' />} title='Select mode' active={mode === 'select'} onClick={() => setMode('select')} />
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

            const favoriteBtn = useMemo(() => <ToolbarButton icon={<ToolGlyph name='star' />} title='Favorite' />, []);
            const bookmarkBtn = useMemo(() => <ToolbarButton icon={<ToolGlyph name='bookmark' />} title='Bookmark' />, []);

            return (
                <ToolbarSlotProvider>
                    <div className='cratis:flex cratis:flex-col cratis:items-center cratis:gap-6'>
                        <Toolbar>
                            <ToolbarSection activeContext={currentContext}>
                                <ToolbarContext name='drawing' slotName='drawing-extras'>
                                    <ToolbarButton icon={<ToolGlyph name='pencil' />} title='Draw' />
                                    <ToolbarButton icon={<ToolGlyph name='stop' />} title='Rectangle' />
                                </ToolbarContext>
                                <ToolbarContext name='text'>
                                    <ToolbarButton icon={<ToolGlyph name='align-left' />} title='Align Left' />
                                    <ToolbarButton icon={<ToolGlyph name='align-center' />} title='Align Center' />
                                </ToolbarContext>
                            </ToolbarSection>
                        </Toolbar>

                        {/* Slot content is swapped by mounting a different ToolbarSlot */}
                        {slotContent === 'favorite' && <ToolbarSlot slotName='drawing-extras' order={5}>{favoriteBtn}</ToolbarSlot>}
                        {slotContent === 'bookmark' && <ToolbarSlot slotName='drawing-extras' order={5}>{bookmarkBtn}</ToolbarSlot>}

                        <div className='cratis:flex cratis:flex-col cratis:gap-4 cratis:items-center'>
                            <div className='cratis:flex cratis:flex-col cratis:gap-2 cratis:items-center'>
                                <span className='cratis:text-xs' style={{ color: 'var(--cratis-text-color-secondary)' }}>Context</span>
                                <div className='cratis:flex cratis:gap-2'>
                                    {(['drawing', 'text'] as const).map(ctx => (
                                        <button
                                            key={ctx}
                                            type='button'
                                            onClick={() => setCurrentContext(ctx)}
                                            className={`cratis:px-3 cratis:py-1 cratis:rounded cratis:text-sm cratis:transition-colors ${
                                                currentContext === ctx
                                                    ? 'cratis:bg-blue-600 cratis:text-white'
                                                    : 'cratis:bg-gray-600 cratis:text-gray-200 cratis:hover:bg-gray-500'
                                            }`}
                                        >
                                            {ctx}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className='cratis:flex cratis:flex-col cratis:gap-2 cratis:items-center'>
                                <span className='cratis:text-xs' style={{ color: 'var(--cratis-text-color-secondary)' }}>Slot content (drawing-extras)</span>
                                <div className='cratis:flex cratis:gap-2'>
                                    {(['none', 'favorite', 'bookmark'] as const).map(s => (
                                        <button
                                            key={s}
                                            type='button'
                                            onClick={() => setSlotContent(s)}
                                            className={`cratis:px-3 cratis:py-1 cratis:rounded cratis:text-sm cratis:transition-colors ${
                                                slotContent === s
                                                    ? 'cratis:bg-blue-600 cratis:text-white'
                                                    : 'cratis:bg-gray-600 cratis:text-gray-200 cratis:hover:bg-gray-500'
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
            const btn = useMemo(() => <ToolbarButton icon={<ToolGlyph name='star' />} title='Slot A (order 10)' />, []);
            return <ToolbarSlot slotName='shared' order={10}>{btn}</ToolbarSlot>;
        };
        const ButtonB = () => {
            const btn = useMemo(() => <ToolbarButton icon={<ToolGlyph name='heart' />} title='Slot B (order 5)' />, []);
            return <ToolbarSlot slotName='shared' order={5}>{btn}</ToolbarSlot>;
        };
        const ButtonC = () => {
            const btn = useMemo(() => <ToolbarButton icon={<ToolGlyph name='bell' />} title='Slot C (order 20)' />, []);
            return <ToolbarSlot slotName='shared' order={20}>{btn}</ToolbarSlot>;
        };

        return (
            <ToolbarSlotProvider>
                <div className='cratis:flex cratis:gap-6 cratis:items-start'>
                    <Toolbar>
                        <ToolbarGroup slotName='shared'>
                            <ToolbarButton icon={<ToolGlyph name='pencil' />} title='Draw (always first)' />
                        </ToolbarGroup>
                    </Toolbar>

                    <div
                        className='cratis:flex cratis:flex-col cratis:gap-1 cratis:p-4 cratis:rounded-lg cratis:border cratis:text-sm'
                        style={{ borderColor: 'var(--cratis-surface-border)', background: 'var(--cratis-surface-ground)', color: 'var(--cratis-text-color-secondary)' }}
                    >
                        <strong style={{ color: 'var(--cratis-text-color)' }}>Three independent contributors</strong>
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

// ─── ToolbarLayout stories ────────────────────────────────────────────────────

/**
 * Shows `ToolbarLayout` as a shared region in an editor shell. Different
 * editor modules can mount and unmount independently while the shell remains
 * unchanged.
 */
export const LayoutForEditorModules: Story = {
    render: () => {
        const LayoutForEditorModulesDemo = () => {
            const [assetToolsEnabled, setAssetToolsEnabled] = useState(true);
            const [reviewToolsEnabled, setReviewToolsEnabled] = useState(true);

            const assetTools = useMemo(
                () => (
                    <ToolbarGroup orientation='horizontal'>
                        <ToolbarButton icon={<ToolGlyph name='image' />} title='Asset Browser' />
                        <ToolbarButton icon={<ToolGlyph name='upload' />} title='Upload Asset' />
                    </ToolbarGroup>
                ),
                []
            );

            const reviewTools = useMemo(
                () => (
                    <>
                        <ToolbarSeparator />
                        <ToolbarGroup orientation='horizontal'>
                            <ToolbarButton icon={<ToolGlyph name='comment' />} title='Comments' />
                            <ToolbarButton icon={<ToolGlyph name='check-square' />} title='Approval Checks' />
                        </ToolbarGroup>
                    </>
                ),
                []
            );

            return (
                <ToolbarSlotProvider>
                    <section
                        className='cratis:flex cratis:flex-col cratis:gap-6 cratis:p-8 cratis:rounded-2xl cratis:border'
                        style={{
                            width: 'min(52rem, calc(100vw - 4rem))',
                            borderColor: 'var(--cratis-surface-border)',
                            background: 'var(--cratis-surface-card)',
                            color: 'var(--cratis-text-color)',
                            boxShadow: 'var(--cratis-shadow-overlay)',
                        }}
                    >
                        <header className='cratis:flex cratis:flex-col cratis:gap-1'>
                            <strong>Editor module toolbar</strong>
                            <span className='cratis:text-sm' style={{ color: 'var(--cratis-text-color-secondary)' }}>
                                Independent features contribute complete tool groups to one named layout region.
                            </span>
                        </header>

                        <div className='cratis:flex cratis:flex-col cratis:items-center cratis:gap-6'>
                            <Toolbar orientation='horizontal'>
                                <ToolbarButton icon={<ToolGlyph name='file-edit' />} title='Open Editor' tooltipPosition='bottom' />
                                <ToolbarSeparator orientation='horizontal' />
                                <ToolbarLayout name='editor-modules' orientation='horizontal'>
                                    <ToolbarGroup orientation='horizontal'>
                                        <ToolbarButton icon={<ToolGlyph name='save' />} title='Save' tooltipPosition='bottom' />
                                        <ToolbarButton icon={<ToolGlyph name='refresh' />} title='Reload' tooltipPosition='bottom' />
                                    </ToolbarGroup>
                                </ToolbarLayout>
                                <ToolbarSeparator orientation='horizontal' />
                                <ToolbarButton icon={<ToolGlyph name='cog' />} title='Settings' tooltipPosition='bottom' />
                            </Toolbar>

                            {assetToolsEnabled && (
                                <ToolbarSlot slotName='editor-modules' order={10}>
                                    {assetTools}
                                </ToolbarSlot>
                            )}

                            {reviewToolsEnabled && (
                                <ToolbarSlot slotName='editor-modules' order={20}>
                                    {reviewTools}
                                </ToolbarSlot>
                            )}

                            <div className='cratis:flex cratis:gap-6'>
                                {[
                                    { label: 'Asset tools', enabled: assetToolsEnabled, toggle: () => setAssetToolsEnabled(v => !v) },
                                    { label: 'Review tools', enabled: reviewToolsEnabled, toggle: () => setReviewToolsEnabled(v => !v) },
                                ].map(({ label, enabled, toggle }) => (
                                    <div key={label} className='cratis:flex cratis:flex-col cratis:items-center cratis:gap-2'>
                                        <span className='cratis:text-xs' style={{ color: 'var(--cratis-text-color-secondary)' }}>{label}</span>
                                        <button
                                            type='button'
                                            onClick={toggle}
                                            className={`cratis:px-3 cratis:py-1 cratis:rounded cratis:text-sm cratis:transition-colors ${
                                                enabled ? 'cratis:bg-blue-600 cratis:text-white' : 'cratis:bg-gray-600 cratis:text-gray-200 cratis:hover:bg-gray-500'
                                            }`}
                                        >
                                            {enabled ? 'Disable' : 'Enable'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </ToolbarSlotProvider>
            );
        };

        return <LayoutForEditorModulesDemo />;
    },
};

/**
 * Demonstrates editor-specific toolbar layouts (Canvas, Text, Schema) with a
 * smooth transition when switching editor type.
 *
 * The transition is driven by `ToolbarLayout` itself, so the story only swaps
 * slot content and the toolbar handles fade/resize animation internally.
 */
export const LayoutWithSmoothEditorTransitions: Story = {
    render: () => {
        const LayoutWithSmoothEditorTransitionsDemo = () => {
            const [activeEditor, setActiveEditor] = useState<'canvas' | 'text' | 'schema'>('canvas');

            const canvasTools = useMemo(
                () => (
                    <ToolbarGroup orientation='horizontal'>
                        <ToolbarButton icon={<ToolGlyph name='pencil' />} title='Draw' tooltipPosition='bottom' />
                        <ToolbarButton icon={<ToolGlyph name='stop' />} title='Rectangle' tooltipPosition='bottom' />
                        <ToolbarButton icon={<ToolGlyph name='circle' />} title='Circle' tooltipPosition='bottom' />
                    </ToolbarGroup>
                ),
                []
            );

            const textTools = useMemo(
                () => (
                    <ToolbarGroup orientation='horizontal'>
                        <ToolbarButton icon={<ToolGlyph name='align-left' />} title='Align Left' tooltipPosition='bottom' />
                        <ToolbarButton icon={<ToolGlyph name='bold' />} title='Bold' tooltipPosition='bottom' />
                        <ToolbarButton icon={<ToolGlyph name='underline' />} title='Underline' tooltipPosition='bottom' />
                    </ToolbarGroup>
                ),
                []
            );

            const schemaTools = useMemo(
                () => (
                    <>
                        <ToolbarGroup orientation='horizontal'>
                            <ToolbarButton icon={<ToolGlyph name='table' />} title='Add Table' tooltipPosition='bottom' />
                            <ToolbarButton icon={<ToolGlyph name='link' />} title='Relationship' tooltipPosition='bottom' />
                        </ToolbarGroup>
                        <ToolbarSeparator orientation='horizontal' />
                        <ToolbarGroup orientation='horizontal'>
                            <ToolbarButton icon={<ToolGlyph name='check-square' />} title='Validate Schema' tooltipPosition='bottom' />
                        </ToolbarGroup>
                    </>
                ),
                []
            );

            const editorTools = {
                canvas: canvasTools,
                text: textTools,
                schema: schemaTools,
            };

            return (
                <ToolbarSlotProvider>
                    <div className='cratis:flex cratis:flex-col cratis:items-center cratis:gap-6'>
                        <Toolbar orientation='horizontal'>
                            <ToolbarButton icon={<ToolGlyph name='home' />} title='Workspace Home' tooltipPosition='bottom' />
                            <ToolbarSeparator orientation='horizontal' />
                            <ToolbarLayout name='active-editor-tools' orientation='horizontal'>
                                <ToolbarGroup orientation='horizontal'>
                                    <ToolbarButton icon={<ToolGlyph name='folder-open' />} title='Open' tooltipPosition='bottom' />
                                </ToolbarGroup>
                            </ToolbarLayout>
                            <ToolbarSeparator orientation='horizontal' />
                            <ToolbarButton icon={<ToolGlyph name='history' />} title='History' tooltipPosition='bottom' />
                        </Toolbar>

                        <ToolbarSlot slotName='active-editor-tools' order={0}>
                            {editorTools[activeEditor]}
                        </ToolbarSlot>

                        <div className='cratis:flex cratis:flex-col cratis:items-center cratis:gap-3'>
                            <span className='cratis:text-xs' style={{ color: 'var(--cratis-text-color-secondary)' }}>Active editor</span>
                            <div className='cratis:flex cratis:gap-2'>
                                {(['canvas', 'text', 'schema'] as const).map(editor => (
                                    <button
                                        key={editor}
                                        type='button'
                                        onClick={() => setActiveEditor(editor)}
                                        className={`cratis:px-3 cratis:py-1 cratis:rounded cratis:text-sm cratis:capitalize cratis:transition-colors ${
                                            activeEditor === editor
                                                ? 'cratis:bg-blue-600 cratis:text-white'
                                                : 'cratis:bg-gray-600 cratis:text-gray-200 cratis:hover:bg-gray-500'
                                        }`}
                                    >
                                        {editor}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </ToolbarSlotProvider>
            );
        };

        return <LayoutWithSmoothEditorTransitionsDemo />;
    },
};

/**
 * Shows app-level layout regions where one `ToolbarLayout` stays stable for
 * global actions while another layout swaps by editor type.
 */
export const LayoutWithGlobalAndEditorRegions: Story = {
    render: () => {
        const LayoutWithGlobalAndEditorRegionsDemo = () => {
            const [activeEditor, setActiveEditor] = useState<'page' | 'workflow'>('page');

            const globalActions = useMemo(
                () => (
                    <ToolbarGroup orientation='horizontal'>
                        <ToolbarButton icon={<ToolGlyph name='save' />} title='Save Workspace' tooltipPosition='bottom' />
                        <ToolbarButton icon={<ToolGlyph name='share-alt' />} title='Share' tooltipPosition='bottom' />
                    </ToolbarGroup>
                ),
                []
            );

            const pageEditorTools = useMemo(
                () => (
                    <ToolbarGroup orientation='horizontal'>
                        <ToolbarButton icon={<ToolGlyph name='clone' />} title='Duplicate Block' tooltipPosition='bottom' />
                        <ToolbarButton icon={<ToolGlyph name='palette' />} title='Theme' tooltipPosition='bottom' />
                    </ToolbarGroup>
                ),
                []
            );

            const workflowEditorTools = useMemo(
                () => (
                    <ToolbarGroup orientation='horizontal'>
                        <ToolbarButton icon={<ToolGlyph name='sitemap' />} title='Add Node' tooltipPosition='bottom' />
                        <ToolbarButton icon={<ToolGlyph name='play' />} title='Run Flow' tooltipPosition='bottom' />
                        <ToolbarButton icon={<ToolGlyph name='stopwatch' />} title='Debug Step' tooltipPosition='bottom' />
                    </ToolbarGroup>
                ),
                []
            );

            const editorRegionTools = {
                page: pageEditorTools,
                workflow: workflowEditorTools,
            };

            return (
                <ToolbarSlotProvider>
                    <div className='cratis:flex cratis:flex-col cratis:items-center cratis:gap-6'>
                        <Toolbar orientation='horizontal'>
                            <ToolbarLayout name='global-region' orientation='horizontal' />
                            <ToolbarSeparator orientation='horizontal' />
                            <ToolbarLayout name='editor-region' orientation='horizontal' />
                        </Toolbar>

                        <ToolbarSlot slotName='global-region' order={0}>
                            {globalActions}
                        </ToolbarSlot>

                        <ToolbarSlot slotName='editor-region' order={0}>
                            {editorRegionTools[activeEditor]}
                        </ToolbarSlot>

                        <div className='cratis:flex cratis:gap-2'>
                            {(['page', 'workflow'] as const).map(editor => (
                                <button
                                    key={editor}
                                    type='button'
                                    onClick={() => setActiveEditor(editor)}
                                    className={`cratis:px-3 cratis:py-1 cratis:rounded cratis:text-sm cratis:capitalize cratis:transition-colors ${
                                        activeEditor === editor
                                            ? 'cratis:bg-blue-600 cratis:text-white'
                                            : 'cratis:bg-gray-600 cratis:text-gray-200 cratis:hover:bg-gray-500'
                                    }`}
                                >
                                    {editor} editor
                                </button>
                            ))}
                        </div>
                    </div>
                </ToolbarSlotProvider>
            );
        };

        return <LayoutWithGlobalAndEditorRegionsDemo />;
    },
};
