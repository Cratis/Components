// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { NumberInput } from '../NumberInput';

describe('when stepping with keyboard in NumberInput', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const inputElement = () =>
        container.querySelector<HTMLInputElement>('[data-cratis-part="input"]');

    it('should increment value on ArrowUp', async () => {
        const onChange = vi.fn();
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={10}
                        onChange={onChange}
                        step={5}
                        locale='en-US'
                        aria-label='Counter'
                    />
                </CratisComponentsProvider>,
            );
        });

        const input = inputElement();
        if (!input) throw new Error('NumberInput did not render its input.');

        await act(async () => {
            input.focus();
            input.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
            );
        });

        expect(onChange.mock.calls.length).to.be.greaterThan(0);
        expect(onChange.mock.calls[onChange.mock.calls.length - 1][0]).to.equal(15);
    });

    it('should decrement value on ArrowDown', async () => {
        const onChange = vi.fn();
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={10}
                        onChange={onChange}
                        step={5}
                        locale='en-US'
                        aria-label='Counter'
                    />
                </CratisComponentsProvider>,
            );
        });

        const input = inputElement();
        if (!input) throw new Error('NumberInput did not render its input.');

        await act(async () => {
            input.focus();
            input.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
            );
        });

        expect(onChange.mock.calls.length).to.be.greaterThan(0);
        expect(onChange.mock.calls[onChange.mock.calls.length - 1][0]).to.equal(5);
    });
});
