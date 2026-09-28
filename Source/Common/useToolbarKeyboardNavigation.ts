// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useLayoutEffect, useRef, type KeyboardEvent, type FocusEvent } from 'react';
import { ToolbarFocusMode } from './ToolbarFocusMode';

const toolSelector = 'button, a[href], input, select, textarea, [tabindex]';
const widgetSelector = 'input:not([type="button"]):not([type="submit"]):not([type="reset"]), textarea, select, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="spinbutton"], [role="textbox"], [role="combobox"], [role="listbox"], [role="menu"], [role="menubar"], [role="tree"], [role="grid"], [role="application"]';

type Orientation = 'horizontal' | 'vertical';

/** Components-owned toolbar focus behavior; never captures keys from child widgets. */
export const useToolbarKeyboardNavigation = (orientation: Orientation, focusMode: ToolbarFocusMode) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const lastFocusedRef = useRef<HTMLElement | null>(null);
    const originalTabIndicesRef = useRef(new Map<HTMLElement, string | null>());

    const tools = useCallback(() => {
        const root = rootRef.current;
        if (!root) return [];
        return Array.from(root.querySelectorAll<HTMLElement>(toolSelector)).filter(tool => {
            if (tool.closest('[role="toolbar"]') !== root || tool.matches(':disabled, [disabled], [aria-disabled="true"]')) return false;
            const original = originalTabIndicesRef.current.has(tool)
                ? originalTabIndicesRef.current.get(tool) : tool.getAttribute('tabindex');
            if (original === '-1') return false;
            for (let element: HTMLElement | null = tool; element && element !== root; element = element.parentElement) {
                if (element.hidden || element.hasAttribute('inert') || element.getAttribute('aria-hidden') === 'true') return false;
                const style = getComputedStyle(element);
                if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
            }
            return true;
        });
    }, []);

    const updateTabStops = useCallback(() => {
        if (focusMode !== ToolbarFocusMode.SingleTabStop) return;
        const available = tools();
        const selected = lastFocusedRef.current && available.includes(lastFocusedRef.current)
            ? lastFocusedRef.current : available[0];
        lastFocusedRef.current = selected ?? null;
        for (const tool of available) {
            if (!originalTabIndicesRef.current.has(tool)) originalTabIndicesRef.current.set(tool, tool.getAttribute('tabindex'));
            const tabIndex = tool === selected ? '0' : '-1';
            if (tool.getAttribute('tabindex') !== tabIndex) tool.setAttribute('tabindex', tabIndex);
        }
        for (const [tool, original] of originalTabIndicesRef.current) {
            if (available.includes(tool)) continue;
            if (rootRef.current?.contains(tool)) {
                if (original === null) tool.removeAttribute('tabindex');
                else tool.setAttribute('tabindex', original);
            }
            originalTabIndicesRef.current.delete(tool);
        }
    }, [focusMode, tools]);

    // Reconcile after every React commit (including a changed child tree), and after
    // DOM changes made without a React render, such as hiding a tool or removing it.
    useLayoutEffect(() => { updateTabStops(); });
    useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root || focusMode !== ToolbarFocusMode.SingleTabStop) return;
        const observer = new MutationObserver(updateTabStops);
        observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'inert', 'aria-hidden', 'aria-disabled', 'disabled', 'style', 'class'] });
        return () => {
            observer.disconnect();
            for (const [tool, original] of originalTabIndicesRef.current) {
                if (original === null) tool.removeAttribute('tabindex');
                else tool.setAttribute('tabindex', original);
            }
            originalTabIndicesRef.current.clear();
        };
    }, [focusMode, updateTabStops]);

    const onFocus = (event: FocusEvent<HTMLDivElement>) => {
        if (focusMode !== ToolbarFocusMode.SingleTabStop) return;
        const root = rootRef.current;
        const target = event.target;
        if (!root?.contains(target) || target.closest('[role="toolbar"]') !== root) return;
        const tool = target.closest<HTMLElement>(toolSelector);
        if (tool && tools().includes(tool)) {
            lastFocusedRef.current = tool;
            updateTabStops();
        }
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (focusMode === ToolbarFocusMode.None || event.defaultPrevented || event.isPropagationStopped() ||
            event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.nativeEvent.isComposing) return;
        const root = rootRef.current;
        const target = event.target;
        // React events from a portal may bubble here without a DOM ancestor relationship.
        if (!(target instanceof Element) || !root?.contains(target) ||
            target.closest('[role="toolbar"]') !== root || target.closest(widgetSelector)) return;
        const available = tools();
        const current = target.closest<HTMLElement>(toolSelector);
        const index = current ? available.indexOf(current) : -1;
        if (index < 0) return;

        const directionElement = root.closest<HTMLElement>('[dir]');
        const direction = getComputedStyle(root).direction || directionElement?.dir || 'ltr';
        const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
        const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
        let next: HTMLElement | undefined;
        if (event.key === 'Home') next = available[0];
        else if (event.key === 'End') next = available[available.length - 1];
        else if (event.key === (orientation === 'vertical' ? 'ArrowDown' : forward)) next = available[index + 1];
        else if (event.key === (orientation === 'vertical' ? 'ArrowUp' : backward)) next = available[index - 1];
        if (!next || next === current) return;
        event.preventDefault();
        next.focus();
    };

    return { rootRef, onFocus, onKeyDown };
};
