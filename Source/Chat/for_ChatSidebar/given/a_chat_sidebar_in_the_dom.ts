// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CratisComponentsProvider } from '../../../Common/CratisComponentsProvider';

/**
 * A chat sidebar mounted into a real document, together with what is needed to take it down
 * again.
 */
export interface ChatSidebarInTheDom {
    container: HTMLDivElement;
    root: Root;
}

/**
 * Renders an element into a real document and lets PrimeReact's show transition complete, so the
 * drawer has settled by the time the spec looks at it.
 *
 * PrimeReact 11 components resolve their configuration from a `PrimeReactProvider` and throw
 * without one, so the element is mounted inside the Cratis provider that supplies it.
 * `ResizeObserver` is stubbed because jsdom has no layout engine, and `scrollIntoView` because
 * the conversation keeps its newest message in view with it.
 * @param element - The element to render.
 * @returns The mounted sidebar, to be passed to {@link unmount}.
 */
export const render = async (element: React.ReactElement): Promise<ChatSidebarInTheDom> => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
        observe() { }
        unobserve() { }
        disconnect() { }
    };
    (Element.prototype as unknown as { scrollIntoView?: () => void }).scrollIntoView ??= () => { };

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(React.createElement(CratisComponentsProvider, null, element));
    });

    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 400));
    });

    return { container, root };
};

/**
 * Unmounts a sidebar rendered with {@link render} and removes its container.
 * @param sidebar - The mounted sidebar.
 */
export const unmount = async (sidebar: ChatSidebarInTheDom) => {
    await act(async () => {
        sidebar.root.unmount();
    });
    sidebar.container.remove();
};

/**
 * Writes a value into a textarea the way typing does as far as React is concerned: through the
 * native value setter (so React's own value tracking notices the change) followed by an `input`
 * event.
 * @param textarea - The textarea to write into.
 * @param value - The text it should hold.
 */
export const typeInto = async (textarea: HTMLTextAreaElement, value: string) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
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
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
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
