// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

/** Mounts elements in a real DOM container and cleans it up. */
export class Mount {
    container!: HTMLDivElement;
    root!: Root;

    setup() {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        this.container = document.createElement('div');
        document.body.append(this.container);
        this.root = createRoot(this.container);
    }

    async teardown() {
        await act(async () => this.root.unmount());
        this.container.remove();
    }

    async render(element: React.ReactNode) {
        await act(async () => this.root.render(element));
    }

    /** Finds the one element with a `data-cratis-part` inside an optional scope. */
    parts(name: string, scope: ParentNode = this.container) {
        return Array.from(scope.querySelectorAll<HTMLElement>('[data-cratis-part]')).filter(
            (element) => element.getAttribute('data-cratis-part') === name,
        );
    }

    /** Finds an item row by its stable id. */
    row(id: string) {
        return Array.from(this.container.querySelectorAll<HTMLElement>('[data-item-id]')).find((element) => element.dataset.itemId === id)!;
    }

    /** Finds a control inside an item row. */
    control<T extends HTMLElement = HTMLElement>(id: string, name: string) {
        return Array.from(this.row(id).querySelectorAll<T>('[data-control]')).find((element) => element.dataset.control === name) as T;
    }

    /** The ids of the configurable rows, in DOM order. */
    order() {
        return this.parts('item').filter((row) => !row.hasAttribute('data-locked')).map((row) => row.dataset.itemId);
    }

    async click(element: HTMLElement) {
        await act(async () => element.click());
    }

    async type(input: HTMLInputElement, value: string) {
        await act(async () => {
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
            setter.call(input, value);
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
    }

    async select(element: HTMLSelectElement, value: string) {
        await act(async () => {
            const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!;
            setter.call(element, value);
            element.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    async key(element: HTMLElement, key: string) {
        await act(async () => {
            element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
        });
    }
}
