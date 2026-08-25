// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useCallback, useRef, useState } from 'react';

const MIN_SIZE = 100;

const HANDLE_KEYS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;
type HandleKey = (typeof HANDLE_KEYS)[number];

const HANDLE_POSITIONS: Record<HandleKey, React.CSSProperties> = {
    nw: { top: -4, left: -4 },
    n:  { top: -4, left: '50%', transform: 'translateX(-50%)' },
    ne: { top: -4, right: -4 },
    e:  { top: '50%', right: -4, transform: 'translateY(-50%)' },
    se: { bottom: -4, right: -4 },
    s:  { bottom: -4, left: '50%', transform: 'translateX(-50%)' },
    sw: { bottom: -4, left: -4 },
    w:  { top: '50%', left: -4, transform: 'translateY(-50%)' },
};

const RESIZE_CURSORS: Record<HandleKey, string> = {
    nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
    e: 'e-resize',   se: 'se-resize',
    s: 's-resize',   sw: 'sw-resize', w: 'w-resize',
};

/** Controlled data rendered by {@link Region}. */
export interface RegionData {
    /** Stable region identity. */
    id: string;
    /** World-space horizontal position. */
    x: number;
    /** World-space vertical position. */
    y: number;
    /** Region width. */
    width: number;
    /** Region height. */
    height: number;
    /** Editable region label. */
    name: string;
}

/** Props for a fully controlled movable, resizable, labeled Canvas region. */
export interface RegionProps {
    /** Current region data. */
    region: RegionData;
    /** Whether resize handles are visible. */
    selected: boolean;

    /**
     * Selects this region. `additive` reports that the gesture carried a shift/meta/ctrl modifier, so
     * a board supporting multi-select can extend its selection instead of replacing it.
     */
    onSelect: (id: string, additive: boolean) => void;

    /** Reports drag movement. */
    onMove: (id: string, x: number, y: number) => void;
    /** Reports drag completion. */
    onMoveEnd?: (id: string) => void;
    /** Reports resize movement and resulting bounds. */
    onResize: (id: string, x: number, y: number, width: number, height: number) => void;
    /** Reports resize completion. */
    onResizeEnd?: (id: string) => void;
    /** Reports committed label edits. */
    onNameChange: (id: string, name: string) => void;

    /**
     * Visual nesting only — rendered inside the region's own coordinate space (its top-left corner) so
     * a host that also places other shapes at region-relative coordinates lines them up correctly. This
     * component does no containment math and tracks no membership: deciding which items "belong" to a
     * region, and moving them along with it, is board-level orchestration left entirely to the host.
     */
    children?: React.ReactNode;
}

/**
 * A resizable, draggable, labeled box a host can place other shapes inside of — the generic shell
 * behind a "region" or "group" affordance on a board. Presentational and fully controlled: like
 * {@link Note}, it owns no position/size/name state of its own and reads `region` fresh every render,
 * reporting every change through callbacks instead of committing anything locally. A host that is slow
 * to feed a new `region` back after a callback will see the box spring back to its last known value —
 * the same trade-off `Note` makes for its own drag/resize/rename.
 */
