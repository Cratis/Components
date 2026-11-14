// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef } from 'react';

/** Enters the selected category after React Aria has mounted its lazy tab collection. */
export const useEmojiPickerFocus = () => {
    const rootRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            rootRef.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
        });
        return () => cancelAnimationFrame(frame);
    }, []);
    return rootRef;
};
