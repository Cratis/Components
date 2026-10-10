// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect } from 'react';
import type { RefObject } from 'react';

/** Inputs for {@link useDismissOnOutsideClick}. */
export interface UseDismissOnOutsideClickOptions {
    isOpen: boolean;
    anchorRef: RefObject<HTMLButtonElement | null>;
    panelRef: RefObject<HTMLDivElement | null>;
    onClose: () => void;
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
            const target = event.target as Node;
            const panel = panelRef.current;
            const anchor = anchorRef.current;

            if (panel && !panel.contains(target) && anchor && !anchor.contains(target)) {
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
            if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return;
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
