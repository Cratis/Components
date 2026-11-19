// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import '@digdir/designsystemet-css';
import '@digdir/designsystemet-css/theme.css';
import '@cratis/components/tokens';
import '@cratis/components/themes/designsystemet';
import '@cratis/components/styles';
import { useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { CratisComponentsProvider } from '@cratis/components';
import { Dialog } from '@cratis/components/Dialogs';
import { designsystemetUiLibrary } from '../src/index.js';

let host: HTMLDivElement;
let root: Root;
let cancellations: string[];
let hideParent: () => void;

const Example = () => {
    const [open, setOpen] = useState(false);
    const [parentVisible, setParentVisible] = useState(true);
    hideParent = () => flushSync(() => setParentVisible(false));
    const cancel = (title: string) => () => {
        cancellations.push(title);
        setOpen(false);
    };
    return (
        <CratisComponentsProvider library={designsystemetUiLibrary}>
            <button type='button' onClick={() => setOpen(true)}>
                Open
            </button>
            {open && (
                <Dialog title='Parent dialog' visible={parentVisible} buttons={null} dismissable onCancel={cancel('Parent dialog')}>
                    <input aria-label='Name' />
                    <Dialog title='Nested dialog' buttons={null} dismissable onCancel={cancel('Nested dialog')}>
                        <p>Nested content</p>
                    </Dialog>
                </Dialog>
            )}
        </CratisComponentsProvider>
    );
};

const SingleDialog = () => (
    <CratisComponentsProvider library={designsystemetUiLibrary}>
        <Dialog title='Edit account' buttons={null} dismissable onCancel={() => void cancellations.push('Edit account')}>
            <input aria-label='Name' />
        </Dialog>
    </CratisComponentsProvider>
);

const dialogNamed = (name: string) => page.getByRole('dialog', { name });

const openBoth = async () => {
    root.render(<Example />);
    await userEvent.click(page.getByRole('button', { name: 'Open' }));
    await expect.element(dialogNamed('Nested dialog')).toBeVisible();
};

// A point on the backdrop, outside the dialog's box.
const backdropPoint = (dialog: Element) => {
    const bounds = dialog.getBoundingClientRect();
    return { clientX: Math.max(bounds.left - 20, 1), clientY: Math.max(bounds.top - 20, 1) };
};

// Presses with the pointer going down on `start` and the click landing on the dialog's backdrop,
// which is where the browser targets a press released outside the dialog.
const press = (start: Element, dialog: Element, startPoint: { clientX: number; clientY: number }) => {
    start.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, ...startPoint }));
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true, ...backdropPoint(dialog) }));
};

const centerOf = (element: Element) => {
    const bounds = element.getBoundingClientRect();
    return { clientX: bounds.left + bounds.width / 2, clientY: bounds.top + bounds.height / 2 };
};

beforeEach(async () => {
    await page.viewport(800, 800);
    cancellations = [];
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
});

afterEach(() => {
    root.unmount();
    host.remove();
});

describe('the Designsystemet dialog', () => {
    it('opens the parent before a nested dialog mounted with it, so Escape closes only the nested one', async () => {
        await openBoth();

        await userEvent.keyboard('{Escape}');

        expect(cancellations).toEqual(['Nested dialog']);
    });

    it('closes the nested modal with its hidden parent and returns focus to the page', async () => {
        await openBoth();

        hideParent();

        await expect.poll(() => document.querySelector(':modal')).toBeNull();
        expect([...document.querySelectorAll('dialog')].some((dialog) => dialog.open)).toBe(false);
        await expect.element(page.getByRole('button', { name: 'Open' })).toHaveFocus();
    });

    it('stays open when a press starts inside and is released on the backdrop', async () => {
        root.render(<SingleDialog />);
        await expect.element(dialogNamed('Edit account')).toBeVisible();
        const dialog = dialogNamed('Edit account').element();
        const field = page.getByRole('textbox', { name: 'Name' }).element();

        press(field, dialog, centerOf(field));

        expect(cancellations).toEqual([]);
        expect((dialog as HTMLDialogElement).open).toBe(true);
    });

    it('dismisses when a press both starts and ends on the backdrop', async () => {
        root.render(<SingleDialog />);
        await expect.element(dialogNamed('Edit account')).toBeVisible();
        const dialog = dialogNamed('Edit account').element();

        press(dialog, dialog, backdropPoint(dialog));

        expect(cancellations).toEqual(['Edit account']);
    });
});
