// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { commands, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { mountGallery, unmountGallery } from './gallery';

afterEach(unmountGallery);

const transparent = /^rgba\(\d+, \d+, \d+, 0\)$|^transparent$/u;

const hasVisibleBorder = (element: Element) => {
    const style = getComputedStyle(element);
    return style.borderTopStyle !== 'none' && Number.parseFloat(style.borderTopWidth) >= 1 && !transparent.test(style.borderTopColor);
};

/**
 * Designsystemet buttons opt out of forced-color adjustment and paint their own opaque fill, so a
 * control is distinguishable when it has a visible border or an opaque background. Text-only
 * tertiary buttons (the Ghost and Link variants) are exempt: they read as text, not as a box.
 */
const isDistinguishable = (element: Element) =>
    hasVisibleBorder(element) ||
    !transparent.test(getComputedStyle(element).backgroundColor) ||
    element.getAttribute('data-variant') === 'tertiary';

describe('the Designsystemet slot gallery in forced-colors mode', () => {
    it('keeps every enabled button, text input and text area distinguishable, ', async () => {
        await commands.emulateMedia({ forcedColors: 'active' });
        const gallery = await mountGallery('light', 'md');
        expect(matchMedia('(forced-colors: active)').matches).toBe(true);
        const unbordered = [...gallery.querySelectorAll('button:enabled, input[type=text], textarea')]
            .filter((element) => !isDistinguishable(element))
            .map((element) => element.getAttribute('aria-label') ?? element.textContent ?? element.tagName);
        expect(unbordered).toEqual([]);
    });

    it('keeps a visible, opaque focus ring on a keyboard-focused button', async () => {
        await commands.emulateMedia({ forcedColors: 'active' });
        await mountGallery('dark', 'md');
        await userEvent.tab();
        const style = getComputedStyle(document.activeElement as Element);
        expect(style.outlineStyle).not.toBe('none');
        expect(Number.parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
        expect(style.outlineColor).not.toMatch(transparent);
    });
});
