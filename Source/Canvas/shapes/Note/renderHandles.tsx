// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CSSProperties } from 'react';
import { HANDLE_KEYS, type NoteHandle } from './NoteHandle';
import type { useNoteResize } from './useNoteResize';

const HANDLE_POSITIONS: Record<NoteHandle, CSSProperties> = {
    nw: { top: -4, left: -4 },
    n: { top: -4, left: '50%', transform: 'translateX(-50%)' },
    ne: { top: -4, right: -4 },
    e: { top: '50%', right: -4, transform: 'translateY(-50%)' },
    se: { bottom: -4, right: -4 },
    s: { bottom: -4, left: '50%', transform: 'translateX(-50%)' },
    sw: { bottom: -4, left: -4 },
    w: { top: '50%', left: -4, transform: 'translateY(-50%)' },
};

const RESIZE_CURSORS: Record<NoteHandle, string> = {
    nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize', e: 'e-resize',
    se: 'se-resize', s: 's-resize', sw: 'sw-resize', w: 'w-resize',
};

export const renderHandles = ({ handleResizePointerDown, handleResizePointerMove, handleResizePointerUp }: ReturnType<typeof useNoteResize>) =>
    HANDLE_KEYS.map(handle => (
        <div
            key={handle}
            className='canvas-note__handle'
            style={{
                            ...HANDLE_POSITIONS[handle],
                            cursor: RESIZE_CURSORS[handle],
                        }}
            onPointerDown={handleResizePointerDown(handle)}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            onPointerCancel={handleResizePointerUp}
        />
    ));
