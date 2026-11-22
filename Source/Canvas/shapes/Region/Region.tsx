// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type React from 'react';
import { useCallback, useRef } from 'react';
import type { HandleKey } from './HandleKey';
import { useRegionMembership } from './useRegionMembership';
import { useRegionEditing } from './useRegionEditing';
import { useRegionMove } from './useRegionMove';
import { useRegionResize } from './useRegionResize';

const HANDLE_KEYS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;

const HANDLE_POSITIONS: Record<HandleKey, React.CSSProperties> = {
    nw: { top: -4, left: -4 },
    n: { top: -4, left: '50%', transform: 'translateX(-50%)' },
    ne: { top: -4, right: -4 },
    e: { top: '50%', right: -4, transform: 'translateY(-50%)' },
    se: { bottom: -4, right: -4 },
    s: { bottom: -4, left: '50%', transform: 'translateX(-50%)' },
    sw: { bottom: -4, left: -4 },
    w: { top: '50%', left: -4, transform: 'translateY(-50%)' },
};

const RESIZE_CURSORS: Record<HandleKey, string> = {
    nw: 'nw-resize',
    n: 'n-resize',
    ne: 'ne-resize',
    e: 'e-resize',
    se: 'se-resize',
    s: 's-resize',
    sw: 'sw-resize',
    w: 'w-resize',
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
     * a host that also places other shapes at region-relative coordinates lines them up correctly.
     * Rendering something here does not make it a "member": the region detects containment against
     * sibling `CanvasItem`s that carry an `id` and *reports* it over the Arc messenger (see
     * {@link ItemAddedToRegion}/{@link ItemRemovedFromRegion}), but it never moves members, persists
     * nothing, and knows nothing about item types — deciding what membership means, storing it, and
     * moving members along with the region is board-level orchestration left entirely to the host.
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
 *
 * Opt-in membership reporting: when an Arc messenger is resolvable, the region watches the Canvas
 * item registry and publishes {@link ItemAddedToRegion}/{@link ItemRemovedFromRegion} whenever a
 * sibling `CanvasItem` carrying an `id` gains or loses containment (by center point) — including
 * when the region itself is moved or resized over items. By convention the `CanvasItem` wrapping
 * this region is given `id={region.id}`, which is how the region recognizes and excludes itself.
 * Without an `ArcContext.Provider` (or with items that carry no `id`) all of this is silently inert.
 */
export const Region = (props: RegionProps) => {
    const { region, selected, children } = props;
    const regionRef = useRef<HTMLDivElement>(null);
    const editing = useRegionEditing(props);
    useRegionMembership(region);

    const readEffectiveZoom = useCallback((): number => {
        if (!regionRef.current) return 1;
        const renderedWidth = regionRef.current.getBoundingClientRect().width;
        return renderedWidth > 0 ? renderedWidth / region.width : 1;
    }, [region.width]);

    const { handlePointerDown, handlePointerMove, handlePointerUp } = useRegionMove(props, editing, readEffectiveZoom);
    const { handleResizePointerDown, handleResizePointerMove, handleResizePointerUp } =
        useRegionResize(props, editing.clickedTitleBarRef, readEffectiveZoom);
    const { isEditing, titleBarRef, handleDoubleClick, handleInputBlur, handleInputKeyDown } = editing;

    return (
        <>
            <div
                ref={regionRef}
                data-cratis-component='Region'
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
                            onPointerDown={(event) => event.stopPropagation()}
                        />
                    ) : (
                        <span className='canvas-region__name'>{region.name}</span>
                    )}
                </div>

                {selected &&
                    HANDLE_KEYS.map((handle) => (
                        <div
                            key={handle}
                            className='canvas-region__handle'
                            style={{
                                ...HANDLE_POSITIONS[handle],
                                cursor: RESIZE_CURSORS[handle],
                            }}
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
            <div data-cratis-component='Region' className='canvas-region__items'>{children}</div>
        </>
    );
};
