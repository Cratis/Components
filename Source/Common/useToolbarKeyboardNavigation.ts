// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useLayoutEffect, useMemo, useRef, type KeyboardEvent } from 'react';
import { ToolbarFocusMode } from './ToolbarFocusMode';
import type { ToolbarRoving } from './ToolbarRovingContext';

const toolSelector = 'button, a[href], input, select, textarea, [tabindex]';
const widgetSelector = 'input:not([type="button"]):not([type="submit"]):not([type="reset"]), textarea, select, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="spinbutton"], [role="textbox"], [role="combobox"], [role="listbox"], [role="menu"], [role="menubar"], [role="tree"], [role="grid"], [role="application"]';

type Orientation = 'horizontal' | 'vertical';

/** Components-owned toolbar focus behavior; never captures keys from child widgets. */
export const useToolbarKeyboardNavigation = (orientation: Orientation, focusMode: ToolbarFocusMode) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const singleTabStop = focusMode === ToolbarFocusMode.SingleTabStop;
    // Tools the toolbar owns in single-Tab-stop mode. Their -1 tab index comes from this toolbar,
    // so it does not make them unreachable by arrow keys.
    const managedByKey = useRef(new Map<string, HTMLElement>());
    const keyByManaged = useRef(new Map<HTMLElement, string>());
    const activeKeyRef = useRef<string | null>(null);
    const listeners = useRef(new Set<() => void>());

    // Keys of managed tools that lie in this toolbar's own DOM scope. A tool rendered through a
    // portal or under a nested consumer toolbar can never be reached from here, so it keeps its
    // native Tab stop instead of a -1 the toolbar could never lift.
    const inScopeRef = useRef(new Set<string>());
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    const isInToolbarScope = useCallback((tool: Element) => {
        const root = rootRef.current;
        return !!root && tool !== root && root.contains(tool) && tool.closest('[role="toolbar"]') === root;
    }, []);

    const isAvailable = useCallback((tool: HTMLElement) => {
        const root = rootRef.current;
        if (!root || !isInToolbarScope(tool) || tool.matches(':disabled, [disabled], [aria-disabled="true"]')) return false;
        if (tool.getAttribute('tabindex') === '-1' && !keyByManaged.current.has(tool)) return false;
        for (let element: HTMLElement | null = tool; element && element !== root; element = element.parentElement) {
            if (element.hidden || element.hasAttribute('inert') || element.getAttribute('aria-hidden') === 'true') return false;
            const style = getComputedStyle(element);
            if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
        }
        return true;
    }, [isInToolbarScope]);

    const tools = useCallback(() => {
        const root = rootRef.current;
        if (!root) return [];
        return Array.from(root.querySelectorAll<HTMLElement>(toolSelector)).filter(isAvailable);
    }, [isAvailable]);

    const notify = useCallback(() => listeners.current.forEach(listener => listener()), []);

    const setActiveKey = useCallback((key: string | null) => {
        if (activeKeyRef.current === key) return false;
        activeKeyRef.current = key;
        notify();
        return true;
    }, [notify]);

    // Keep the active tool available: when it is removed, disabled, hidden, moved out of scope, or
    // opts out with its own tab index, the first available tool the toolbar owns becomes the single
    // Tab stop. This only changes the toolbar's own state; tools render their tab index from it.
    const reconcile = useCallback(() => {
        if (!singleTabStop) return;
        let scopeChanged = false;
        for (const key of inScopeRef.current) {
            if (!managedByKey.current.has(key)) inScopeRef.current.delete(key);
        }
        for (const [key, element] of managedByKey.current) {
            const inside = isInToolbarScope(element);
            if (inside === inScopeRef.current.has(key)) continue;
            if (inside) inScopeRef.current.add(key);
            else inScopeRef.current.delete(key);
            scopeChanged = true;
        }
        const current = activeKeyRef.current;
        const element = current === null ? undefined : managedByKey.current.get(current);
        // Checking the active tool alone is enough on most renders; the full scan runs only when it is gone.
        if (!(element && inScopeRef.current.has(current!) && isAvailable(element))) {
            const first = tools().find(tool => inScopeRef.current.has(keyByManaged.current.get(tool) ?? ''));
            if (setActiveKey(first ? keyByManaged.current.get(first)! : null)) return;
        }
        if (scopeChanged) notify();
    }, [singleTabStop, isInToolbarScope, isAvailable, tools, setActiveKey, notify]);

    // Several registrations and mutations in one commit or frame need only one check.
    const reconcileScheduled = useRef(false);
    const scheduleReconcile = useCallback(() => {
        if (reconcileScheduled.current) return;
        reconcileScheduled.current = true;
        queueMicrotask(() => {
            reconcileScheduled.current = false;
            reconcile();
        });
    }, [reconcile]);

    // Tools that unregistered and did not register again: forget them, and choose a new Tab stop
    // if one of them was active (unmounted, or given its own tab index).
    const pendingRemovalRef = useRef(new Set<string>());
    const removalCheckScheduledRef = useRef(false);
    const scheduleRemovalCheck = useCallback(() => {
        if (removalCheckScheduledRef.current) return;
        removalCheckScheduledRef.current = true;
        queueMicrotask(() => {
            removalCheckScheduledRef.current = false;
            if (pendingRemovalRef.current.size === 0) return;
            for (const key of pendingRemovalRef.current) {
                const element = managedByKey.current.get(key);
                if (element) {
                    keyByManaged.current.delete(element);
                    resizeObserverRef.current?.unobserve(element);
                }
                managedByKey.current.delete(key);
            }
            pendingRemovalRef.current.clear();
            reconcile();
        });
    }, [reconcile]);

    useLayoutEffect(reconcile);
    useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root || !singleTabStop) return;
        // Only changes on a managed tool or one of its ancestors can make it unavailable.
        const affectsManagedTool = (record: MutationRecord) => {
            if (record.type === 'childList') return true;
            for (const tool of keyByManaged.current.keys()) {
                if (record.target === tool || record.target.contains(tool)) return true;
            }
            return false;
        };
        const observer = new MutationObserver(records => {
            if (records.some(affectsManagedTool)) scheduleReconcile();
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
            resizeObserverRef.current = new ResizeObserver(scheduleReconcile);
            managedByKey.current.forEach(tool => resizeObserverRef.current!.observe(tool));
        }
        return () => {
            observer.disconnect();
            resizeObserverRef.current?.disconnect();
            resizeObserverRef.current = null;
        };
    }, [singleTabStop, scheduleReconcile]);

    const roving = useMemo<ToolbarRoving | null>(() => singleTabStop ? {
        getActiveKey: () => activeKeyRef.current,
        isInScope: key => inScopeRef.current.has(key),
        subscribe: listener => {
            listeners.current.add(listener);
            return () => listeners.current.delete(listener);
        },
        register: (key, element) => {
            const previous = managedByKey.current.get(key);
            if (!element) {
                // A tooltip wrapper builds a new merged ref on every render, so React detaches and
                // re-attaches the same element within one commit. Removal waits for a microtask,
                // and a re-attach of the same element in between costs nothing.
                if (previous) pendingRemovalRef.current.add(key);
                scheduleRemovalCheck();
                return;
            }
            if (previous === element && pendingRemovalRef.current.delete(key)) return;
            pendingRemovalRef.current.delete(key);
            if (previous === element) return;
            if (previous) {
                keyByManaged.current.delete(previous);
                resizeObserverRef.current?.unobserve(previous);
            }
            managedByKey.current.set(key, element);
            keyByManaged.current.set(element, key);
            resizeObserverRef.current?.observe(element);
            // A new tool may be the first available one or lie out of scope.
            scheduleReconcile();
        },
        // A tool outside the toolbar's scope cannot hold its single Tab stop.
        activate: key => {
            if (inScopeRef.current.has(key)) setActiveKey(key);
        },
    } : null, [singleTabStop, scheduleReconcile, scheduleRemovalCheck, setActiveKey]);

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (focusMode === ToolbarFocusMode.None || event.defaultPrevented || event.isPropagationStopped() ||
            event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.nativeEvent.isComposing) return;
        const root = rootRef.current;
        const target = event.target;
        // React events from a portal may bubble here without a DOM ancestor relationship.
        if (!(target instanceof Element) || !root?.contains(target) ||
            target.closest('[role="toolbar"]') !== root) return;
        for (let element: Element | null = target; element && element !== root; element = element.parentElement) {
            if (element.matches(widgetSelector)) return;
        }
        const available = tools();
        const current = target.closest<HTMLElement>(toolSelector);
        if (!current || current === root || current.closest('[role="toolbar"]') !== root) return;
        const index = available.indexOf(current);

        const directionElement = root.closest<HTMLElement>('[dir]');
        const direction = getComputedStyle(root).direction || directionElement?.dir || 'ltr';
        const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
        const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
        let candidates: HTMLElement[] = [];
        if (event.key === 'Home') candidates = available;
        else if (event.key === 'End') candidates = available.slice().reverse();
        else if (event.key === (orientation === 'vertical' ? 'ArrowDown' : forward)) candidates = index >= 0
            ? available.slice(index + 1)
            : available.filter(tool => !!(current.compareDocumentPosition(tool) & Node.DOCUMENT_POSITION_FOLLOWING));
        else if (event.key === (orientation === 'vertical' ? 'ArrowUp' : backward)) candidates = index >= 0
            ? available.slice(0, index).reverse()
            : available.slice().reverse().filter(tool => !!(current.compareDocumentPosition(tool) & Node.DOCUMENT_POSITION_PRECEDING));
        for (const candidate of candidates) {
            if (candidate === current) return;
            candidate.focus();
            if ((candidate.getRootNode() as Document | ShadowRoot).activeElement === candidate || candidate.matches(':focus')) {
                event.preventDefault();
                return;
            }
        }
    };

    return { rootRef, onKeyDown, roving };
};
