// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Resolves an element's effective z-index in jsdom, which neither substitutes custom properties nor
 * evaluates `calc()` for us.
 *
 * Dialog tiers resolve to expressions relative to `--cratis-z-index-dialog` rather than to plain
 * numbers, so that an application overriding that token keeps its dialogs - and every popover they
 * host - in its own stacking order. A spec comparing two tiers therefore has to substitute the token
 * and fold the arithmetic itself.
 *
 * The generated expressions only ever add, so summing the integer terms is a faithful evaluation of
 * them; this is deliberately not a general `calc()` implementation.
 */
export const resolveZIndex = (element: HTMLElement): number => {
    const declaration = element.style.zIndex || getComputedStyle(element).zIndex;
    const substituted = declaration.replace(/var\((--[^)]+)\)/gu, (_, name: string) =>
        getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    );
    const terms = substituted.match(/-?\d+/gu);
    if (terms === null) return Number.NaN;
    return terms.reduce((total, term) => total + Number.parseInt(term, 10), 0);
};
