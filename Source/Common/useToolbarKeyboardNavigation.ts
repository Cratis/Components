// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
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
    const [activeKey, setActiveKey] = useState<string | null>(null);

    const tools = useCallback(() => {
        const root = rootRef.current;
        if (!root) return [];
        return Array.from(root.querySelectorAll<HTMLElement>(toolSelector)).filter(tool => {
            if (tool.closest('[role="toolbar"]') !== root || tool.matches(':disabled, [disabled], [aria-disabled="true"]')) return false;
            if (tool.getAttribute('tabindex') === '-1' && !keyByManaged.current.has(tool)) return false;
            for (let element: HTMLElement | null = tool; element && element !== root; element = element.parentElement) {
                if (element.hidden || element.hasAttribute('inert') || element.getAttribute('aria-hidden') === 'true') return false;
                const style = getComputedStyle(element);
                if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
            }
            return true;
        });
    }, []);

    // Keep the active tool available: when it is removed, disabled, or hidden, the first available
    // tool the toolbar owns becomes the single Tab stop. This only changes React state.
    const reconcile = useCallback(() => {
        if (!singleTabStop) return;
        const available = tools();
        setActiveKey(current => {
            const element = current === null ? undefined : managedByKey.current.get(current);
            if (element && available.includes(element)) return current;
            const first = available.find(tool => keyByManaged.current.has(tool));
            return first ? keyByManaged.current.get(first)! : null;
        });
    }, [singleTabStop, tools]);

    useLayoutEffect(reconcile);
    useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root || !singleTabStop) return;
        const observer = new MutationObserver(reconcile);
        observer.observe(root, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['hidden', 'inert', 'aria-hidden', 'aria-disabled', 'disabled', 'style', 'class'],
        });
        return () => observer.disconnect();
    }, [singleTabStop, reconcile]);

    const roving = useMemo<ToolbarRoving | null>(() => singleTabStop ? {
        tabIndexFor: key => activeKey === null ? undefined : key === activeKey ? 0 : -1,
        register: (key, element) => {
            const previous = managedByKey.current.get(key);
            if (previous) keyByManaged.current.delete(previous);
            if (element) {
                managedByKey.current.set(key, element);
                keyByManaged.current.set(element, key);
            } else {
                managedByKey.current.delete(key);
            }
        },
        activate: key => setActiveKey(key),
    } : null, [singleTabStop, activeKey]);

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
