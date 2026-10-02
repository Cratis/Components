// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useSyncExternalStore } from 'react';

/** Viewports at most this wide show the popout as a contained sheet rather than anchored to the trigger. */
export const narrowViewportQuery = '(max-width: 30rem)';

const subscribe = (notify: () => void) => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => undefined;
    const query = window.matchMedia(narrowViewportQuery);
    query.addEventListener('change', notify);
    return () => query.removeEventListener('change', notify);
};

const read = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(narrowViewportQuery).matches;

/**
 * Whether the viewport is narrow enough that the popout should be a sheet. Server rendering and
 * environments without `matchMedia` are never narrow.
 * @returns True on a narrow viewport.
 */
export const useNarrowViewport = (): boolean => useSyncExternalStore(subscribe, read, () => false);
