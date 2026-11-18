// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { arcProps, asDirectComponent, fieldCases } from './field_cases';
import { resetSlotCalls, withStubAdapter } from './a_stub_adapter';

/** Native value setter so React sees a real input event on a controlled input. */
const setNativeValue = (input: HTMLInputElement, value: string) =>
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);

/** A jsdom container that renders command-form fields under the stub adapter. */
export class a_field_host {
    container!: HTMLDivElement;
    private root!: Root;

    /** Creates the container; call from `beforeEach`. */
    mount() {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        this.container = document.createElement('div');
        document.body.append(this.container);
        this.root = createRoot(this.container);
        resetSlotCalls();
    }

    /** Removes the container; call from `afterEach`. */
    async unmount() {
        await act(async () => this.root.unmount());
        this.container.remove();
    }

    /** Renders an arbitrary node. */
    async renderNode(node: ReactNode) {
        await act(async () => this.root.render(node));
    }

    /** Renders a named field case under the stub adapter, with optional extra props. */
    async renderCase(name: string, extra: Record<string, unknown> = {}) {
        const fieldCase = fieldCases.find((candidate) => candidate.name === name)!;
        const Field = asDirectComponent(fieldCase.component);
        await this.renderNode(withStubAdapter(<Field {...arcProps} {...fieldCase.props} {...extra} />));
    }

    /** The stub inputs currently rendered. */
    stubs(marker?: string) {
        const selector = marker ? `[data-stub="${marker}"]` : '[data-stub]';
        return Array.from(this.container.querySelectorAll<HTMLInputElement>(selector));
    }

    /** Types a value into the first stub input. */
    async type(value: string) {
        const input = this.stubs()[0];
        await act(async () => {
            setNativeValue(input, value);
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
    }

    /** Clicks the stub input at the given index. */
    async click(index = 0) {
        await act(async () => this.stubs()[index].click());
    }

    /** Focuses then blurs the first stub input. */
    async blur() {
        await act(async () => {
            const input = this.stubs()[0];
            input.focus();
            input.blur();
        });
    }
}
