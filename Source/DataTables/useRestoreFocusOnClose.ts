// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useRef, type RefObject } from 'react';

const focusWasDropped = (trigger: HTMLElement, popover: HTMLElement | null): boolean => {
    const ownerDocument = trigger.ownerDocument;
    const focusedElement = ownerDocument.activeElement;
    return (
        !focusedElement ||
        focusedElement === ownerDocument.body ||
        !focusedElement.isConnected ||
        popover?.contains(focusedElement) === true
    );
};

/**
 * Restores focus to the trigger when the popover closes, but only when the close actually dropped focus.
 * Returns the ref callback that captures the popover element.
 */
export const useRestoreFocusOnClose = (isOpen: boolean, triggerRef: RefObject<HTMLElement | null>) => {
    const popoverRef = useRef<HTMLElement | null>(null);
    // Sticky on purpose: React detaches the popover's ref during the same commit that closes the
    // menu, before the effect cleanup below runs, so the last element we saw is the only handle we
    // still have on the popover that is going away.
    const capturePopover = useCallback((element: HTMLElement | null) => {
        if (element) popoverRef.current = element;
    }, []);

    // React Aria's FocusScope already draws that distinction - at teardown it asks whether the
    // active element is still inside the dying scope or has already fallen to `document.body`, and
    // it leaves focus alone otherwise. Its weakness is only the timing: it defers the real restore
    // to a `requestAnimationFrame` that re-tests `activeElement === body`, which lands a frame after
    // focus has visibly left the trigger's neighborhood and silently does nothing if anything else
    // claims focus first. We keep its question and drop its delay: the same predicate is evaluated
    // synchronously in this cleanup, so the restore happens in the commit that closed the menu.
    //
    // "Dropped" has to be read at the moment this cleanup runs, while the popover is still exiting.
    // Focus is typically still on the popover's own content (its value input), which is about to be
    // removed - that is a drop in progress, not a destination. So a drop is: nothing focused, the
    // body, a node already detached from the document, or anything inside this menu's own popover.
    // Focus anywhere else is somewhere the user deliberately went, such as another column's filter
    // trigger, and must be left alone.
    useEffect(() => {
        if (!isOpen) return;
        return () => {
            const trigger = triggerRef.current;
            if (trigger && focusWasDropped(trigger, popoverRef.current)) trigger.focus();
        };
    }, [isOpen, triggerRef]);

    return capturePopover;
};
