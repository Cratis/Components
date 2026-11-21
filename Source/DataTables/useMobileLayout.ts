// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useMemo, useSyncExternalStore } from 'react';
import type { DataTableMobileLayoutProps } from './DataTableMobileLayoutProps';

const serverSnapshot = () => false;
const noSubscription = () => () => undefined;

/** Whether this opt-in table should currently use cards; server rendering always uses a table. */
export const useMobileLayout = ({ mobileLayout, mobileBreakpoint = 640 }: DataTableMobileLayoutProps): boolean => {
    const breakpoint = Number.isFinite(mobileBreakpoint) && mobileBreakpoint > 0 ? mobileBreakpoint : 640;
    const query = useMemo(() => {
        if (mobileLayout !== 'cards' || typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
        return window.matchMedia(`(width < ${breakpoint}px)`);
    }, [mobileLayout, breakpoint]);
    const subscribe = useMemo(() => query ? (notify: () => void) => {
        query.addEventListener('change', notify);
        return () => query.removeEventListener('change', notify);
    } : noSubscription, [query]);
    return useSyncExternalStore(subscribe, () => query?.matches ?? false, serverSnapshot);
};
