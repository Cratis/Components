// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ObjectContentEditor, type ObjectContentEditorProps } from '../../ObjectContentEditor';

export class an_editor {
    readonly container = document.createElement('div');
    private readonly root: Root;

    constructor() {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        document.body.append(this.container);
        this.root = createRoot(this.container);
    }

    async render(props: ObjectContentEditorProps) {
        await act(async () => this.root.render(<ObjectContentEditor {...props} />));
    }

    async dispose() {
        await act(async () => this.root.unmount());
        this.container.remove();
    }

    find<T extends Element>(selector: string): T {
        const element = this.container.querySelector<T>(selector);
        if (!element) throw new Error(`Nothing matched '${selector}'.`);
        return element;
    }

    async click(selector: string) {
        await act(async () => this.find<HTMLElement>(selector).click());
    }

    async setValue(propertyName: string, value: string) {
        const element = this.find<HTMLInputElement | HTMLTextAreaElement>(`[aria-label="${propertyName}"]`);
        const prototype = element instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(prototype, 'value')!.set!;
        await act(async () => {
            setter.call(element, value);
            element.dispatchEvent(new Event('input', { bubbles: true }));
        });
    }

    labels() {
        return Array.from(this.container.querySelectorAll('tbody tr td:first-child'))
            .map((cell) => cell.textContent);
    }
}
