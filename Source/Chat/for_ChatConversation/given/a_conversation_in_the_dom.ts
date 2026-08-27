// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

/**
 * A component mounted into a real document, together with what is needed to take it down again.
 */
export interface ConversationInTheDom {
    container: HTMLDivElement;
    root: Root;
}

/**
 * Renders an element into a real document. `scrollIntoView` is stubbed because the conversation
 * keeps its newest message in view with it and jsdom has no layout engine to scroll anything.
 * @param element - The element to render.
 * @returns The mounted component, to be passed to {@link unmount}.
 */
export const render = async (
    element: React.ReactElement,
): Promise<ConversationInTheDom> => {
    // SAFETY: React reads this process-wide test flag from globalThis.
    (
        globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    // SAFETY: jsdom has no layout engine, so scrollIntoView is a test-only stub absent from its typings.
    (Element.prototype as unknown as { scrollIntoView?: () => void }).scrollIntoView ??=
        () => {};

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(element);
    });

    return { container, root };
};

/**
 * Unmounts a component rendered with {@link render} and removes its container.
 * @param rendered - The mounted component.
 */
export const unmount = async (rendered: ConversationInTheDom) => {
    await act(async () => {
        rendered.root.unmount();
    });
    rendered.container.remove();
};

/**
 * Writes a value into a textarea the way typing does as far as React is concerned: through the
 * native value setter (so React's own value tracking notices the change) followed by an `input`
 * event.
 * @param textarea - The textarea to write into.
 * @param value - The text it should hold.
 */
export const typeInto = async (textarea: HTMLTextAreaElement, value: string) => {
    const setter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        'value',
    )!.set!;
    await act(async () => {
        setter.call(textarea, value);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });
};

/**
 * Presses `Enter` on the element, the way sending a message does.
 * @param element - The element with focus.
 */
export const pressEnter = async (element: HTMLElement) => {
    await act(async () => {
        element.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
        );
    });
};

/**
 * Clicks an element.
 * @param element - The element to click.
 */
export const click = async (element: HTMLElement) => {
    await act(async () => {
        element.click();
    });
};
