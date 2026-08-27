// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type React from 'react';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { AnchoredOverlay } from './AnchoredOverlay';
import type { BuildAvatarUrlParams } from './Avatar';
import { activeMentionQuery } from './Mentions/activeMentionQuery';
import { applyMention } from './Mentions/applyMention';
import { matchCandidates } from './Mentions/matchCandidates';
import { MentionSuggestions, type MentionCandidate } from './Mentions';
import { ReactionPicker, type ReactionPickerLabels } from './ReactionPicker';

/** Overrides for the composer's own labels. Any field left unset falls back to a literal English
 *  default. */
export interface ChatComposerLabels {
    /** Placeholder text for the draft input. Defaults to `'Write a message… (Enter to send)'`. */
    placeholder?: string;
    /** Tooltip/accessible label for the emoji-insert toggle. Defaults to `'Insert emoji'`. */
    insertEmoji?: string;
    /** Tooltip for the send button. Defaults to `'Send'`. */
    send?: string;
    /** Accessible label for the send button. Defaults to `'Send message'`. */
    sendMessage?: string;
    /** Labels forwarded to the emoji-insert {@link ReactionPicker}. */
    reactionPicker?: ReactionPickerLabels;
}

/**
 * Props for the compose row of a conversation — the text area, the `@` mention list it opens, and
 * the send button. It owns the draft so the surrounding panel stays a renderer of messages.
 */
export interface ChatComposerProps {
    /** Everyone who can be mentioned from this conversation. Omit to turn mentions off. */
    mentionCandidates?: MentionCandidate[];

    /**
     * Resolves who can be mentioned as the person types, invoked with what has been typed after
     * the `@` — for hosts whose candidates come from a lookup rather than a list they already
     * hold. May answer synchronously or with a promise; a stale answer (one that arrives after
     * the query has moved on) is dropped. Combines with {@link mentionCandidates} when both are
     * given.
     * @param query What has been typed after the `@`.
     * @returns The candidates matching the query.
     */
    resolveMentionCandidates?: (
        query: string,
    ) => MentionCandidate[] | Promise<MentionCandidate[]>;

    /**
     * Invoked with the trimmed message text when the user sends, together with who that text
     * actually mentions — reduced from every candidate the draft saw, so a mention that was
     * picked but edited away again does not count.
     */
    onSend: (text: string, mentions: MentionCandidate[]) => void;

    /** Whether to take focus when mounted. */
    autoFocus?: boolean;

    /** Builds the avatar image URL for mention candidates. Omit to always show initials. */
    buildAvatarUrl?: (params: BuildAvatarUrlParams) => string;

    /** Overrides for the composer's labels. Unset fields fall back to literal English defaults. */
    labels?: ChatComposerLabels;
}

/**
 * Imperative actions a caller can drive on the composer without owning its draft state — used by a
 * quick reply, which sets the starting text for whatever the person types next rather than sending
 * anything itself.
 */
export interface ChatComposerHandle {
    /** Replaces the current draft and takes focus, caret placed at the end. */
    prefill: (text: string) => void;
}

/**
 * The compose row of a conversation — the text area, the `@` mention list it opens, and the send
 * button. It owns the draft so the surrounding panel stays a renderer of messages.
 */
