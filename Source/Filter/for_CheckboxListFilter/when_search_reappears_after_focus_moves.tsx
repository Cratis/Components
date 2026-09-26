// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CheckboxListFilter } from '../CheckboxListFilter';

const options = [{ key: 'a', label: 'Active', value: 'a' }];
let container: HTMLDivElement;
let root: Root;
let outside: HTMLButtonElement;
let measure: ResizeObserverCallback;
let contentHeight: number;
let originalResizeObserver: typeof ResizeObserver;
let originalScrollHeight: PropertyDescriptor | undefined;
let originalGetComputedStyle: typeof window.getComputedStyle;

const render = async (autoFocusSearch: boolean) => {
    await act(async () => root.render(<>
        <button ref={(button) => { if (button) outside = button; }}>Outside</button>
        <CheckboxListFilter options={options} selected={new Set()} onToggle={() => undefined}
            autoFocusSearch={autoFocusSearch} />
    </>));
};

beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    contentHeight = 600;
    originalResizeObserver = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
        constructor(callback: ResizeObserverCallback) { measure = callback; }
        observe() { return undefined; }
        unobserve() { return undefined; }
        disconnect() { return undefined; }
    };
    originalScrollHeight = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollHeight');
    Object.defineProperty(Element.prototype, 'scrollHeight', {
        configurable: true,
        get(this: Element) { return this.classList.contains('pv-option-list-mirror') ? contentHeight : 0; },
    });
    originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = ((element: Element) => element.classList.contains('pv-option-list')
        ? { maxHeight: '224px' } as CSSStyleDeclaration
        : originalGetComputedStyle(element)) as typeof window.getComputedStyle;
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    globalThis.ResizeObserver = originalResizeObserver;
    if (originalScrollHeight) Object.defineProperty(Element.prototype, 'scrollHeight', originalScrollHeight);
    window.getComputedStyle = originalGetComputedStyle;
});

describe('when overflow search reappears during the same expansion after focus moves', () => {
    beforeEach(async () => {
        await render(true);
        outside.focus();
        await act(async () => { contentHeight = 10; measure([], {} as ResizeObserver); });
        await act(async () => { contentHeight = 600; measure([], {} as ResizeObserver); });
    });

    it('should not take focus back from the user', () => {
        expect(document.activeElement).to.equal(outside);
    });
});

describe('when search is requested again in a new expansion', () => {
    beforeEach(async () => {
        await render(true);
        outside.focus();
        await render(false);
        await render(true);
    });

    it('should focus the search again', () => {
        expect(document.activeElement).to.equal(container.querySelector('input[type="search"]'));
    });
});
