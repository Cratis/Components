// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useLayoutEffect, useRef, type KeyboardEvent, type FocusEvent } from 'react';
import { ToolbarFocusMode } from './ToolbarFocusMode';

const toolSelector = 'button, a[href], input, select, textarea, [tabindex]';
const widgetSelector = 'input:not([type="button"]):not([type="submit"]):not([type="reset"]), textarea, select, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="spinbutton"], [role="textbox"], [role="combobox"], [role="listbox"], [role="menu"], [role="menubar"], [role="tree"], [role="grid"], [role="application"]';

type Orientation = 'horizontal' | 'vertical';

const isWidget = (tool: HTMLElement, root: HTMLElement) => {
    for (let element: HTMLElement | null = tool; element && element !== root; element = element.parentElement) {
        if (element.matches(widgetSelector)) return true;
    }
    return false;
};

/** Components-owned toolbar focus behavior; never captures keys from child widgets. */
export const useToolbarKeyboardNavigation = (orientation: Orientation, focusMode: ToolbarFocusMode) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const lastFocusedRef = useRef<HTMLElement | null>(null);
    const tabIndicesRef = useRef(new Map<HTMLElement, { original: string | null; written: string }>());

    const syncTabIndices = useCallback(() => {
        for (const [tool, value] of tabIndicesRef.current) {
            const current = tool.getAttribute('tabindex');
            if (current !== value.written) value.original = current;
        }
    }, []);

    const tools = useCallback(() => {
        syncTabIndices();
        const root = rootRef.current;
        if (!root) return [];
        return Array.from(root.querySelectorAll<HTMLElement>(toolSelector)).filter(tool => {
            if (tool.closest('[role="toolbar"]') !== root || tool.matches(':disabled, [disabled], [aria-disabled="true"]')) return false;
            const value = tabIndicesRef.current.get(tool);
            const original = value ? value.original : tool.getAttribute('tabindex');
            if (original === '-1') return false;
            for (let element: HTMLElement | null = tool; element && element !== root; element = element.parentElement) {
                if (element.hidden || element.hasAttribute('inert') || element.getAttribute('aria-hidden') === 'true') return false;
                const style = getComputedStyle(element);
                if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
            }
            return true;
        });
    }, [syncTabIndices]);

    const updateTabStops = useCallback(() => {
        if (focusMode !== ToolbarFocusMode.SingleTabStop) return;
        const root = rootRef.current;
        if (!root) return;
        const available = tools().filter(tool => !isWidget(tool, root));
        const selected = lastFocusedRef.current && available.includes(lastFocusedRef.current)
            ? lastFocusedRef.current : available[0];
        lastFocusedRef.current = selected ?? null;
        for (const tool of available) {
            const tabIndex = tool === selected ? '0' : '-1';
            const value = tabIndicesRef.current.get(tool);
            if (value) value.written = tabIndex;
            else tabIndicesRef.current.set(tool, { original: tool.getAttribute('tabindex'), written: tabIndex });
            if (tool.getAttribute('tabindex') !== tabIndex) tool.setAttribute('tabindex', tabIndex);
        }
        // Unavailable tools (including aria-disabled buttons) must not add another
        // native Tab stop. Widgets instead keep their own native Tab behavior.
        const excluded = Array.from(root.querySelectorAll<HTMLElement>(toolSelector)).filter(tool =>
            tool.closest('[role="toolbar"]') === root && !isWidget(tool, root) && !available.includes(tool));
        for (const tool of excluded) {
            const value = tabIndicesRef.current.get(tool);
            if (value) value.written = '-1';
            else {
                if (tool.getAttribute('tabindex') === '-1') continue;
                tabIndicesRef.current.set(tool, { original: tool.getAttribute('tabindex'), written: '-1' });
            }
            if (tool.getAttribute('tabindex') !== '-1') tool.setAttribute('tabindex', '-1');
        }
        for (const [tool, value] of tabIndicesRef.current) {
            if (available.includes(tool) || excluded.includes(tool)) continue;
            if (value.original === null) tool.removeAttribute('tabindex');
            else tool.setAttribute('tabindex', value.original);
            tabIndicesRef.current.delete(tool);
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
            syncTabIndices();
            for (const [tool, value] of tabIndicesRef.current) {
                if (value.original === null) tool.removeAttribute('tabindex');
                else tool.setAttribute('tabindex', value.original);
            }
            tabIndicesRef.current.clear();
        };
    }, [focusMode, updateTabStops, syncTabIndices]);

    const onFocus = (event: FocusEvent<HTMLDivElement>) => {
        if (focusMode !== ToolbarFocusMode.SingleTabStop) return;
        const root = rootRef.current;
        const target = event.target;
        if (!root?.contains(target) || target.closest('[role="toolbar"]') !== root) return;
        const tool = target.closest<HTMLElement>(toolSelector);
        if (tool && !isWidget(tool, root) && tools().includes(tool)) {
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
            target.closest('[role="toolbar"]') !== root) return;
        for (let element: Element | null = target; element && element !== root; element = element.parentElement) {
            if (element.matches(widgetSelector)) return;
        }
        const available = focusMode === ToolbarFocusMode.SingleTabStop
            ? tools().filter(tool => !isWidget(tool, root)) : tools();
        const current = target.closest<HTMLElement>(toolSelector);
        if (!current || current === root || current.closest('[role="toolbar"]') !== root) return;
        const index = available.indexOf(current);

        const directionElement = root.closest<HTMLElement>('[dir]');
        const direction = getComputedStyle(root).direction || directionElement?.dir || 'ltr';
        const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
        const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
        let next: HTMLElement | undefined;
        if (event.key === 'Home') next = available[0];
        else if (event.key === 'End') next = available[available.length - 1];
        else if (event.key === (orientation === 'vertical' ? 'ArrowDown' : forward)) next = index >= 0
            ? available[index + 1]
            : available.find(tool => !!(current.compareDocumentPosition(tool) & Node.DOCUMENT_POSITION_FOLLOWING));
        else if (event.key === (orientation === 'vertical' ? 'ArrowUp' : backward)) next = index >= 0
            ? available[index - 1]
            : available.slice().reverse().find(tool => !!(current.compareDocumentPosition(tool) & Node.DOCUMENT_POSITION_PRECEDING));
        if (!next || next === current) return;
        event.preventDefault();
        next.focus();
    };

    return { rootRef, onFocus, onKeyDown };
};
