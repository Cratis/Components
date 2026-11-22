// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { LINE_HEIGHT_RATIO, MAX_FONT_SIZE, MIN_FONT_SIZE, PADDING } from './textMetrics';

function textFitsAtSize(measurer: HTMLDivElement, text: string, fontSize: number, availableWidth: number, availableHeight: number): boolean {
    measurer.style.width = `${availableWidth}px`;
    measurer.style.fontSize = `${fontSize}px`;
    measurer.style.lineHeight = `${LINE_HEIGHT_RATIO}`;
    measurer.textContent = text;
    return measurer.scrollHeight <= availableHeight;
}

export function findOptimalFontSize(measurer: HTMLDivElement, text: string, width: number, height: number) {
    if (!(text ?? '').trim())
        return { fontSize: Math.min(MAX_FONT_SIZE, Math.min(width, height) * 0.4), overflows: false };

    const availableWidth = width - PADDING * 2;
    const availableHeight = height - PADDING * 2;
    let low = MIN_FONT_SIZE;
    let high = MAX_FONT_SIZE;

    // Quick check: if the readability floor doesn't fit, stop shrinking and flag the overflow instead.
    if (!textFitsAtSize(measurer, text, low, availableWidth, availableHeight)) {
        return { fontSize: MIN_FONT_SIZE, overflows: true };
    }

    // Binary search for the largest fitting font size.
    while (high - low > 0.5) {
        const mid = (low + high) / 2;
        if (textFitsAtSize(measurer, text, mid, availableWidth, availableHeight)) low = mid;
        else high = mid;
    }
    return { fontSize: Math.floor(low), overflows: false };
}
