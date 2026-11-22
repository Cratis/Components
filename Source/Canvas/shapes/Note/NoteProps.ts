// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { NoteData } from './NoteData';

/** Props for a fully controlled movable, resizable, editable Canvas note. */
export interface NoteProps {
    /** Current note data. */
    note: NoteData;
    /** Whether selection handles are visible. */
    selected: boolean;

    /**
     * Selects this note. `additive` reports that the gesture carried a shift/meta/ctrl modifier, so a
     * board supporting multi-select can extend its selection instead of replacing it.
     */
    onSelect: (id: string, additive: boolean) => void;

    /** Reports drag movement. */
    onMove: (id: string, x: number, y: number) => void;
    /** Reports drag completion. */
    onMoveEnd?: (id: string) => void;
    /** Reports resize movement and the resulting bounds. */
    onResize: (id: string, x: number, y: number, width: number, height: number) => void;
    /** Reports resize completion. */
    onResizeEnd?: (id: string) => void;
    /** Reports committed text edits. */
    onTextChange: (id: string, text: string) => void;

    /**
     * Reports that the note grew to show all of its text, or shrank back. An expanded note reaches over
     * whatever sits below it, so the host has to raise it above its siblings for the duration — a note
     * renders inside its own stacking context, so it cannot do that for itself.
     */
    onExpandedChange?: (id: string, isExpanded: boolean) => void;
}
