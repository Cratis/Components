// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';
import { optionListOverflows } from './utils';

/**
 * Tracks whether an option list's full content is taller than the box it renders in.
 *
 * `contentRef` should point at an off-screen element holding every option - not the live,
 * possibly search-filtered list - so a user typing into the search box this hook decided to show
 * never itself shrinks the measured content below the threshold and un-decides that the box
 * needed a search in the first place. `containerRef`'s own `scrollHeight`/`clientHeight` are not
 * used for the same reason: they move as the search box appears and disappears, which would make
 * the decision chase itself. Instead the container's resolved CSS `max-height` is read directly,
 * since that value does not depend on what is currently rendered inside it.
 *
 * Pass `enabled: false` to skip measuring entirely - for callers that already know whether they
 * want a search box and do not need this hook to decide for them.
 */
export function useOptionListOverflow(
    containerRef: RefObject<HTMLElement | null>,
    contentRef: RefObject<HTMLElement | null>,
    enabled: boolean,
): boolean {
    const [overflows, setOverflows] = useState(false);

    useLayoutEffect(() => {
        if (!enabled) {
            setOverflows(false);
            return;
        }

        const container = containerRef.current;
        const content = contentRef.current;
        if (!container || !content) return;

        const measure = () => {
            const maxHeight = parseFloat(getComputedStyle(container).maxHeight) || 0;
            setOverflows(
                optionListOverflows({ contentHeight: content.scrollHeight, maxHeight }),
            );
        };

        measure();

        if (typeof ResizeObserver === 'undefined') return;

        const observer = new ResizeObserver(measure);
        observer.observe(container);
        observer.observe(content);

        return () => observer.disconnect();
    }, [containerRef, contentRef, enabled]);

    return overflows;
}
