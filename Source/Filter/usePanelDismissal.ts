// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';

/** Inputs for {@link useDismissOnOutsideClick}. */
export interface UseDismissOnOutsideClickOptions {
    isOpen: boolean;
    anchorRef: RefObject<HTMLButtonElement | null>;
    panelRef: RefObject<HTMLDivElement | null>;
    onClose: () => void;
}

/** True when the element is mounted and does not contain the target. */
function isOutside(target: Node, element: HTMLElement | null): boolean {
    return !!element && !element.contains(target);
}

/** True for an Escape key press that nobody else has handled. */
function isUnhandledEscape(event: KeyboardEvent): boolean {
    return event.key === 'Escape' && !event.defaultPrevented && !event.isComposing;
}

/**
 * Closes an open panel when the user presses the pointer outside both the panel and its anchor.
 *
 * @param options - The panel, its anchor and the close callback.
 */
export function useDismissOnOutsideClick({
    isOpen,
    anchorRef,
    panelRef,
    onClose,
}: UseDismissOnOutsideClickOptions): void {
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (isOutside(event.target as Node, panelRef.current) && isOutside(event.target as Node, anchorRef.current)) {
                onClose();
            }
        };

        // Use capture phase to ensure we catch the event before any other handlers.
        // Use timeout to avoid closing immediately when clicking the button to open.
        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside, true);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, [isOpen, anchorRef, panelRef, onClose]);
}

/** Inputs for {@link useCloseOnAnchorEscape}. */
export interface UseCloseOnAnchorEscapeOptions {
    isOpen: boolean;
    anchorRef: RefObject<HTMLButtonElement | null>;
    onClose: () => void;
}

/**
 * Closes an open panel when Escape is pressed while focus is inside its anchor,
 * then returns focus to the anchor.
 *
 * @param options - The anchor and the close callback.
 */
export function useCloseOnAnchorEscape({
    isOpen,
    anchorRef,
    onClose,
}: UseCloseOnAnchorEscapeOptions): void {
    useEffect(() => {
        if (!isOpen) return;

        const handleAnchorEscape = (event: KeyboardEvent) => {
            if (!isUnhandledEscape(event)) return;
            const focused = document.activeElement;
            if (focused && anchorRef.current?.contains(focused)) {
                event.preventDefault();
                event.stopPropagation();
                onClose();
                anchorRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handleAnchorEscape, true);
        return () => {
            document.removeEventListener('keydown', handleAnchorEscape, true);
        };
    }, [isOpen, anchorRef, onClose]);
}

/** Moves focus into an open panel unless focus is already inside it. */
export function focusPanelUnlessFocused(isOpen: boolean, panel: HTMLDivElement | null) {
    if (isOpen && panel && !panel.contains(document.activeElement)) {
        panel.focus();
    }
}

/** Closes the panel on an unhandled Escape and returns focus to the anchor. */
export function closeOnPanelEscape(
    event: ReactKeyboardEvent<HTMLElement>,
    onClose: () => void,
    anchorRef: RefObject<HTMLButtonElement | null>,
) {
    if (event.key !== 'Escape' || event.defaultPrevented || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.stopPropagation();
    onClose();
    anchorRef.current?.focus();
}
