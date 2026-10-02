// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Reports whether an element has come near the viewport, and stays true once it has - a preview that
 * has been drawn is kept rather than torn down when scrolled away. Environments without
 * `IntersectionObserver` treat everything as visible.
 * @param margin How far outside the viewport counts as near, as a CSS margin.
 * @returns A ref to put on the element, and whether it has been near the viewport.
 */
export const useIsVisible = (margin = '160px') => {
    const [isVisible, setIsVisible] = useState(typeof IntersectionObserver === 'undefined');
    const observer = useRef<IntersectionObserver | undefined>(undefined);

    useEffect(() => () => observer.current?.disconnect(), []);

    const ref = useCallback(
        (element: HTMLElement | null) => {
            observer.current?.disconnect();
            if (!element || isVisible || typeof IntersectionObserver === 'undefined') return;
            observer.current = new IntersectionObserver(
                entries => {
                    if (entries.some(entry => entry.isIntersecting)) {
                        setIsVisible(true);
                        observer.current?.disconnect();
                    }
                },
                { rootMargin: margin },
            );
            observer.current.observe(element);
        },
        [isVisible, margin],
    );

    return { ref, isVisible };
};
