// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CratisComponentsProvider } from '../../../Common/CratisComponentsProvider';
import { useComponentPicker, type ComponentPickerController } from '../../useComponentPicker';
import type { ComponentResolver } from '../../ComponentResolver';
import type { PickedComponent } from '../../PickedComponent';

/** A mounted screen together with the picker controller its host would hold. */
export interface ScreenInTheDom {
    container: HTMLDivElement;
    root: Root;
    picker: () => ComponentPickerController;
}

let controller: ComponentPickerController;

const PickerHost = ({ resolve, children }: { resolve?: ComponentResolver; children: React.ReactNode }) => {
    controller = useComponentPicker({ resolve });
    return (
        <>
            {children}
            {controller.picker}
        </>
    );
};

/**
 * Mounts content with a picker host into a real document.
 * @param children - The screen content.
 * @param resolve - The host's context resolver.
 * @returns The mounted screen, to be passed to {@link unmountScreen}.
 */
export const mountScreen = async (children: React.ReactNode, resolve?: ComponentResolver): Promise<ScreenInTheDom> => {
    // SAFETY: React's test-environment flag is an intentionally undocumented global absent from DOM typings.
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    // SAFETY: jsdom omits ResizeObserver; the overlay only calls these observer methods.
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
        observe() { return undefined; }
        unobserve() { return undefined; }
        disconnect() { return undefined; }
    };
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
        root.render(
            <CratisComponentsProvider>
                <PickerHost resolve={resolve}>{children}</PickerHost>
            </CratisComponentsProvider>,
        );
    });
    return { container, root, picker: () => controller };
};

/** Unmounts a screen mounted with {@link mountScreen}. */
export const unmountScreen = async (screen: ScreenInTheDom) => {
    await act(async () => screen.root.unmount());
    screen.container.remove();
};

/** Starts picking. The returned object holds the pending result (it is wrapped so awaiting this call does not wait for the pick). */
export const startPicking = async (screen: ScreenInTheDom): Promise<{ result: Promise<PickedComponent | null> }> => {
    let result!: Promise<PickedComponent | null>;
    await act(async () => {
        result = screen.picker().start();
    });
    return { result };
};

/** Moves the pointer over an element. */
export const hover = async (element: Element) => {
    await act(async () => {
        element.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true }));
    });
};

/** Clicks an element the way a user does. */
export const click = async (element: Element) => {
    await act(async () => {
        element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
};

/** Presses a key on the document. */
export const press = async (key: string) => {
    await act(async () => {
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    });
};

/** The name shown in the picker's tooltip, or `undefined` when nothing is highlighted. */
export const highlightedName = (): string | undefined =>
    document.querySelector('[data-cratis-part="overlay"][data-cratis-kind="picker"] [data-cratis-part="name"]')?.textContent ?? undefined;
