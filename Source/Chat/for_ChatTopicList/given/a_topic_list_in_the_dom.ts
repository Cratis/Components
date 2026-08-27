// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

/**
 * A topic list mounted into a real document, together with what is needed to take it down again.
 */
export interface TopicListInTheDom {
    container: HTMLDivElement;
    root: Root;
}

/**
 * Renders an element into a real document.
 * @param element - The element to render.
 * @returns The mounted list, to be passed to {@link unmount}.
 */
export const render = async (element: React.ReactElement): Promise<TopicListInTheDom> => {
    // SAFETY: React reads this process-wide test flag from globalThis.
    (
        globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(element);
    });

    return { container, root };
};

/**
 * Unmounts a list rendered with {@link render} and removes its container.
 * @param list - The mounted list.
 */
export const unmount = async (list: TopicListInTheDom) => {
    await act(async () => {
        list.root.unmount();
    });
    list.container.remove();
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
