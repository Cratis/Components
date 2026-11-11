// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useRef } from 'react';

/** Returns a function that runs the callback once in a microtask however often it is called before then. */
export const useMicrotaskScheduler = (callback: () => void) => {
    const scheduled = useRef(false);
    return useCallback(() => {
        if (scheduled.current) return;
        scheduled.current = true;
        queueMicrotask(() => {
            scheduled.current = false;
            callback();
        });
    }, [callback]);
};
