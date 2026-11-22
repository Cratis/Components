// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import type { NoteProps } from './NoteProps';

export const useNoteExpansion = ({ note, onExpandedChange }: NoteProps, isOverflowing: boolean, isEditing: boolean) => {
    const [isShowingFullText, setIsShowingFullText] = useState(false);
    const isExpanded = isShowingFullText && isOverflowing && !isEditing;

    // Editing, retyping or resizing the note re-fits the text, and the note may well fit again — the
    // grown state belongs to the text that no longer fits, so it never outlives it.
    useEffect(() => {
        if (!isOverflowing) setIsShowingFullText(false);
    }, [isOverflowing]);

    useEffect(() => {
        onExpandedChange?.(note.id, isExpanded);
    }, [isExpanded, note.id, onExpandedChange]);

    const handleExpand = useCallback((event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setIsShowingFullText(true);
    }, []);

    // Growing is a look, not a mode: the note falls back to its own size the moment the pointer leaves it.
    const handlePointerLeave = useCallback(() => setIsShowingFullText(false), []);
    return { isExpanded, handleExpand, handlePointerLeave };
};
