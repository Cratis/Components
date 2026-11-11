// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { KeyboardEvent } from 'react';
import { ToolbarFocusMode } from './ToolbarFocusMode';

export const toolSelector = 'button, a[href], input, select, textarea, [tabindex]';
const widgetSelector = 'input:not([type="button"]):not([type="submit"]):not([type="reset"]), textarea, select, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="spinbutton"], [role="textbox"], [role="combobox"], [role="listbox"], [role="menu"], [role="menubar"], [role="tree"], [role="grid"], [role="application"]';
const toolbarSelector = '[role="toolbar"]';
const disabledSelector = ':disabled, [disabled], [aria-disabled="true"]';

/** Whether the element belongs to this toolbar's own DOM scope, not a portal or a nested toolbar. */
export const isInToolbarScope = (root: HTMLElement | null, tool: Element): boolean =>
    !!root && tool !== root && root.contains(tool) && tool.closest(toolbarSelector) === root;

export const isDisabledTool = (tool: HTMLElement): boolean => tool.matches(disabledSelector);

const hasHiddenAttribute = (element: HTMLElement): boolean =>
    element.hidden || element.hasAttribute('inert') || element.getAttribute('aria-hidden') === 'true';

const hasHiddenStyle = (element: HTMLElement): boolean => {
    const { display, visibility } = getComputedStyle(element);
    return display === 'none' || visibility === 'hidden' || visibility === 'collapse';
};

const isHiddenElement = (element: HTMLElement): boolean => hasHiddenAttribute(element) || hasHiddenStyle(element);

/** Whether the tool or any ancestor below the toolbar root is hidden from users. */
export const isHiddenInside = (tool: HTMLElement, root: HTMLElement): boolean => {
    for (let element: HTMLElement | null = tool; element && element !== root; element = element.parentElement) {
        if (isHiddenElement(element)) return true;
    }
    return false;
};

const isInsideWidget = (target: Element, root: HTMLElement): boolean => {
    for (let element: Element | null = target; element && element !== root; element = element.parentElement) {
        if (element.matches(widgetSelector)) return true;
    }
    return false;
};

// React events from a portal may bubble here without a DOM ancestor relationship.
const isOwnedTarget = (root: HTMLElement, target: EventTarget): target is Element =>
    target instanceof Element && root.contains(target) && target.closest(toolbarSelector) === root;

const isOwnTool = (root: HTMLElement, tool: HTMLElement | null): tool is HTMLElement =>
    !!tool && tool !== root && tool.closest(toolbarSelector) === root;

/** Resolves the tool a key press happened on, or null when the toolbar must not handle it. */
export const resolveKeyTool = (root: HTMLElement | null, target: EventTarget): HTMLElement | null => {
    if (!root || !isOwnedTarget(root, target) || isInsideWidget(target, root)) return null;
    const current = target.closest<HTMLElement>(toolSelector);
    return isOwnTool(root, current) ? current : null;
};

export const resolveDirection = (root: HTMLElement): string => {
    const directionElement = root.closest<HTMLElement>('[dir]');
    return getComputedStyle(root).direction || directionElement?.dir || 'ltr';
};

const hasModifier = (event: KeyboardEvent): boolean => event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;

const isHandled = (event: KeyboardEvent): boolean => event.defaultPrevented || event.isPropagationStopped();

export const shouldIgnoreKey = (event: KeyboardEvent, focusMode: ToolbarFocusMode): boolean =>
    focusMode === ToolbarFocusMode.None || isHandled(event) || hasModifier(event) || event.nativeEvent.isComposing;
