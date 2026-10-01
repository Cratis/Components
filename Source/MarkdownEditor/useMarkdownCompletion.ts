// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { MarkdownCompletion } from './MarkdownCompletion';
import type { MarkdownCompletionMatch } from './MarkdownCompletionMatch';
import type { MarkdownSuggestion } from './MarkdownSuggestion';
import type { MarkdownTextEdit } from './MarkdownTextEdit';
import { findCompletionMatch } from './findCompletionMatch';
import { replaceRange } from './replaceRange';

const defaultDebounce = 150;

interface Answer {
    session: string;
    suggestions: readonly MarkdownSuggestion[];
}

/**
 * The state of the completion being typed at the caret, as {@link useMarkdownCompletion} reports it.
 */
export interface MarkdownCompletionState {
    /** The completion being typed, when there is one and it has not been dismissed. */
    match?: MarkdownCompletionMatch;

    /** The suggestions on offer. Empty while none are known. */
    suggestions: readonly MarkdownSuggestion[];

    /** Whether the suggestion list is open. */
    isOpen: boolean;

    /** The index of the highlighted suggestion, which Enter or Tab picks. */
    activeIndex: number;

    /** Highlights a suggestion, as the pointer moving onto it does. */
    highlight: (index: number) => void;

    /**
     * Works out the markdown after picking a suggestion, and closes the list.
     * @param suggestion The picked suggestion.
     * @returns The edit to apply, or undefined when nothing is being completed.
     */
    choose: (suggestion: MarkdownSuggestion) => MarkdownTextEdit | undefined;

    /**
     * Handles the keys the open list owns: the arrows move the highlight, Enter and Tab pick, Escape
     * dismisses the list until the person starts another completion.
     * @param event The key event from the writing area.
     * @returns The edit to apply when a suggestion was picked.
     */
    handleKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => MarkdownTextEdit | undefined;
}

const sessionOf = (match: MarkdownCompletionMatch) => `${match.completionIndex}:${match.start}`;

/**
 * Tracks the completion being typed at the caret, asks it for suggestions once typing pauses, and
 * drops answers that arrive for a query the person has already typed past.
 * @param value The markdown being edited.
 * @param selectionStart Where the selection starts.
 * @param selectionEnd Where the selection ends. Completion only runs on a plain caret.
 * @param completions The configured completions.
 * @returns The {@link MarkdownCompletionState}.
 */
export const useMarkdownCompletion = (
    value: string,
    selectionStart: number,
    selectionEnd: number,
    completions: readonly MarkdownCompletion[],
): MarkdownCompletionState => {
    const [answer, setAnswer] = useState<Answer>();
    const [activeIndex, setActiveIndex] = useState(0);
    const [dismissedSession, setDismissedSession] = useState<string>();

    const found =
        completions.length > 0 && selectionStart === selectionEnd
            ? findCompletionMatch(value, selectionStart, completions)
            : undefined;
    const session = found ? sessionOf(found) : undefined;
    const match = found && session !== dismissedSession ? found : undefined;
    const request = match ? `${sessionOf(match)}:${match.query}` : undefined;

    // The completions are usually recreated on every render of the host; only the request decides
    // when to ask again, and the ask reads whichever completion is current.
    const matchRef = useRef(match);
    matchRef.current = match;

    useEffect(() => {
        const current = matchRef.current;
        if (!current) return;
        const controller = new AbortController();
        const requestSession = sessionOf(current);
        const timeout = window.setTimeout(() => {
            Promise.resolve()
                .then(() => current.completion.suggest(current.query, { signal: controller.signal }))
                .then(
                    suggestions => {
                        if (!controller.signal.aborted) setAnswer({ session: requestSession, suggestions });
                    },
                    () => {
                        if (!controller.signal.aborted) setAnswer({ session: requestSession, suggestions: [] });
                    },
                );
        }, current.completion.debounce ?? defaultDebounce);

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [request]);

    // A dismissal lasts until the trigger it dismissed is gone - typing it again starts afresh.
    useEffect(() => {
        if (session === undefined) setDismissedSession(undefined);
    }, [session]);

    // An answer from the same session stays on screen while the next one is asked for, so the list
    // does not flicker on every keystroke.
    const suggestions = match && answer?.session === sessionOf(match) ? answer.suggestions : [];
    const isOpen = suggestions.length > 0;
    const highlighted = Math.min(activeIndex, Math.max(suggestions.length - 1, 0));

    useEffect(() => setActiveIndex(0), [answer]);

    const choose = (suggestion: MarkdownSuggestion) => {
        if (!match) return undefined;
        setAnswer(undefined);
        return replaceRange(value, match.start, match.end, suggestion.insertText);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (!isOpen || !match) return undefined;
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                setActiveIndex((highlighted + 1) % suggestions.length);
                return undefined;
            case 'ArrowUp':
                event.preventDefault();
                setActiveIndex((highlighted - 1 + suggestions.length) % suggestions.length);
                return undefined;
            case 'Enter':
            case 'Tab':
                event.preventDefault();
                return choose(suggestions[highlighted]);
            case 'Escape':
                event.preventDefault();
                event.stopPropagation();
                setDismissedSession(sessionOf(match));
                return undefined;
            default:
                return undefined;
        }
    };

    return {
        match,
        suggestions,
        isOpen,
        activeIndex: highlighted,
        highlight: setActiveIndex,
        choose,
        handleKeyDown,
    };
};
