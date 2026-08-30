// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type {
    ButtonHTMLAttributes,
    HTMLAttributes,
} from 'react';
import { IconDisplay } from '../Common/Icon';
import type { Icon } from '../Common/Icon';
import { Tooltip } from '../Common/Tooltip';
import type { TooltipPosition } from '../Common/Tooltip';
import { useToolbarDragContext } from './ToolbarDragContext';
import { useToolbarFolderMode } from './ToolbarFolderContext';
import { useToolbarItemVisibility } from './ToolbarItemVisibilityContext';

/** Stable part attributes for {@link ToolbarButton}. */
export interface ToolbarButtonParts {
    /** Native button root. */
    root?: ButtonHTMLAttributes<HTMLButtonElement>;
    /** Icon wrapper. */
    icon?: HTMLAttributes<HTMLSpanElement>;
    /** Text/title label wrapper. */
    label?: HTMLAttributes<HTMLSpanElement>;
}

/** Props for the {@link ToolbarButton} component. */
export interface ToolbarButtonProps {
    /** React icon node or consumer-owned icon-font class. Components installs no icon font. */
    icon?: Icon;

    /** Optional text-first content (for example `120%`); when non-empty it renders instead of {@link icon}. */
    text?: string;

    /** Title text shown when the user hovers over the button. */
    title: string;

    /** Whether the button is currently in the active/selected state. */
    active?: boolean;

    /** Callback invoked when the button is clicked. */
    onClick?: () => void;

    /** Position of the tooltip relative to the button (default: 'right'). */
    tooltipPosition?: TooltipPosition;

    /** Extra class name for the native button. */
    className?: string;

    /** Stable button part attributes. */
    pt?: ToolbarButtonParts;

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
export const ToolbarButton = ({
    icon,
    text,
    title,
    active = false,
    onClick,
    tooltipPosition = 'right',
    draggable,
    data,
    onDragStart,
    className,
    pt,
}: ToolbarButtonProps) => {
    const dragContext = useToolbarDragContext();
    const folderMode = useToolbarFolderMode();
    const isToolbarItemVisible = useToolbarItemVisibility();
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
                {...pt?.root}
                type='button'
                aria-label={title}
                onClick={onClick}
                draggable={isDraggable}
                onDragStart={isDraggable ? handleDragStart : undefined}
                className={`toolbar-button toolbar-button--list cratis:h-10 cratis:px-3 cratis:w-full cratis:flex cratis:items-center cratis:justify-start cratis:gap-2 cratis:rounded-lg cratis:cursor-pointer ${activeClass} ${draggableClass} ${pt?.root?.className ?? ''} ${className ?? ''}`}
                data-cratis-part='button'
                data-active={active || undefined}
                data-selected={active || undefined}
            >
                {resolvedIcon !== null && (
                    <span
                        {...pt?.icon}
                        className={pt?.icon?.className}
                        data-cratis-part='icon'
                    >
                        <IconDisplay
                            icon={resolvedIcon}
                            className='cratis:text-lg cratis:flex-shrink-0'
                        />
                    </span>
                )}
                <span
                    {...pt?.label}
                    className={`toolbar-button__label ${pt?.label?.className ?? ''}`}
                    data-cratis-part='label'
                >
                    {title}
                </span>
            </button>
        );
    }

    const buttonSizeClass = hasText ? 'cratis:h-10 cratis:px-3 cratis:min-w-[4rem]' : 'cratis:w-10 cratis:h-10';
    const buttonContent = hasText ? (
        <span
            {...pt?.label}
            className={`toolbar-button__text ${pt?.label?.className ?? ''}`}
            data-cratis-part='label'
        >
            {text}
        </span>
    ) : resolvedIcon === null ? null : (
        <span
            {...pt?.icon}
            className={pt?.icon?.className}
            data-cratis-part='icon'
        >
            <IconDisplay icon={resolvedIcon} className='cratis:text-lg' />
        </span>
    );

    return (
        <Tooltip
            content={title}
            position={tooltipPosition}
            disabled={!isToolbarItemVisible}
        >
            <button
                {...pt?.root}
                type='button'
                aria-label={title}
                onClick={onClick}
                draggable={isDraggable}
                onDragStart={isDraggable ? handleDragStart : undefined}
                className={`toolbar-button ${buttonSizeClass} cratis:flex cratis:items-center cratis:justify-center cratis:rounded-lg cratis:cursor-pointer ${activeClass} ${draggableClass} ${pt?.root?.className ?? ''} ${className ?? ''}`}
                data-cratis-part='button'
                data-active={active || undefined}
                data-selected={active || undefined}
            >
                {buttonContent}
            </button>
        </Tooltip>
    );
};
