// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

type Orientation = 'horizontal' | 'vertical';

const stepKeys = (orientation: Orientation, direction: string) => {
    if (orientation === 'vertical') return { next: 'ArrowDown', previous: 'ArrowUp' };
    return direction === 'rtl' ? { next: 'ArrowLeft', previous: 'ArrowRight' } : { next: 'ArrowRight', previous: 'ArrowLeft' };
};

const isPositioned = (current: HTMLElement, tool: HTMLElement, position: number): boolean =>
    !!(current.compareDocumentPosition(tool) & position);

const toolsAfter = (available: HTMLElement[], current: HTMLElement): HTMLElement[] => {
    const index = available.indexOf(current);
    return index >= 0
        ? available.slice(index + 1)
        : available.filter(tool => isPositioned(current, tool, Node.DOCUMENT_POSITION_FOLLOWING));
};

const toolsBefore = (available: HTMLElement[], current: HTMLElement): HTMLElement[] => {
    const index = available.indexOf(current);
    return index >= 0
        ? available.slice(0, index).reverse()
        : available.slice().reverse().filter(tool => isPositioned(current, tool, Node.DOCUMENT_POSITION_PRECEDING));
};

/** The tools to try focusing for a key, in the order they are tried. */
export const candidatesFor = (key: string, orientation: Orientation, direction: string, available: HTMLElement[], current: HTMLElement): HTMLElement[] => {
    const { next, previous } = stepKeys(orientation, direction);
    if (key === 'Home') return available;
    if (key === 'End') return available.slice().reverse();
    if (key === next) return toolsAfter(available, current);
    if (key === previous) return toolsBefore(available, current);
    return [];
};

const holdsFocus = (candidate: HTMLElement): boolean =>
    (candidate.getRootNode() as Document | ShadowRoot).activeElement === candidate || candidate.matches(':focus');

/** Focuses the first candidate that accepts focus; false when none did or the walk reached the current tool. */
export const focusFirstFocusable = (candidates: HTMLElement[], current: HTMLElement): boolean => {
    for (const candidate of candidates) {
        if (candidate === current) return false;
        candidate.focus();
        if (holdsFocus(candidate)) return true;
    }
    return false;
};
