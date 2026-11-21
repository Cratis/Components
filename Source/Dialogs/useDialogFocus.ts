// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef, useState } from 'react';
import { DialogInitialFocus } from './DialogInitialFocus';
import type { DialogRefusalFeedback } from './DialogRefusalFeedback';

interface DialogFocusOptions {
    visible: boolean;
    isBusy: boolean;
    initialFocus: DialogInitialFocus;
    refusedMessage: string;
    refusalFeedback?: () => DialogRefusalFeedback | undefined;
}

interface Announcement {
    key: number;
    text: string;
}

const focusTitle = (title: HTMLHeadingElement | null) => {
    if (!title) return;
    title.tabIndex = -1;
    title.focus();
};

// After a refusal, focus goes to the feedback's target, else the enabled confirm button, else the title.
const focusAfterRefusal = (
    target: HTMLElement | null | undefined,
    confirm: HTMLButtonElement | null,
    title: HTMLHeadingElement | null,
) => {
    if (target) target.focus();
    else if (confirm && !confirm.disabled) confirm.focus();
    else focusTitle(title);
};

/**
 * Owns the dialog's focus behavior: initial focus, keeping focus off `<body>` while work is in
 * flight, and returning focus and announcing the outcome after a refused confirm.
 * @param options The dialog's visibility, busy state, resolved initial focus, refusal message and
 * optional refusal feedback that replaces the announced text and focus target.
 * @returns The refs to attach to title and buttons, the live-region announcement and a refusal notifier.
 */
export const useDialogFocus = ({
    visible,
    isBusy,
    initialFocus,
    refusedMessage,
    refusalFeedback,
}: DialogFocusOptions) => {
    const titleRef = useRef<HTMLHeadingElement>(null);
    const confirmRef = useRef<HTMLButtonElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const [refusals, setRefusals] = useState(0);
    const handledRefusals = useRef(0);
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    // Held in a ref so a new callback identity each render does not re-run the refusal effect.
    const refusalFeedbackRef = useRef(refusalFeedback);
    refusalFeedbackRef.current = refusalFeedback;

    useEffect(() => {
        if (!visible) return;
        // The title is a heading, so it is made programmatically focusable before it takes focus.
        const focusTarget =
            initialFocus === DialogInitialFocus.Confirm
                ? () => confirmRef.current?.focus()
                : initialFocus === DialogInitialFocus.Cancel
                  ? () => cancelRef.current?.focus()
                  : () => focusTitle(titleRef.current);
        const frame = requestAnimationFrame(focusTarget);
        return () => cancelAnimationFrame(frame);
    }, [initialFocus, visible]);

    // Keyboard focus must never be stranded on <body> while work is in flight: the confirm
    // button stays focusable (aria-disabled), and a focus held by a now-inert field moves to it.
    useEffect(() => {
        if (!visible || !isBusy) return;
        setAnnouncement(null);
        const active = document.activeElement;
        if (active && active !== document.body) return;
        if (confirmRef.current) confirmRef.current.focus();
        else focusTitle(titleRef.current);
    }, [isBusy, visible]);

    // A refused confirm (the dialog stays open) returns focus to the confirm button, or to the
    // title when confirm is not enabled, and announces the outcome through the live region.
    // Refusal feedback, when given, replaces the focus target and the announced text.
    useEffect(() => {
        // Each refusal is handled once: a later busy-to-idle change, such as a successful retry,
        // must neither move focus nor announce the earlier refusal again.
        if (refusals === handledRefusals.current || isBusy) return;
        handledRefusals.current = refusals;
        const feedback = refusalFeedbackRef.current?.();
        focusAfterRefusal(feedback?.focus, confirmRef.current, titleRef.current);
        setAnnouncement({ key: refusals, text: feedback?.message ?? refusedMessage });
    }, [refusals, isBusy, refusedMessage]);

    const onRefused = () => setRefusals((count) => count + 1);

    return { titleRef, confirmRef, cancelRef, announcement, onRefused };
};
