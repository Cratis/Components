// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect } from 'react';
import { toast, type ToastRecord } from './toast';

const minimumDuration = 5000;

const isTimedToast = (item: ToastRecord) => !item.loading && item.duration !== 0;

/** Dismisses a toast after its duration, unless it is paused, loading or has a zero duration. */
export const useToastAutoDismiss = (item: ToastRecord, paused: boolean, timeout: number) => {
    useEffect(() => {
        if (paused || !isTimedToast(item)) return;
        const duration = item.duration ?? timeout;
        const timer = window.setTimeout(
            () => {
                item.onTimeout?.(item);
                toast.dismiss(item.id);
            },
            Math.max(duration, minimumDuration),
        );
        return () => window.clearTimeout(timer);
    }, [item, paused, timeout]);
};