export const Region = ({ region, selected, onSelect, onMove, onMoveEnd, onResize, onResizeEnd, onNameChange, children }: RegionProps) => {
    const [isEditing, setIsEditing] = useState(false);

    const regionRef = useRef<HTMLDivElement>(null);
    const titleBarRef = useRef<HTMLDivElement>(null);
    const clickedTitleBarRef = useRef(false);

    const dragRef = useRef<{
        clientX: number;
        clientY: number;
        startX: number;
        startY: number;
        zoom: number;
    } | null>(null);

    const resizeRef = useRef<{
        handle: HandleKey;
        clientX: number;
        clientY: number;
        startX: number;
        startY: number;
        startWidth: number;
        startHeight: number;
        zoom: number;
    } | null>(null);

    const readEffectiveZoom = useCallback((): number => {
        if (!regionRef.current) return 1;
        const renderedWidth = regionRef.current.getBoundingClientRect().width;
        return renderedWidth > 0 ? renderedWidth / region.width : 1;
    }, [region.width]);

    // ── Move ────────────────────────────────────────────────────────────────

    // Only the title bar is a drag handle. A press anywhere on the region's body is deliberately left
    // to bubble up to the host: a drag from there is free to become a rubber-band selection instead, and
    // a plain click can select the region itself — a region is a backdrop you can both sweep a
    // selection across and click to select, not a surface that swallows the gesture.
    const handlePointerDown = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (isEditing) return;
            clickedTitleBarRef.current = titleBarRef.current?.contains(event.target as Node) ?? false;
            if (!clickedTitleBarRef.current) return;
            event.stopPropagation();
            onSelect(region.id, event.shiftKey || event.metaKey || event.ctrlKey);
            dragRef.current = {
                clientX: event.clientX,
                clientY: event.clientY,
                startX: region.x,
                startY: region.y,
                zoom: readEffectiveZoom(),
            };
            event.currentTarget.setPointerCapture(event.pointerId);
        },
        [isEditing, region.id, region.x, region.y, onSelect, readEffectiveZoom]
    );

    const handlePointerMove = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (!dragRef.current || !event.buttons) return;
            const { clientX, clientY, startX, startY, zoom } = dragRef.current;
            const deltaX = (event.clientX - clientX) / zoom;
            const deltaY = (event.clientY - clientY) / zoom;
            onMove(region.id, startX + deltaX, startY + deltaY);
        },
        [region.id, onMove]
    );

    const handlePointerUp = useCallback(() => {
        if (dragRef.current) {
            dragRef.current = null;
            onMoveEnd?.(region.id);
        }
    }, [region.id, onMoveEnd]);

    // ── Resize ──────────────────────────────────────────────────────────────

    const handleResizePointerDown = useCallback(
        (handle: HandleKey) => (event: React.PointerEvent<HTMLDivElement>) => {
            clickedTitleBarRef.current = false;
            event.stopPropagation();
            resizeRef.current = {
                handle,
                clientX: event.clientX,
                clientY: event.clientY,
                startX: region.x,
                startY: region.y,
                startWidth: region.width,
                startHeight: region.height,
                zoom: readEffectiveZoom(),
            };
            event.currentTarget.setPointerCapture(event.pointerId);
        },
        [region.x, region.y, region.width, region.height, readEffectiveZoom]
    );

    const handleResizePointerMove = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (!resizeRef.current || !event.buttons) return;
            const { handle, clientX, clientY, startX, startY, startWidth, startHeight, zoom } = resizeRef.current;
            const deltaX = (event.clientX - clientX) / zoom;
            const deltaY = (event.clientY - clientY) / zoom;

            let newX = startX;
            let newY = startY;
            let newWidth = startWidth;
            let newHeight = startHeight;

            if (handle === 'e' || handle === 'ne' || handle === 'se') {
                newWidth = Math.max(MIN_SIZE, startWidth + deltaX);
            }
            if (handle === 'w' || handle === 'nw' || handle === 'sw') {
                newWidth = Math.max(MIN_SIZE, startWidth - deltaX);
                newX = startX + startWidth - newWidth;
            }
            if (handle === 's' || handle === 'se' || handle === 'sw') {
                newHeight = Math.max(MIN_SIZE, startHeight + deltaY);
            }
            if (handle === 'n' || handle === 'ne' || handle === 'nw') {
                newHeight = Math.max(MIN_SIZE, startHeight - deltaY);
                newY = startY + startHeight - newHeight;
            }

            onResize(region.id, newX, newY, newWidth, newHeight);
        },
        [region.id, onResize]
    );

    const handleResizePointerUp = useCallback(() => {
        if (resizeRef.current) {
            resizeRef.current = null;
            onResizeEnd?.(region.id);
        }
    }, [region.id, onResizeEnd]);

    // ── Rename ──────────────────────────────────────────────────────────────

    const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        if (!clickedTitleBarRef.current) return;
        event.stopPropagation();
        setIsEditing(true);
    }, []);

    const commitRename = useCallback((newName: string) => {
        setIsEditing(false);
        const trimmed = newName.trim();
        if (trimmed && trimmed !== region.name) onNameChange(region.id, trimmed);
    }, [region.id, region.name, onNameChange]);

    const handleInputBlur = useCallback(
        (event: React.FocusEvent<HTMLInputElement>) => commitRename(event.currentTarget.value),
        [commitRename]
    );

    const handleInputKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter') commitRename(event.currentTarget.value);
            else if (event.key === 'Escape') setIsEditing(false);
        },
        [commitRename]
    );

    return (
        <>
            <div
                ref={regionRef}
                className={`canvas-region${selected ? ' canvas-region--selected' : ''}`}
                style={{ width: region.width, height: region.height }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onDoubleClick={handleDoubleClick}
            >
                <div ref={titleBarRef} className='canvas-region__title-bar'>
                    {isEditing ? (
                        <input
                            className='canvas-region__name-input'
                            type='text'
                            defaultValue={region.name}
                            autoFocus
                            onBlur={handleInputBlur}
                            onKeyDown={handleInputKeyDown}
                            onPointerDown={event => event.stopPropagation()}
                        />
                    ) : (
                        <span className='canvas-region__name'>{region.name}</span>
                    )}
                </div>

                {selected && HANDLE_KEYS.map(handle => (
                    <div
                        key={handle}
                        className='canvas-region__handle'
                        style={{ ...HANDLE_POSITIONS[handle], cursor: RESIZE_CURSORS[handle] }}
                        onPointerDown={handleResizePointerDown(handle)}
                        onPointerMove={handleResizePointerMove}
                        onPointerUp={handleResizePointerUp}
                        onPointerCancel={handleResizePointerUp}
                    />
                ))}
            </div>
            {/* Member items are positioned relative to the region's top-left (region.x/region.y). They
                live outside the bordered box so the region's border does not offset their coordinate
                origin — otherwise items would jump by the border width when moved into or out of a
                region. */}
            <div className='canvas-region__items'>
                {children}
            </div>
        </>
    );
};
