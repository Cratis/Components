// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useLayoutEffect, useMemo, useState, type RefObject } from 'react';
import type { ToolbarRoving } from './ToolbarRovingContext';
import {
    createToolbarTabStopState,
    dropPendingRemovals,
    markForRemoval,
    reconcileTabStop,
    registerManagedTool,
    setActiveKey,
    type ToolbarTabStopState,
} from './toolbarTabStop';
import { useMicrotaskScheduler } from './useMicrotaskScheduler';

// Only changes on a managed tool or one of its ancestors can make it unavailable.
const affectsManagedTool = (state: ToolbarTabStopState, record: MutationRecord): boolean => {
    if (record.type === 'childList') return true;
    for (const tool of state.keyByManaged.keys()) {
        if (record.target === tool || record.target.contains(tool)) return true;
    }
    return false;
};

const observeToolbar = (root: HTMLElement, state: ToolbarTabStopState, scheduleReconcile: () => void) => {
    const observer = new MutationObserver(records => {
        if (records.some(record => affectsManagedTool(state, record))) scheduleReconcile();
    });
    observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['hidden', 'inert', 'aria-hidden', 'aria-disabled', 'disabled', 'style', 'class'],
    });
    // Hiding through a stylesheet alone, such as a media query, changes no attribute; the
    // hidden tool's box collapses instead.
    if (typeof ResizeObserver !== 'undefined') {
        state.resizeObserver = new ResizeObserver(scheduleReconcile);
        state.managedByKey.forEach(tool => state.resizeObserver!.observe(tool));
    }
    return () => {
        observer.disconnect();
        state.resizeObserver?.disconnect();
        state.resizeObserver = null;
    };
};

/** Owns the single Tab stop of a toolbar: which managed tool is active, and the roving context tools register with. */
export const useToolbarTabStop = (rootRef: RefObject<HTMLElement | null>, singleTabStop: boolean) => {
    const [state] = useState(createToolbarTabStopState);

    const reconcile = useCallback(() => {
        if (singleTabStop) reconcileTabStop(rootRef.current, state);
    }, [singleTabStop, rootRef, state]);

    // Several registrations and mutations in one commit or frame need only one check.
    const scheduleReconcile = useMicrotaskScheduler(reconcile);

    // Tools that unregistered and did not register again: forget them, and choose a new Tab stop
    // if one of them was active (unmounted, or given its own tab index).
    const processRemovals = useCallback(() => {
        if (state.pendingRemoval.size === 0) return;
        dropPendingRemovals(state);
        reconcile();
    }, [state, reconcile]);
    const scheduleRemovalCheck = useMicrotaskScheduler(processRemovals);

    useLayoutEffect(reconcile);
    useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root || !singleTabStop) return;
        return observeToolbar(root, state, scheduleReconcile);
    }, [singleTabStop, scheduleReconcile, rootRef, state]);

    const roving = useMemo<ToolbarRoving | null>(() => singleTabStop ? {
        getActiveKey: () => state.activeKey,
        isInScope: key => state.inScope.has(key),
        subscribe: listener => {
            state.listeners.add(listener);
            return () => state.listeners.delete(listener);
        },
        register: (key, element) => {
            if (!element) {
                // A tooltip wrapper builds a new merged ref on every render, so React detaches and
                // re-attaches the same element within one commit. Removal waits for a microtask.
                markForRemoval(state, key);
                scheduleRemovalCheck();
                return;
            }
            // A new tool may be the first available one or lie out of scope.
            if (registerManagedTool(state, key, element)) scheduleReconcile();
        },
        // A tool outside the toolbar's scope cannot hold its single Tab stop.
        activate: key => {
            if (state.inScope.has(key)) setActiveKey(state, key);
        },
    } : null, [singleTabStop, state, scheduleReconcile, scheduleRemovalCheck]);

    return { state, roving };
};
