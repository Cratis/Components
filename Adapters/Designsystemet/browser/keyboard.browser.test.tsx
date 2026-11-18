// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountGallery, nameOf, unmountGallery } from './gallery';

afterEach(unmountGallery);

const expectedTabOrder = [
    'Solid', 'Outline', 'Ghost', 'Link',
    'Accent', 'Positive', 'Caution', 'Critical',
    'Small', 'Normal', 'Large', 'Add item',
    'Name', 'Invalid', 'Notes',
    'Include archived', 'Selected', 'Invalid',
    'Daily',
    'Notifications', 'Enabled',
];

/**
 * Designsystemet draws the focus ring on the control itself for buttons and text fields, but on
 * the wrapping `.ds-field` (via `:has(input:focus-visible)`) for checkboxes, radios and switches.
 */
const ringOwnerStyle = (element: HTMLElement) => {
    const own = getComputedStyle(element);
    const field = element.closest('.ds-field');
    return own.outlineStyle === 'none' && field ? getComputedStyle(field) : own;
};

interface FocusSnapshot {
    readonly name: string;
    readonly outline: string;
    readonly outlineWidth: number;
}

/** Tabs `count` times, snapshotting each control's name and focus outline while it holds focus. */
const tabThrough = async (count: number) => {
    const focused: FocusSnapshot[] = [];
    for (let index = 0; index < count; index++) {
        await userEvent.tab();
        const element = document.activeElement as HTMLElement;
        const style = ringOwnerStyle(element);
        focused.push({
            name: nameOf(element),
            outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
            outlineWidth: style.outlineStyle === 'none' ? 0 : Number.parseFloat(style.outlineWidth),
        });
    }
    return focused;
};

describe('keyboard operation of the Designsystemet slot gallery', () => {
    it('tabs through the enabled controls in document order and skips disabled ones', async () => {
        await mountGallery('light', 'md');
        const focused = await tabThrough(expectedTabOrder.length);
        expect(focused.map(({ name }) => name)).toEqual(expectedTabOrder);
    });

    it('shows a visible focus ring of at least 2px on every focused control', async () => {
        await mountGallery('light', 'md');
        const focused = await tabThrough(expectedTabOrder.length);
        const weak = focused
            .filter(({ outlineWidth }) => outlineWidth < 2)
            .map(({ name, outline }) => `${name}: ${outline}`);
        expect(weak).toEqual([]);
    });

    it('activates a button with Enter and with Space', async () => {
        const onActivate = vi.fn();
        await mountGallery('light', 'md', onActivate);
        await userEvent.tab();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(onActivate.mock.calls).toEqual([['Solid'], ['Solid']]);
    });

    it('toggles the checkbox and the switch with Space', async () => {
        await mountGallery('light', 'md');
        const [checkbox, toggle] = [
            document.querySelector<HTMLInputElement>('input[name=archived]'),
            document.querySelector<HTMLInputElement>('input[name=notifications]'),
        ];
        checkbox?.focus();
        await userEvent.keyboard(' ');
        toggle?.focus();
        await userEvent.keyboard(' ');
        expect([checkbox?.checked, toggle?.checked]).toEqual([true, true]);
    });

    it('moves the radio selection with the arrow keys and skips the disabled option', async () => {
        await mountGallery('light', 'md');
        document.querySelector<HTMLInputElement>('input[value=daily]')?.focus();
        await userEvent.keyboard('{ArrowDown}');
        const checked = document.querySelector<HTMLInputElement>('input[name=frequency]:checked');
        expect(checked?.value).toBe('weekly');
        await userEvent.keyboard('{ArrowDown}');
        expect(document.querySelector<HTMLInputElement>('input[name=frequency]:checked')?.value).toBe('daily');
    });
});