export const ChatComposer = forwardRef<ChatComposerHandle, ChatComposerProps>(
    (
        { mentionCandidates, onSend, autoFocus = false, buildAvatarUrl, labels },
        handleRef,
    ) => {
        const [draft, setDraft] = useState({ text: '', caret: 0 });
        const [highlightedIndex, setHighlightedIndex] = useState(0);
        const [showEmojiPicker, setShowEmojiPicker] = useState(false);
        const inputRef = useRef<HTMLTextAreaElement>(null);
        const emojiButtonRef = useRef<HTMLButtonElement>(null);

        const query = mentionCandidates
            ? activeMentionQuery(draft.text, draft.caret)
            : null;
        const suggestions = query
            ? matchCandidates(mentionCandidates ?? [], query.text)
            : [];
        const isSuggesting = suggestions.length > 0;
        const highlighted = Math.min(highlightedIndex, suggestions.length - 1);

        useEffect(() => {
            if (autoFocus) {
                inputRef.current?.focus();
            }
        }, [autoFocus]);

        useImperativeHandle(
            handleRef,
            () => ({
                prefill: (text: string) => {
                    setDraft({ text, caret: text.length });
                    requestAnimationFrame(() => {
                        inputRef.current?.focus();
                        inputRef.current?.setSelectionRange(text.length, text.length);
                    });
                },
            }),
            [],
        );

        const readDraft = (element: HTMLTextAreaElement) => {
            const text = element.value;
            // Only editing the text restarts the selection. Resetting on every key event would undo the
            // arrow-key navigation on the very next keyup.
            if (text !== draft.text) {
                setHighlightedIndex(0);
            }
            setDraft({ text, caret: element.selectionStart ?? text.length });
        };

        const send = () => {
            const trimmed = draft.text.trim();
            if (!trimmed) return;
            onSend(trimmed);
            setDraft({ text: '', caret: 0 });
        };

        const choose = (candidate: MentionCandidate) => {
            if (!query) return;
            const applied = applyMention(draft.text, draft.caret, query, candidate.name);
            setDraft(applied);
            setHighlightedIndex(0);
            // The caret has to be restored after React has written the new value back into the element.
            requestAnimationFrame(() =>
                inputRef.current?.setSelectionRange(applied.caret, applied.caret),
            );
            inputRef.current?.focus();
        };

        const insertEmoji = (emoji: string) => {
            const text = `${draft.text.slice(0, draft.caret)}${emoji}${draft.text.slice(draft.caret)}`;
            const caret = draft.caret + emoji.length;
            setDraft({ text, caret });
            setShowEmojiPicker(false);
            // Same restore-after-write pattern as choose() above — React has to write the new value in
            // before the caret can be placed past the emoji it inserted.
            requestAnimationFrame(() => {
                inputRef.current?.focus();
                inputRef.current?.setSelectionRange(caret, caret);
            });
        };

        const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (isSuggesting) {
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    const step = event.key === 'ArrowDown' ? 1 : suggestions.length - 1;
                    setHighlightedIndex((highlighted + step) % suggestions.length);
                    return;
                }

                if (event.key === 'Enter' || event.key === 'Tab') {
                    event.preventDefault();
                    choose(suggestions[highlighted]);
                    return;
                }

                if (event.key === 'Escape') {
                    event.preventDefault();
                    // Closing the list without changing the text: move the caret past the mention so the
                    // query no longer resolves.
                    setDraft((previous) => ({
                        ...previous,
                        caret: previous.text.length,
                    }));
                    return;
                }
            }

            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                send();
            }
        };

        return (
            <div className='chat-composer'>
                {isSuggesting && (
                    <MentionSuggestions
                        candidates={suggestions}
                        highlightedIndex={highlighted}
                        onSelect={choose}
                        onHighlight={setHighlightedIndex}
                        buildAvatarUrl={buildAvatarUrl}
                    />
                )}
                <textarea
                    ref={inputRef}
                    className='chat-composer__input'
                    value={draft.text}
                    onChange={(event) => readDraft(event.target)}
                    onKeyUp={(event) => readDraft(event.currentTarget)}
                    onClick={(event) => readDraft(event.currentTarget)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        labels?.placeholder ?? 'Write a message… (Enter to send)'
                    }
                    rows={2}
                />
                <button
                    ref={emojiButtonRef}
                    type='button'
                    className='chat-composer__emoji-toggle'
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setShowEmojiPicker((previous) => !previous)}
                    title={labels?.insertEmoji ?? 'Insert emoji'}
                    aria-label={labels?.insertEmoji ?? 'Insert emoji'}
                    aria-expanded={showEmojiPicker}
                >
                    ☺
                </button>
                <button
                    type='button'
                    className='chat-composer__send'
                    onClick={send}
                    disabled={!draft.text.trim()}
                    title={labels?.send ?? 'Send'}
                    aria-label={labels?.sendMessage ?? 'Send message'}
                >
                    <svg
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2.5'
                        aria-hidden='true'
                    >
                        <line x1='22' y1='2' x2='11' y2='13' />
                        <polygon points='22 2 15 22 11 13 2 9 22 2' />
                    </svg>
                </button>
                {/* Portaled to <body>, same reason as the reaction picker on a message bubble: the chat
                panel scrolls/clips, so a picker positioned inside it would be cut off at the edge. */}
                <AnchoredOverlay
                    anchorRef={emojiButtonRef}
                    open={showEmojiPicker}
                    side='above'
                    align='right'
                    gap={6}
                >
                    <ReactionPicker
                        anchorRef={emojiButtonRef}
                        onPick={insertEmoji}
                        onDismiss={() => setShowEmojiPicker(false)}
                        labels={labels?.reactionPicker}
                    />
                </AnchoredOverlay>
            </div>
        );
    },
);
ChatComposer.displayName = 'ChatComposer';
