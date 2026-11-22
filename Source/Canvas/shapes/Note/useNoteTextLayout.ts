// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { NoteData } from './NoteData';
import { findOptimalFontSize } from './fitText';
import { whenNoteFontReady } from './noteFont';
import { LINE_HEIGHT_RATIO, MAX_FONT_SIZE, PADDING } from './textMetrics';

export const useNoteTextLayout = (note: NoteData, displayText: string) => {
    const measurerRef = useRef<HTMLDivElement>(null);
    const [fontSize, setFontSize] = useState(MAX_FONT_SIZE);
    const [textareaTopPadding, setTextareaTopPadding] = useState(PADDING);
    // True once the text no longer fits even at the readability floor — shows the "see full text" button.
    const [isOverflowing, setIsOverflowing] = useState(false);
    // The height the note needs to show every line of its text at the fitted size.
    const [fullTextHeight, setFullTextHeight] = useState(0);
    // The note face is a webfont, so the first measurement can land against the fallback's metrics.
    // Flipping this re-runs the fit once the real face is in.
    const [isFontReady, setIsFontReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        void whenNoteFontReady().then(() => {
            if (!cancelled) setIsFontReady(true);
        });
        return () => { cancelled = true; };
    }, []);

    // Measure optimal font size using an off-screen div that mirrors the note's
    // word-wrap behavior. Runs synchronously before paint so there is no flash.
    // Also measures actual text height so the textarea can be vertically centered.
    useLayoutEffect(() => {
        if (!measurerRef.current) return;
        const { fontSize: optimal, overflows } = findOptimalFontSize(measurerRef.current, displayText, note.width, note.height);
        setFontSize(optimal);
        setIsOverflowing(overflows);

        // After finding the font, read the actual rendered text height to compute
        // vertical padding that centers the text inside the textarea.
        const measurer = measurerRef.current;
        measurer.style.width = `${note.width - PADDING * 2}px`;
        measurer.style.fontSize = `${optimal}px`;
        measurer.style.lineHeight = `${LINE_HEIGHT_RATIO}`;
        measurer.textContent = displayText || '\u00A0';
        const renderedHeight = measurer.scrollHeight;
        const topPad = Math.max(PADDING, (note.height - renderedHeight) / 2);
        setTextareaTopPadding(topPad);
        // The same measurement answers how tall the note has to grow to show everything.
        setFullTextHeight(renderedHeight + PADDING * 2);
    }, [displayText, note.width, note.height, isFontReady]);

    return { measurerRef, fontSize, textareaTopPadding, isOverflowing, fullTextHeight };
};
