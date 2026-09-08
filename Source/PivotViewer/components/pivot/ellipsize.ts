// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Measures how wide `candidate` renders, in the same units as the budget it is compared against. */
export type MeasureText = (candidate: string) => number;

/** The character appended to text that had to be cut short. */
export const ellipsis = '…';

/**
 * Shortens one line to the longest prefix that still fits `maxWidth`, marking the cut with an
 * ellipsis. Text that already fits is returned unchanged.
 *
 * Card text is drawn to a canvas with word wrapping off, so anything wider than the card simply
 * kept painting past its edge and over the card beside it. Measuring is the only way to know
 * where to cut — a glyph's width depends on the font, so counting characters cannot tell you.
 *
 * The search is binary rather than a character-at-a-time walk: measuring is the expensive part,
 * and this runs for every visible card.
 *
 * @param text The line to fit.
 * @param maxWidth The width budget. A budget of zero or less leaves the text untouched, since
 * there is no room to render anything meaningful and a bare ellipsis says less than a clipped word.
 * @param measure Measures a candidate string.
 * @returns The text, shortened and suffixed with an ellipsis only if it did not fit.
 */
export function ellipsizeLine(text: string, maxWidth: number, measure: MeasureText): string {
    if (maxWidth <= 0 || text.length === 0) return text;
    if (measure(text) <= maxWidth) return text;

    let fits = 0;
    let tooWide = text.length;
    while (fits < tooWide) {
        const middle = Math.ceil((fits + tooWide) / 2);
        if (measure(text.slice(0, middle) + ellipsis) <= maxWidth) {
            fits = middle;
        } else {
            tooWide = middle - 1;
        }
    }

    return text.slice(0, fits) + ellipsis;
}

/**
 * Applies {@link ellipsizeLine} to every line of a block of text, so a multi-line value column
 * is fitted line by line rather than as one string.
 *
 * @param text The block to fit, newline separated.
 * @param maxWidth The width budget for a single line.
 * @param measure Measures a candidate string.
 * @returns The block, with each line shortened only if it did not fit.
 */
export function ellipsizeBlock(text: string, maxWidth: number, measure: MeasureText): string {
    if (!text.includes('\n')) return ellipsizeLine(text, maxWidth, measure);
    return text
        .split('\n')
        .map(line => ellipsizeLine(line, maxWidth, measure))
        .join('\n');
}
