// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useId, type ButtonHTMLAttributes, type DragEvent, type HTMLAttributes } from 'react';
import { IconDisplay } from '../Common/Icon';
import type { Icon } from '../Common/Icon';
import { useRovingTool } from '../Common/ToolbarRovingContext';
import { useToolbarDragContext } from './ToolbarDragContext';
import { useToolbarDrawer } from './ToolbarDrawerContext';

/** Props for the internal labeled tile rendered inside a drawer {@link ToolbarFolder}. */
export interface ToolbarDrawerTileProps {
    /** Always-visible label and accessible name. */
    title: string;
    /** Icon shown above the label. */
    icon?: Icon;
    /** Whether the tile is the active/selected one. */
    active?: boolean;
    /** Whether the tile is unavailable. */
    disabled?: boolean;
    /** Explanation of why the tile is unavailable. */
    disabledReason?: string;
    /** Whether the tile can be dragged. */
    draggable: boolean;
    /** Data delivered to drag callbacks and serialized onto the `DataTransfer`. */
    data?: unknown;
    /** Catalogue identity exposed as `data-item-id` so styling and tests can address one tile. */
    itemId?: string;
    /** Called when the tile is activated by pointer, Enter or Space. */
    onClick?: () => void;
    /** Called when a drag starts on the tile. */
    onDragStart?: (data: unknown, event: DragEvent<HTMLButtonElement>) => void;
    /** Called when a drag that started on the tile ends, whether dropped or cancelled. */
    onDragEnd?: (data: unknown, event: DragEvent<HTMLButtonElement>) => void;
    /** Extra class name for the native button. */
    className?: string;
    /** Attributes for the native button. */
    root?: ButtonHTMLAttributes<HTMLButtonElement>;
    /** Attributes for the icon wrapper. */
    iconPart?: HTMLAttributes<HTMLSpanElement>;
    /** Attributes for the label. */
    label?: HTMLAttributes<HTMLSpanElement>;
}

/**
 * A labeled drawer tile: a prominent icon with an always-visible title.
 *
 * A disabled tile stays focusable and reports `aria-disabled` so assistive technology can still
 * read why it is unavailable; it neither activates nor drags.
 */
export const ToolbarDrawerTile = ({
    title,
    icon,
    active,
    disabled,
    disabledReason,
    draggable,
    data,
    itemId,
    onClick,
    onDragStart,
    onDragEnd,
    className,
    root,
    iconPart,
    label,
}: ToolbarDrawerTileProps) => {
    const dragContext = useToolbarDragContext();
    const drawer = useToolbarDrawer();
    const rovingTool = useRovingTool<HTMLButtonElement>(root?.tabIndex, root?.onFocus);
    const reasonId = useId();
    const isDraggable = draggable && !disabled;
    const hasReason = disabled === true && typeof disabledReason === 'string' && disabledReason.length > 0;
    const resolvedIcon = icon !== undefined && icon !== null && (typeof icon !== 'string' || icon.length > 0) ? icon : null;

    const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
        event.dataTransfer.setData('application/json', JSON.stringify(data ?? null));
        event.dataTransfer.effectAllowed = 'copy';
        drawer?.setDragging(true);
        onDragStart?.(data, event);
        dragContext.onItemDragStart?.(data, event);
    };

    const handleDragEnd = (event: DragEvent<HTMLButtonElement>) => {
        drawer?.setDragging(false);
        onDragEnd?.(data, event);
    };

    return (
        <button
            aria-pressed={active}
            {...root}
            {...rovingTool}
            type='button'
            title={hasReason ? disabledReason : root?.title}
            aria-disabled={disabled || undefined}
            aria-describedby={hasReason ? reasonId : root?.['aria-describedby']}
            onClick={disabled ? undefined : onClick}
            draggable={isDraggable}
            onDragStart={isDraggable ? handleDragStart : undefined}
            onDragEnd={isDraggable ? handleDragEnd : undefined}
            className={`toolbar-button toolbar-drawer-tile ${isDraggable ? 'toolbar-button--draggable' : ''} ${active ? 'toolbar-button--active' : ''} ${root?.className ?? ''} ${className ?? ''}`}
            data-cratis-part='toolbar-folder-tile'
            data-item-id={itemId}
            data-disabled={disabled || undefined}
            data-active={active || undefined}
            data-selected={active || undefined}
        >
            {resolvedIcon !== null && (
                <span
                    aria-hidden='true'
                    {...iconPart}
                    className={`toolbar-drawer-tile__icon ${iconPart?.className ?? ''}`}
                    data-cratis-part='toolbar-folder-tile-icon'
                >
                    <IconDisplay icon={resolvedIcon} className='cratis:text-2xl' />
                </span>
            )}
            <span
                {...label}
                className={`toolbar-drawer-tile__label ${label?.className ?? ''}`}
                data-cratis-part='toolbar-folder-tile-label'
            >
                {title}
            </span>
            {hasReason && (
                <span id={reasonId} className='toolbar-drawer-tile__reason'>
                    {disabledReason}
                </span>
            )}
        </button>
    );
};
