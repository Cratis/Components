// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { NumberInput } from '../NumberInput';

describe('when clamping at boundaries in NumberInput', () => {
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

    it('should not increment beyond the maximum value', async () => {
        const onChange = vi.fn();
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={100}
                        onChange={onChange}
                        max={100}
                        step={1}
                        locale='en-US'
                        aria-label='Quantity'
                    />
                </CratisComponentsProvider>,
            );
        });

        const input = inputElement();
        if (!input) throw new Error('NumberInput did not render its input.');

        // At max already; ArrowUp should not produce a change
        await act(async () => {
            input.focus();
            input.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
            );
        });

        // No change should occur when already at max
        expect(onChange.mock.calls.length).to.equal(0);
    });

    it('should not decrement beyond the minimum value', async () => {
        const onChange = vi.fn();
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={10}
                        onChange={onChange}
                        min={10}
                        step={1}
                        locale='en-US'
                        aria-label='Quantity'
                    />
                </CratisComponentsProvider>,
            );
        });

        const input = inputElement();
        if (!input) throw new Error('NumberInput did not render its input.');

        // At min already; ArrowDown should not produce a change
        await act(async () => {
            input.focus();
            input.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
            );
        });

        // No change should occur when already at min
        expect(onChange.mock.calls.length).to.equal(0);
    });

    it('should step to the boundary when near it', async () => {
        const onChange = vi.fn();
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={98}
                        onChange={onChange}
                        max={100}
                        step={1}
                        locale='en-US'
                        aria-label='Quantity'
                    />
                </CratisComponentsProvider>,
            );
        });

        const input = inputElement();
        if (!input) throw new Error('NumberInput did not render its input.');

        // Step from 98 → 99
        await act(async () => {
            input.focus();
            input.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
            );
        });

        expect(onChange.mock.calls.length).to.be.greaterThan(0);
        expect(onChange.mock.calls[0][0]).to.equal(99);

        // Step again from 99 → 100 (the max)
        onChange.mockClear();
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={99}
                        onChange={onChange}
                        max={100}
                        step={1}
                        locale='en-US'
                        aria-label='Quantity'
                    />
                </CratisComponentsProvider>,
            );
        });

        const input2 = inputElement();
        if (!input2) throw new Error('NumberInput did not render its input.');

        await act(async () => {
            input2.focus();
            input2.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
            );
        });

        expect(onChange.mock.calls.length).to.be.greaterThan(0);
        expect(onChange.mock.calls[0][0]).to.equal(100);
    });
});
