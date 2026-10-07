// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

/** Mounts the table layout of the SchemaEditor the way the existing specs do, with the helpers they each repeat. */
export class TableMount {
    readonly container: HTMLDivElement;
    private readonly root: Root;

    constructor() {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
            observe() { return undefined; }
            unobserve() { return undefined; }
            disconnect() { return undefined; }
        };
        this.container = document.createElement('div');
        document.body.append(this.container);
        this.root = createRoot(this.container);
    }

    async render(element: ReactElement) {
        await act(async () => { this.root.render(element); });
    }

    async unmount() {
        await act(async () => this.root.unmount());
        this.container.remove();
    }

    button(name: string): HTMLButtonElement {
        const found = Array.from(this.container.querySelectorAll('button')).find(candidate => candidate.textContent?.includes(name));
        if (!found) throw new Error(`No ${name} button.`);
        return found;
    }

    async click(element: Element) {
        await act(async () => (element as HTMLElement).click());
    }

    async type(input: HTMLInputElement, value: string) {
        await act(async () => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
    }

    input(label: string): HTMLInputElement {
        const found = this.container.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`);
        if (!found) throw new Error(`No input labelled ${label}.`);
        return found;
    }

    headers(): string[] {
        return Array.from(this.container.querySelectorAll('th')).map(header => header.textContent ?? '');
    }
}
