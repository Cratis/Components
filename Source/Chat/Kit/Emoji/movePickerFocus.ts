// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { KeyboardEvent } from 'react';

/** Moves focus within a picker composite; activation remains the native button's responsibility. */
export const movePickerFocus = (event: KeyboardEvent<HTMLElement>, columns = 1) => {
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-picker-item]:not(:disabled)'));
    const index = items.indexOf(event.target as HTMLButtonElement);
    const destinations: Record<string, number> = {
        ArrowRight: (index + 1) % items.length,
        ArrowDown: index + columns < items.length ? index + columns : index,
        ArrowLeft: (index - 1 + items.length) % items.length,
        ArrowUp: Math.max(index - columns, index % columns),
        Home: 0,
        End: items.length - 1,
    };
    const destination = destinations[event.key];
    if (index < 0 || destination === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    items[destination]?.focus();
};
