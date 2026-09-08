// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act } from 'react';
import type { ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

/** A `CheckboxListFilter` mounted into a real document, together with what is needed to take it down again. */
export interface CheckboxListFilterInTheDom {
    container: HTMLDivElement;
    root: Root;
}

/**
 * Renders an element into a real document.
 * @param element - The element to render.
 * @returns The mounted tree, to be passed to {@link unmount}.
 */
export const render = async (element: ReactElement): Promise<CheckboxListFilterInTheDom> => {
    // SAFETY: React's test-environment flag is an intentionally undocumented global absent from DOM typings.
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
 * Unmounts a tree rendered with {@link render} and removes its container.
 * @param mounted - The mounted tree.
 */
export const unmount = async (mounted: CheckboxListFilterInTheDom) => {
    await act(async () => {
        mounted.root.unmount();
    });
    mounted.container.remove();
};

/**
 * Types into a controlled search input the way a browser does. Assigning `input.value` directly
 * bypasses the setter React's input tracking patches, so React never sees the change and no
 * `onChange` fires; going through the native prototype's setter first is what makes the
 * subsequent `input` event actually reach the component.
 * @param input - The input to type into.
 * @param value - The value to set.
 */
export const typeIntoSearchInput = async (input: HTMLInputElement, value: string) => {
    await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(
            input,
            value,
        );
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
};

/**
 * Stubs the browser layout primitives `useOptionListOverflow` depends on and jsdom does not
 * implement, so a spec can dictate whether the option list "overflows" without a real layout
 * engine:
 *
 * - `ResizeObserver` - jsdom has no implementation at all; a no-op double is enough because
 *   these specs only ever need the *initial*, synchronous measurement the hook already performs
 *   on mount, not a live resize.
 * - `Element.scrollHeight` - jsdom's layout-free DOM always reports zero, so the option list's
 *   off-screen measuring mirror (`.pv-option-list-mirror`) would never appear to hold any content.
 * - `getComputedStyle(...).maxHeight` - the box's height budget comes from an external stylesheet
 *   this test environment never loads, so it otherwise resolves to the browser's initial `none`.
 *
 * Both stubs are installed *before* the component mounts, so the hook's first, synchronous
 * measurement already sees the values a spec configures - no extra render pass required. Call the
 * returned function to restore the originals once the spec is done with them.
 * @param mirrorScrollHeight - The height, in pixels, the measuring mirror reports.
 * @param containerMaxHeight - The `max-height` the option list's container reports, e.g. `'224px'`.
 * @returns A function that restores the original, unstubbed browser behaviour.
 */
export const stubOptionListLayoutMeasurement = (
    mirrorScrollHeight: number,
    containerMaxHeight: string,
): (() => void) => {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };

    const originalScrollHeight = Object.getOwnPropertyDescriptor(
        Element.prototype,
        'scrollHeight',
    );
    Object.defineProperty(Element.prototype, 'scrollHeight', {
        configurable: true,
        get(this: Element) {
            return this.classList.contains('pv-option-list-mirror') ? mirrorScrollHeight : 0;
        },
    });

    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = ((element: Element, ...rest: unknown[]) =>
        element.classList?.contains('pv-option-list')
            ? ({ maxHeight: containerMaxHeight } as CSSStyleDeclaration)
            : (
                  originalGetComputedStyle as unknown as (
                      ...args: unknown[]
                  ) => CSSStyleDeclaration
              )(element, ...rest)) as typeof window.getComputedStyle;

    return () => {
        if (originalScrollHeight) {
            Object.defineProperty(Element.prototype, 'scrollHeight', originalScrollHeight);
        }
        window.getComputedStyle = originalGetComputedStyle;
    };
};
