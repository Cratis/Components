// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

/** Mounts elements in a real DOM container and drives the editor the way a person would. */
export class Mount {
    container!: HTMLDivElement;
    root!: Root;

    setup() {
        // SAFETY: React exposes this test-only flag on globalThis without a declaration.
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        // SAFETY: jsdom omits ResizeObserver, which the popover positioning reads.
        (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
            observe() { return undefined; }
            unobserve() { return undefined; }
            disconnect() { return undefined; }
        };
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

    /** Every element carrying a `data-cratis-part`, document wide because menus are portaled. */
    parts(name: string): HTMLElement[] {
        return Array.from(document.querySelectorAll<HTMLElement>(`[data-cratis-part="${name}"]`));
    }

    /** The row of the property with a name. */
    row(name: string): HTMLElement {
        const found = this.parts('row').find(row => row.querySelector('[data-cratis-part="name"]')?.textContent === name);
        if (!found) throw new Error(`No row for ${name}.`);
        return found;
    }

    /** A control inside the row of a property, by part. */
    control<T extends HTMLElement = HTMLElement>(name: string, part: string): T {
        const found = this.row(name).querySelector<T>(`[data-cratis-part="${part}"]`);
        if (!found) throw new Error(`No ${part} on ${name}.`);
        return found;
    }

    /** The names of the properties in document order. */
    names(): string[] {
        return this.parts('name').map(element => element.textContent ?? '');
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

    async key(element: HTMLElement, key: string) {
        await act(async () => {
            element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
        });
    }

    async doubleClick(element: HTMLElement) {
        await act(async () => {
            element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
        });
    }

    /** Opens a menu trigger and returns the labels of the entries offered. */
    async openMenu(trigger: HTMLElement): Promise<string[]> {
        await this.click(trigger);
        return this.menuItems().map(item => item.textContent ?? '');
    }

    menuItems(): HTMLElement[] {
        return this.parts('menuItem');
    }

    /** Opens the submenu behind an entry and returns the labels of the entries it offers. */
    async openSubmenu(label: string): Promise<string[]> {
        const entry = this.menuItems().find(candidate => candidate.textContent?.startsWith(label));
        if (!entry) throw new Error(`No menu entry ${label}.`);
        await act(async () => entry.focus());
        await this.key(entry, 'ArrowRight');
        return this.menuItems().map(item => item.textContent ?? '').filter(text => !text.startsWith(label));
    }

    /** Activates a menu entry by its visible label. */
    async choose(label: string) {
        const item = this.menuItems().find(candidate => candidate.textContent?.endsWith(label));
        if (!item) throw new Error(`No menu entry ${label}.`);
        await this.click(item);
    }
}
