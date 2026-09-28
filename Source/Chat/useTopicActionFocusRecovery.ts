// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useLayoutEffect, useRef, type FocusEvent, type RefObject } from 'react';

/**
 * Keeps keyboard focus in a topic list when a focused topic action disappears, because
 * invoking it made the action unavailable or removed its topic. Without this, the unmounted
 * button drops focus to the document body.
 *
 * Focus moves to the same topic's opening button, or, when the topic is gone, to the topic that
 * took its place in the order last rendered, then to the list's New topic button. Focus that the
 * host already moved elsewhere, such as into a rename dialog, is left alone, and an action that
 * lost focus while still mounted is forgotten.
 * @param listRef The list whose rows each hold one topic.
 * @param orderedTopicKeys The topic keys in rendered row order.
 * @returns Focus and blur handlers to attach to each topic action button.
 */
export const useTopicActionFocusRecovery = (
    listRef: RefObject<HTMLUListElement | null>,
    orderedTopicKeys: readonly string[],
) => {
    const focusedActionRef = useRef<{ element: HTMLElement; topicKey: string } | null>(null);
    // The row order from the last commit, so a removed topic's position reflects any re-sorting
    // that happened after its action gained focus.
    const committedTopicKeysRef = useRef<readonly string[]>([]);

    useLayoutEffect(() => {
        const previousTopicKeys = committedTopicKeysRef.current;
        committedTopicKeysRef.current = orderedTopicKeys;
        const focused = focusedActionRef.current;
        if (!focused || focused.element.isConnected) return;
        focusedActionRef.current = null;
        const active = document.activeElement;
        if (active && active !== document.body) return;
        const rows = Array.from(listRef.current?.children ?? []);
        const sameTopic = orderedTopicKeys.indexOf(focused.topicKey);
        const row = sameTopic >= 0
            ? rows[sameTopic]
            : rows[Math.min(Math.max(previousTopicKeys.indexOf(focused.topicKey), 0), rows.length - 1)];
        const target = row?.querySelector<HTMLElement>('.cratis-chat-topics__topic') ??
            listRef.current?.parentElement?.querySelector<HTMLElement>('.cratis-chat-topics__start');
        target?.focus();
    });

    return {
        onActionFocus: (topicKey: string) => (event: FocusEvent<HTMLElement>) => {
            focusedActionRef.current = { element: event.currentTarget, topicKey };
        },
        onActionBlur: (event: FocusEvent<HTMLElement>) => {
            // A button removed while focused is already disconnected here, so only a deliberate
            // focus change on a still-mounted action clears the tracking.
            const element = event.currentTarget;
            queueMicrotask(() => {
                if (focusedActionRef.current?.element === element && element.isConnected) {
                    focusedActionRef.current = null;
                }
            });
        },
    };
};
