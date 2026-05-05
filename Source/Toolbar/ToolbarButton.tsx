// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { IconDisplay } from '../Common/Icon';
import type { Icon } from '../Common/Icon';
import { Tooltip } from '../Common/Tooltip';
import type { TooltipPosition } from '../Common/Tooltip';
import { useToolbarDragContext } from './ToolbarDragContext';
import { useToolbarFolderMode } from './ToolbarFolderContext';

/** Props for the {@link ToolbarButton} component. */
export interface ToolbarButtonProps {
    /** The icon to display — either a PrimeIcons CSS class string (e.g. `'pi pi-home'`) or a React node. */
    icon?: Icon;

    /** Optional text to render inside the button (e.g. '120%'). */
    text?: string;

    /** Title text shown when the user hovers over the button. */
    title: string;

    /** Whether the button is currently in the active/selected state. */
    active?: boolean;

    /** Callback invoked when the button is clicked. */
    onClick?: () => void;

    /** Position of the tooltip relative to the button (default: 'right'). */
    tooltipPosition?: TooltipPosition;

    /**
     * Whether this button can be dragged onto a surface.
     * When omitted the value is inherited from the parent {@link Toolbar}'s `draggable` prop.
     */
    draggable?: boolean;

    /**
     * Optional data associated with this button for identification during drag &amp; drop.
     * The value is passed to {@link onDragStart} and serialised onto the HTML5
     * `DataTransfer` object as `application/json` so drop targets can read it.
     */
    data?: unknown;

    /**
     * Callback invoked when a drag operation starts on this button.
     * Receives the button's {@link data} and the originating drag event.
     */
    onDragStart?: (data: unknown, event: React.DragEvent<HTMLButtonElement>) => void;
}

/**
 * An icon button with a tooltip, intended to be placed inside a {@link Toolbar}.
 * Uses the shared {@link Tooltip} component for consistent hover labels.
 */
export const ToolbarButton = ({ icon, text, title, active = false, onClick, tooltipPosition = 'right', draggable, data, onDragStart }: ToolbarButtonProps) => {
    const dragContext = useToolbarDragContext();
    const folderMode = useToolbarFolderMode();
    const isListMode = folderMode === 'list';
    const isDraggable = draggable ?? dragContext.draggable;

    const handleDragStart = (event: React.DragEvent<HTMLButtonElement>) => {
        event.dataTransfer.setData('application/json', JSON.stringify(data ?? null));
        event.dataTransfer.effectAllowed = 'copy';
        onDragStart?.(data, event);
        dragContext.onItemDragStart?.(data, event);
    };

    const activeClass = active ? 'toolbar-button--active' : '';
    const draggableClass = isDraggable ? 'toolbar-button--draggable' : '';
    const hasText = typeof text === 'string' && text.length > 0;
    const resolvedIcon = icon !== undefined && icon !== null && (typeof icon !== 'string' || icon.length > 0) ? icon : null;

    // List mode: icon + title label rendered side by side (no floating tooltip needed).
    if (isListMode) {
        return (
            <button
                type='button'
                aria-label={title}
                onClick={onClick}
                draggable={isDraggable}
                onDragStart={isDraggable ? handleDragStart : undefined}
                className={`toolbar-button toolbar-button--list h-10 px-3 w-full flex items-center justify-start gap-2 rounded-lg cursor-pointer ${activeClass} ${draggableClass}`}
            >
                {resolvedIcon !== null && <IconDisplay icon={resolvedIcon} className='text-lg flex-shrink-0' />}
                <span className='toolbar-button__label'>{title}</span>
            </button>
        );
    }

    const buttonSizeClass = hasText ? 'h-10 px-3 min-w-[4rem]' : 'w-10 h-10';
    const buttonContent = hasText
        ? <span className='toolbar-button__text'>{text}</span>
        : resolvedIcon !== null
            ? <IconDisplay icon={resolvedIcon} className='text-lg' />
            : null;

    return (
        <Tooltip content={title} position={tooltipPosition}>
            <button
                type='button'
                aria-label={title}
                onClick={onClick}
                draggable={isDraggable}
                onDragStart={isDraggable ? handleDragStart : undefined}
                className={`toolbar-button ${buttonSizeClass} flex items-center justify-center rounded-lg cursor-pointer ${activeClass} ${draggableClass}`}
            >
                {buttonContent}
            </button>
        </Tooltip>
    );
};
