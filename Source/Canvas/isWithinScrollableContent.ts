// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** The subset of an element's overflow CSS and scroll metrics needed to decide whether it can scroll. */
export interface ScrollableMetrics {
    overflowX: string;
    overflowY: string;
    scrollWidth: number;
    clientWidth: number;
    scrollHeight: number;
    clientHeight: number;
}

/**
 * Whether an element's own content actually overflows its box in a direction its CSS lets it scroll —
 * the two conditions both have to hold: the CSS opts into scrolling, and there is more content than the
 * box shows. Pulled out of {@link isWithinScrollableContent} so this decision is testable on plain data,
 * without a real DOM (the surrounding walk needs one; this predicate does not).
 */
export function hasScrollableOverflow(metrics: ScrollableMetrics): boolean {
    const canScrollY = (metrics.overflowY === 'auto' || metrics.overflowY === 'scroll') && metrics.scrollHeight > metrics.clientHeight;
    const canScrollX = (metrics.overflowX === 'auto' || metrics.overflowX === 'scroll') && metrics.scrollWidth > metrics.clientWidth;
    return canScrollY || canScrollX;
}

// A wheel/trackpad gesture that lands inside a scrollable overlay — a chat's message list, a properties
// panel, anything with its own `overflow-y: auto` — must scroll that content natively instead of being
// captured as a canvas pan. Walking up from the event target toward the canvas container, the first
// ancestor whose own content actually overflows its box claims the gesture; the
// search stops at the container itself, so gestures over the bare board are never affected.
export function isWithinScrollableContent(target: EventTarget | null, container: HTMLElement | null): boolean {
    let element = target instanceof Node ? (target instanceof HTMLElement ? target : target.parentElement) : null;

    while (element && element !== container) {
        const style = getComputedStyle(element);
        if (hasScrollableOverflow({
            overflowX: style.overflowX,
            overflowY: style.overflowY,
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth,
            scrollHeight: element.scrollHeight,
            clientHeight: element.clientHeight,
        })) return true;
        element = element.parentElement;
    }

    return false;
}
