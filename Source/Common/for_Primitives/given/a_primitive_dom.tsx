// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';

export interface MountedPrimitive {
    container: HTMLDivElement;
    root: Root;
}

export const mountPrimitive = async (element: ReactNode): Promise<MountedPrimitive> => {
    (
        globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => root.render(element));
    return { container, root };
};

export const unmountPrimitive = async ({ container, root }: MountedPrimitive) => {
    await act(async () => root.unmount());
    container.remove();
};

export const setNativeValue = async (
    element: HTMLInputElement | HTMLTextAreaElement,
    value: string,
) => {
    await act(async () => {
        const prototype =
            element instanceof HTMLTextAreaElement
                ? HTMLTextAreaElement.prototype
                : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
    });
};
