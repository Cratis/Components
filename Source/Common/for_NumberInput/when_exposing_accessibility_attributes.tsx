// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { NumberInput } from '../NumberInput';

describe('when exposing accessibility attributes on NumberInput', () => {
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
    const rootElement = () =>
        container.querySelector<HTMLElement>('[data-cratis-part="root"]');

    it('should render the group wrapper with role group', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={42}
                        onChange={() => undefined}
                        locale='en-US'
                        aria-label='Quantity'
                    />
                </CratisComponentsProvider>,
            );
        });

        const group = rootElement();
        expect(group?.getAttribute('role')).to.equal('group');
    });

    it('should render the input with inputMode for touch keyboards', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={42}
                        onChange={() => undefined}
                        locale='en-US'
                        aria-label='Quantity'
                    />
                </CratisComponentsProvider>,
            );
        });

        const input = inputElement();
        // react-aria sets inputMode based on decimal/negative configuration
        expect(input?.getAttribute('inputmode')).to.not.equal(null);
    });

    it('should expose aria-label when provided', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={10}
                        onChange={() => undefined}
                        locale='en-US'
                        aria-label='Weight'
                    />
                </CratisComponentsProvider>,
            );
        });

        const input = inputElement();
        expect(input?.getAttribute('aria-label')).to.equal('Weight');
    });

    it('should set aria-invalid when invalid is true', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={0}
                        onChange={() => undefined}
                        locale='en-US'
                        invalid
                        aria-label='Budget'
                    />
                </CratisComponentsProvider>,
            );
        });

        const input = inputElement();
        expect(input?.getAttribute('aria-invalid')).to.equal('true');
    });

    it('should set aria-describedby when provided', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={10}
                        onChange={() => undefined}
                        locale='en-US'
                        aria-label='Salary'
                        aria-describedby='salary-help'
                    />
                </CratisComponentsProvider>,
            );
        });

        const input = inputElement();
        expect(input?.getAttribute('aria-describedby')).to.include('salary-help');
    });

    it('should mark the group as aria-disabled when disabled', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={50}
                        onChange={() => undefined}
                        disabled
                        locale='en-US'
                        aria-label='Disabled field'
                    />
                </CratisComponentsProvider>,
            );
        });

        const group = rootElement();
        expect(group?.getAttribute('aria-disabled')).to.equal('true');
    });
});
