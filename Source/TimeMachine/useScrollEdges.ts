// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef, useState } from 'react';

const scrollBehavior = (): ScrollBehavior =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

/**
 * Tracks whether a scrollable container has content above or below its viewport
 * and offers scrolling to either end, honoring the reduced-motion preference.
 * @param contentKey A value that changes when the content size changes, so the edges are measured again.
 */
export const useScrollEdges = (contentKey: number) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [canScrollUp, setCanScrollUp] = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);

    const updateScrollState = () => {
        const container = containerRef.current;
        if (!container) {
            setCanScrollUp(false);
            setCanScrollDown(false);
            return;
        }
        const { scrollTop, scrollHeight, clientHeight } = container;
        setCanScrollUp(scrollTop > 1);
        setCanScrollDown(scrollTop + clientHeight < scrollHeight - 1);
    };

    useEffect(() => {
        updateScrollState();
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener('scroll', updateScrollState);
        return () => container.removeEventListener('scroll', updateScrollState);
    }, [contentKey]);

    const scrollToTop = () =>
        containerRef.current?.scrollTo({ top: 0, behavior: scrollBehavior() });
    const scrollToBottom = () => {
        const container = containerRef.current;
        if (container)
            container.scrollTo({
                top: container.scrollHeight,
                behavior: scrollBehavior(),
            });
    };

    return { containerRef, canScrollUp, canScrollDown, scrollToTop, scrollToBottom };
};
