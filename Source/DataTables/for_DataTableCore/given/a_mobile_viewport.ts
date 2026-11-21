// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { vi } from 'vitest';

/** A controllable viewport that follows the strict CSS width query used by mobile cards. */
export const aMobileViewport = (initialWidth = 639) => {
    let width = initialWidth;
    const queries = new Map<string, MediaQueryList>();
    const listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
    vi.stubGlobal('matchMedia', (media: string) => {
        if (!queries.has(media)) {
            const changes = new Set<EventListenerOrEventListenerObject>();
            listeners.set(media, changes);
            queries.set(media, {
                media,
                get matches() { return width < Number(media.match(/[\d.]+/)?.[0]); },
                addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => changes.add(listener),
                removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => changes.delete(listener),
            } as MediaQueryList);
        }
        return queries.get(media);
    });
    return {
        resize: (nextWidth: number) => {
            width = nextWidth;
            listeners.forEach((changes) => changes.forEach((listener) => {
                if (typeof listener === 'function') listener(new Event('change'));
            }));
        },
        listenerCount: () => [...listeners.values()].reduce((count, changes) => count + changes.size, 0),
    };
};
