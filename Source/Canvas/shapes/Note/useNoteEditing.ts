// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useRef, useState, type ChangeEvent, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { useOptionalMessenger } from '../../../Common/messaging/useOptionalMessenger';
import { NoteTextChanged } from './NoteTextChanged';
import type { NoteProps } from './NoteProps';

export const useNoteEditing = ({ note, onTextChange }: NoteProps) => {
    // Opt-in messaging: resolves to undefined without an Arc messenger, and the publish below then
    // simply does not happen — the `onTextChange` callback remains the note's contract either way.
    const publish = useOptionalMessenger();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [liveText, setLiveText] = useState(note.text);

    const handleDoubleClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        setLiveText(note.text);
        setIsEditing(true);
    }, [note.text]);

    const handleTextareaChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
        setLiveText(event.currentTarget.value);
    }, []);

    const handleTextareaBlur = useCallback((event: FocusEvent<HTMLTextAreaElement>) => {
        const text = event.currentTarget.value;
        onTextChange(note.id, text);
        // Published at the same commit point as the callback — once per committed edit, never
        // per keystroke — for hosts that listen on the messenger instead of (or besides) props.
        publish?.(new NoteTextChanged(note.id, text));
        setIsEditing(false);
    }, [note.id, onTextChange, publish]);

    const handleTextareaKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Escape') setIsEditing(false);
    }, []);

    // Use live text for font sizing when editing, otherwise use committed text.
    const displayText = isEditing ? liveText : note.text;
    return { textareaRef, isEditing, liveText, displayText, handleDoubleClick, handleTextareaChange, handleTextareaBlur, handleTextareaKeyDown };
};
