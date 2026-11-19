// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { focusRingWidth, mountSurface, nameOf, settle, unmountSurface } from './surfaces';

afterEach(unmountSurface);

const dialog = () => document.querySelector<HTMLElement>('[role=dialog]');

const tab = async (count: number, shift = false) => {
    const names: string[] = [];
    for (let index = 0; index < count; index++) {
        await userEvent.keyboard(shift ? '{Shift>}{Tab}{/Shift}' : '{Tab}');
        names.push(nameOf(document.activeElement as Element));
    }
    return names;
};

const openDialogWithKeyboard = async () => {
    await mountSurface('commandDialogOpener', 'light', 'md');
    await userEvent.tab();
    expect(nameOf(document.activeElement as Element)).toBe('Open Dialog');
    await userEvent.keyboard('{Enter}');
    await expect.poll(dialog).not.toBeNull();
    await settle();
};

describe('keyboard operation of the Designsystemet CommandDialog', () => {
    it('moves focus into the dialog when it opens', async () => {
        await openDialogWithKeyboard();
        expect(dialog()?.contains(document.activeElement)).toBe(true);
    });

    it('tabs through the dialog controls in order, skipping the disabled Save, and wraps inside the dialog', async () => {
        await openDialogWithKeyboard();
        expect(await tab(6)).toEqual(['Close', 'Name', 'Email', 'Age', 'Cancel', 'Close']);
    });

    it('keeps focus trapped in the dialog going backwards', async () => {
        await openDialogWithKeyboard();
        const names: string[] = [];
        const outside: string[] = [];
        for (let index = 0; index < 8; index++) {
            await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
            names.push(nameOf(document.activeElement as Element));
            if (!dialog()?.contains(document.activeElement)) outside.push(names[index]);
        }
        expect(outside).toEqual([]);
        expect(names).toContain('Cancel');
    });

    it('shows a focus ring of at least 2px on every dialog control', async () => {
        await openDialogWithKeyboard();
        const weak: string[] = [];
        for (let index = 0; index < 5; index++) {
            await userEvent.tab();
            const width = focusRingWidth(document.activeElement as Element);
            if (width < 2) weak.push(`${nameOf(document.activeElement as Element)}: ${width}px`);
        }
        expect(weak).toEqual([]);
    });

    it('closes on Escape and returns focus to the control that opened it', async () => {
        await openDialogWithKeyboard();
        await userEvent.keyboard('{Escape}');
        await expect.poll(dialog).toBeNull();
        expect(nameOf(document.activeElement as Element)).toBe('Open Dialog');
    });

    it('closes with the Close button from the keyboard and returns focus to the opener', async () => {
        await openDialogWithKeyboard();
        await userEvent.tab();
        expect(nameOf(document.activeElement as Element)).toBe('Close');
        await userEvent.keyboard('{Enter}');
        await expect.poll(dialog).toBeNull();
        expect(nameOf(document.activeElement as Element)).toBe('Open Dialog');
    });

    it('keeps focus trapped in the stepper dialog', async () => {
        await mountSurface('stepperDialogOpen', 'light', 'md');
        await expect.poll(dialog).not.toBeNull();
        await settle();
        const outside: string[] = [];
        for (let index = 0; index < 14; index++) {
            await userEvent.tab();
            if (!dialog()?.contains(document.activeElement)) outside.push(nameOf(document.activeElement as Element));
        }
        expect(outside).toEqual([]);
    });
});

describe('keyboard operation of the Designsystemet DataPage', () => {
    const mountPaged = async () => {
        await mountSurface('dataPagePaged', 'light', 'md');
        await expect.poll(() => document.querySelectorAll('tbody tr').length).toBe(20);
        await settle();
    };
    const range = () => document.querySelector('.cratis-table-paginator-range')?.textContent;
    const pager = () => document.querySelector<HTMLElement>('[role=navigation][aria-label=Pagination]');

    it('tabs from the toolbar through search and column sort buttons into the rows', async () => {
        await mountPaged();
        expect(await tab(7)).toEqual(['◆Add Person', 'Search table', 'ID', 'Name', 'Email', 'Role', expect.stringContaining('Person 1')]);
    });

    it('labels the paginator navigation and disables first and previous on page one', async () => {
        await mountPaged();
        const buttons = [...(pager()?.querySelectorAll('button') ?? [])];
        expect(buttons.map((button) => [nameOf(button), button.disabled])).toEqual([
            ['First page', true],
            ['Previous page', true],
            ['Next page', false],
            ['Last page', false],
        ]);
        expect(range()).toBe('1–20 of 24');
    });

    it('pages forward with Enter and back with Space on the paginator buttons', async () => {
        await mountPaged();
        pager()?.querySelector<HTMLElement>('[aria-label="Next page"]')?.focus();
        await userEvent.keyboard('{Enter}');
        await expect.poll(range).toBe('21–24 of 24');
        pager()?.querySelector<HTMLElement>('[aria-label="Previous page"]')?.focus();
        await userEvent.keyboard(' ');
        await expect.poll(range).toBe('1–20 of 24');
    });

    it('keeps keyboard focus in the paginator after paging to the last page', async () => {
        await mountPaged();
        pager()?.querySelector<HTMLElement>('[aria-label="Next page"]')?.focus();
        await userEvent.keyboard('{Enter}');
        await expect.poll(range).toBe('21–24 of 24');
        expect(pager()?.querySelector<HTMLButtonElement>('[aria-label="Next page"]')?.disabled).toBe(true);
        expect(pager()?.contains(document.activeElement)).toBe(true);
    });
});
