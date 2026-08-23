// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect } from 'react';

/**
 * Suppresses native text selection for the duration of any pointer drag that starts inside the
 * given container. The `user-select: none` rules on the boards are not enough in Safari — it still
 * starts a selection on mousedown and extends it into chrome outside the board (top bar, controls,
 * dialogs) as the drag sweeps over it. While a drag is live this guard cancels `selectstart` at the
 * document level, clears any existing selection, and turns off selection on `body` (with the
 * `-webkit-` form Safari honors). Drags starting in text inputs keep native selection behavior.
 * @param containerRef The container whose pointer drags should suppress selection.
 */
export function useDragSelectionGuard(containerRef: React.RefObject<HTMLElement | null>) {
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let active = false;
        let previousUserSelect = '';
        let previousWebkitUserSelect = '';

        const suppressSelection = (event: Event) => event.preventDefault();

        const end = () => {
            if (!active) return;
            active = false;
            document.removeEventListener('selectstart', suppressSelection, true);
            document.body.style.userSelect = previousUserSelect;
            document.body.style.webkitUserSelect = previousWebkitUserSelect;
        };

        const begin = (event: PointerEvent) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest('textarea, input, [contenteditable="true"]')) return;
            if (active) return;
            active = true;
            previousUserSelect = document.body.style.userSelect;
            previousWebkitUserSelect = document.body.style.webkitUserSelect;
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            window.getSelection()?.removeAllRanges();
            document.addEventListener('selectstart', suppressSelection, true);
        };

        const handleRelease = () => end();

        container.addEventListener('pointerdown', begin, true);
        document.addEventListener('pointerup', handleRelease, true);
        document.addEventListener('pointercancel', handleRelease, true);
        return () => {
            container.removeEventListener('pointerdown', begin, true);
            document.removeEventListener('pointerup', handleRelease, true);
            document.removeEventListener('pointercancel', handleRelease, true);
            end();
        };
    }, [containerRef]);
}
