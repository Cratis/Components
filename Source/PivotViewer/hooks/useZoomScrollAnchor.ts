// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef, useState } from 'react';

/**
 * Keeps the content the viewport is looking at in view when the scrollable area is resized by a
 * zoom change.
 *
 * Zooming resizes the content underneath a scroll offset that stays where it was, so without this
 * the view lands somewhere unrelated to what the user was looking at. Zooming all the way out is
 * the worst case: the content then fits the viewport, the scroll range collapses to nothing, and
 * zooming back in leaves the offset at zero.
 *
 * In grouped mode that is not merely disorienting - it looks broken. Groups are drawn from the
 * bottom up, so the top of the scrollable area is empty for every group shorter than the tallest
 * one, and an offset of zero shows a blank canvas with no clue that the cards are below. Grouped
 * mode therefore holds its distance from the *bottom*, which is where its content is anchored;
 * every other mode holds the centre.
 *
 * This watches the spacer that defines the scrollable area rather than the zoom level, because the
 * spacer is what actually resizes - reacting to the zoom directly would read the extent before it
 * had been laid out. The wheel handler keeps its own cursor-anchored adjustment for the gesture in
 * progress; this covers the zoom paths that have no anchor of their own, such as the toolbar's
 * buttons, slider and reset.
 *
 * @param containerRef The scrolling viewport.
 * @param spacerRef The element whose size defines the scrollable area.
 * @param viewMode The active view mode.
 */
export function useZoomScrollAnchor(
    containerRef: React.RefObject<HTMLDivElement | null>,
    spacerRef: React.RefObject<HTMLDivElement | null>,
    viewMode: string,
) {
    const [spacer, setSpacer] = useState<HTMLDivElement | null>(null);
    const previousExtent = useRef<{ width: number; height: number } | null>(null);
    const viewModeRef = useRef(viewMode);
    viewModeRef.current = viewMode;

    // The spacer mounts inside a child, a render or more after this hook first runs, and a ref
    // object never changes identity - so the element is picked up by comparing it after a render
    // rather than by depending on the ref.
    useEffect(() => {
        if (spacerRef.current !== spacer) setSpacer(spacerRef.current);
    });

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !spacer) return;

        const anchor = (previous: { width: number; height: number }) => {
            const height = spacer.offsetHeight;
            const width = spacer.offsetWidth;
            if (previous.height <= 0 || previous.width <= 0) return;
            if (previous.height === height && previous.width === width) return;

            const maxScrollTop = Math.max(0, height - container.clientHeight);
            const maxScrollLeft = Math.max(0, width - container.clientWidth);

            const horizontalRatio = width / previous.width;
            const anchoredLeft =
                (container.scrollLeft + container.clientWidth / 2) * horizontalRatio
                - container.clientWidth / 2;
            container.scrollLeft = Math.min(maxScrollLeft, Math.max(0, anchoredLeft));

            const verticalRatio = height / previous.height;
            if (viewModeRef.current === 'grouped') {
                const previousMaxScrollTop = Math.max(0, previous.height - container.clientHeight);
                const gapFromBottom = Math.max(0, previousMaxScrollTop - container.scrollTop);
                container.scrollTop = Math.min(
                    maxScrollTop,
                    Math.max(0, maxScrollTop - gapFromBottom * verticalRatio));
            } else {
                const anchoredTop =
                    (container.scrollTop + container.clientHeight / 2) * verticalRatio
                    - container.clientHeight / 2;
                container.scrollTop = Math.min(maxScrollTop, Math.max(0, anchoredTop));
            }
        };

        previousExtent.current ??= { width: spacer.offsetWidth, height: spacer.offsetHeight };

        const observer = new ResizeObserver(() => {
            const previous = previousExtent.current;
            previousExtent.current = { width: spacer.offsetWidth, height: spacer.offsetHeight };
            if (previous) anchor(previous);
        });
        observer.observe(spacer);

        return () => observer.disconnect();
    }, [containerRef, spacer]);
}
