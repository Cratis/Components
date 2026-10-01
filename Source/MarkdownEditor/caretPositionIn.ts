// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CaretPosition } from './CaretPosition';

const copiedStyles = [
    'boxSizing',
    'width',
    'height',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'borderStyle',
    'fontFamily',
    'fontSize',
    'fontStyle',
    'fontWeight',
    'fontVariant',
    'letterSpacing',
    'lineHeight',
    'textTransform',
    'textIndent',
    'tabSize',
    'wordSpacing',
] as const;

/**
 * Measures where the caret of a textarea is on screen.
 *
 * A textarea exposes no caret coordinates, and counting lines fails on wrapped lines, proportional
 * fonts and scrolling. So an invisible element takes the textarea's typography and box, holds the
 * text up to the caret, and a zero-width marker after it is measured instead.
 * @param textarea The textarea to measure in.
 * @param caret The caret position within its value.
 * @returns The caret's {@link CaretPosition}.
 */
export const caretPositionIn = (textarea: HTMLTextAreaElement, caret: number): CaretPosition => {
    const computed = window.getComputedStyle(textarea);
    const bounds = textarea.getBoundingClientRect();
    const mirror = document.createElement('div');
    const marker = document.createElement('span');

    for (const property of copiedStyles) {
        mirror.style[property] = computed[property];
    }
    mirror.style.position = 'fixed';
    mirror.style.visibility = 'hidden';
    mirror.style.pointerEvents = 'none';
    mirror.style.overflow = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.overflowWrap = 'break-word';
    mirror.style.left = `${bounds.left}px`;
    mirror.style.top = `${bounds.top}px`;

    mirror.textContent = textarea.value.slice(0, caret);
    marker.textContent = '\u200b';
    mirror.append(marker);
    document.body.append(mirror);
    mirror.scrollTop = textarea.scrollTop;
    mirror.scrollLeft = textarea.scrollLeft;

    const markerBounds = marker.getBoundingClientRect();
    mirror.remove();

    return { left: markerBounds.left, top: markerBounds.top, bottom: markerBounds.bottom };
};
