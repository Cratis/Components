// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CratisComponentsProvider } from '../../../Common/CratisComponentsProvider';

/**
 * A dialog mounted into a real document, together with what is needed to take
 * it down again. Initial focus only exists in a DOM, so the specs covering it
 * render for real rather than to static markup.
 */
export interface DialogInTheDom {
    container: HTMLDivElement;
    root: Root;
}

/**
 * Renders an element into a real document and lets the modal focus scope settle
 * before the spec observes it. The Cratis provider supplies locale and global
 * notification context just as an application root does.
 * @param element - The element to render.
 * @returns The mounted dialog, to be passed to {@link unmount}.
 */
export const render = async (element: React.ReactElement): Promise<DialogInTheDom> => {
    // SAFETY: React's test-environment flag is an intentionally undocumented global absent from DOM typings.
    (
        globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    // SAFETY: jsdom omits ResizeObserver; the overlay only calls these observer methods.
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(React.createElement(CratisComponentsProvider, null, element));
    });

    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
    });

    return { container, root };
};

/**
 * Unmounts a dialog rendered with {@link render} and removes its container.
 * @param dialog - The mounted dialog.
 */
export const unmount = async (dialog: DialogInTheDom) => {
    await act(async () => {
        dialog.root.unmount();
    });
    dialog.container.remove();
};

/**
 * Describes what currently has keyboard focus as a plain string, so specs can
 * assert on it directly. Elements come from the jsdom realm and therefore do
 * not carry chai's `should`, and a description also makes a failure say what
 * was focused instead of only that two objects differ.
 *
 * Reads as `button:Ok`, `h2:Delete personal data`, or `document.body` when
 * focus was never moved into the dialog at all.
 * @returns The description of the focused element.
 */
export const focusedElement = (): string => {
    const element = document.activeElement as HTMLElement | null;
    if (!element || element === document.body) {
        return 'document.body';
    }
    const label = element.getAttribute('aria-label') ?? element.textContent ?? '';
    return `${element.tagName.toLowerCase()}:${label}`;
};

/**
 * Whether focus currently sits inside the dialog rather than outside it.
 * @returns True when the focused element is inside the dialog.
 */
export const focusIsInsideTheDialog = (): boolean => {
    const dialog = document.querySelector('[role="dialog"]');
    return (
        !!dialog &&
        dialog.contains(document.activeElement) &&
        document.activeElement !== document.body
    );
};

/**
 * Whether the dialog renders its header close button.
 * @returns True when the close button is present.
 */
export const hasCloseButton = (): boolean =>
    !!document.querySelector('[data-cratis-part="close"]');

/**
 * The `tabindex` attribute on the dialog's title, or `'none'` when it has none.
 * @returns The tab index as a string.
 */
export const titleTabIndex = (): string =>
    document.querySelector('[data-cratis-part="title"]')?.getAttribute('tabindex') ??
    'none';

const buttonLabeled = (label: string) =>
    Array.from(document.querySelectorAll('button')).find(
        (button) => button.textContent === label,
    );

/**
 * Presses `Enter` on whatever has focus, the way a browser does: the key event
 * goes to the focused element, and a focused native button additionally gets
 * the `click` the browser synthesizes from the key *down*. `repeat` is set
 * because the case that matters is a key still held from before the dialog
 * existed.
 */
export const pressEnterOnFocusedElement = async () => {
    const element = document.activeElement as HTMLElement;

    await act(async () => {
        element.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true }),
        );
        if (element instanceof HTMLButtonElement) {
            element.click();
        }
    });
};

/**
 * Presses `Escape`, which the modal focus scope listens for on the document.
 */
export const pressEscape = async () => {
    await act(async () => {
        const target = document.activeElement ?? document;
        target.dispatchEvent(
            new KeyboardEvent('keydown', {
                key: 'Escape',
                code: 'Escape',
                bubbles: true,
            }),
        );
    });
};

/**
 * Clicks a button by its visible label.
 * @param label - The label of the button to click.
 */
export const click = async (label: string) => {
    await act(async () => {
        buttonLabeled(label)?.click();
    });
};
