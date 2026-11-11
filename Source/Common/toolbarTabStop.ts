// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { isDisabledTool, isHiddenInside, isInToolbarScope, toolSelector } from './toolbarFocusQueries';

/** What a toolbar knows about the tools it owns in single-Tab-stop mode. */
export interface ToolbarTabStopState {
    // Their -1 tab index comes from this toolbar, so it does not make them unreachable by arrow keys.
    managedByKey: Map<string, HTMLElement>;
    keyByManaged: Map<HTMLElement, string>;
    activeKey: string | null;
    listeners: Set<() => void>;
    // Keys of managed tools that lie in this toolbar's own DOM scope. A tool rendered through a
    // portal or under a nested consumer toolbar can never be reached from here, so it keeps its
    // native Tab stop instead of a -1 the toolbar could never lift.
    inScope: Set<string>;
    resizeObserver: ResizeObserver | null;
    pendingRemoval: Set<string>;
}

export const createToolbarTabStopState = (): ToolbarTabStopState => ({
    managedByKey: new Map(),
    keyByManaged: new Map(),
    activeKey: null,
    listeners: new Set(),
    inScope: new Set(),
    resizeObserver: null,
    pendingRemoval: new Set(),
});

export const notifyListeners = (state: ToolbarTabStopState): void => state.listeners.forEach(listener => listener());

export const setActiveKey = (state: ToolbarTabStopState, key: string | null): boolean => {
    if (state.activeKey === key) return false;
    state.activeKey = key;
    notifyListeners(state);
    return true;
};

export const isAvailableTool = (root: HTMLElement | null, state: ToolbarTabStopState, tool: HTMLElement): boolean => {
    if (!root || !isInToolbarScope(root, tool) || isDisabledTool(tool)) return false;
    if (tool.getAttribute('tabindex') === '-1' && !state.keyByManaged.has(tool)) return false;
    return !isHiddenInside(tool, root);
};

export const availableTools = (root: HTMLElement | null, state: ToolbarTabStopState): HTMLElement[] =>
    root ? Array.from(root.querySelectorAll<HTMLElement>(toolSelector)).filter(tool => isAvailableTool(root, state, tool)) : [];

// Drops stale keys and records which managed tools moved in or out of scope; true when any did.
const syncScope = (root: HTMLElement | null, state: ToolbarTabStopState): boolean => {
    let scopeChanged = false;
    for (const key of state.inScope) {
        if (!state.managedByKey.has(key)) state.inScope.delete(key);
    }
    for (const [key, element] of state.managedByKey) {
        const inside = isInToolbarScope(root, element);
        if (inside === state.inScope.has(key)) continue;
        if (inside) state.inScope.add(key);
        else state.inScope.delete(key);
        scopeChanged = true;
    }
    return scopeChanged;
};

const isActiveToolUsable = (root: HTMLElement | null, state: ToolbarTabStopState): boolean => {
    const key = state.activeKey;
    const element = key === null ? undefined : state.managedByKey.get(key);
    return !!element && state.inScope.has(key!) && isAvailableTool(root, state, element);
};

/**
 * Keeps the active tool available: when it is removed, disabled, hidden, moved out of scope, or
 * opts out with its own tab index, the first available tool the toolbar owns becomes the single
 * Tab stop. This only changes the toolbar's own state; tools render their tab index from it.
 */
export const reconcileTabStop = (root: HTMLElement | null, state: ToolbarTabStopState): void => {
    const scopeChanged = syncScope(root, state);
    // Checking the active tool alone is enough on most renders; the full scan runs only when it is gone.
    if (!isActiveToolUsable(root, state)) {
        const first = availableTools(root, state).find(tool => state.inScope.has(state.keyByManaged.get(tool) ?? ''));
        if (setActiveKey(state, first ? state.keyByManaged.get(first)! : null)) return;
    }
    if (scopeChanged) notifyListeners(state);
};

const forgetManaged = (state: ToolbarTabStopState, element: HTMLElement): void => {
    state.keyByManaged.delete(element);
    state.resizeObserver?.unobserve(element);
};

/** Forgets tools that unregistered and did not register again. */
export const dropPendingRemovals = (state: ToolbarTabStopState): void => {
    for (const key of state.pendingRemoval) {
        const element = state.managedByKey.get(key);
        if (element) forgetManaged(state, element);
        state.managedByKey.delete(key);
    }
    state.pendingRemoval.clear();
};

/** Registers a tool element for a key. Returns true when the toolbar should reconcile soon. */
export const registerManagedTool = (state: ToolbarTabStopState, key: string, element: HTMLElement): boolean => {
    const previous = state.managedByKey.get(key);
    if (previous === element && state.pendingRemoval.delete(key)) return false;
    state.pendingRemoval.delete(key);
    if (previous === element) return false;
    if (previous) forgetManaged(state, previous);
    state.managedByKey.set(key, element);
    state.keyByManaged.set(element, key);
    state.resizeObserver?.observe(element);
    return true;
};

/** Marks a key's tool for removal; a re-attach of the same element before the check costs nothing. */
export const markForRemoval = (state: ToolbarTabStopState, key: string): void => {
    if (state.managedByKey.has(key)) state.pendingRemoval.add(key);
};
