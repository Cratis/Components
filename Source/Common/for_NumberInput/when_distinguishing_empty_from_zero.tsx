// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { NumberInput } from '../NumberInput';

describe('when distinguishing empty from zero in NumberInput', () => {
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

    it('should display zero as a formatted value', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={0}
                        onChange={() => undefined}
                        locale='en-US'
                        aria-label='Amount'
                    />
                </CratisComponentsProvider>,
            );
        });

        const input = inputElement();
        expect(input?.value).to.equal('0');
    });

    it('should display an empty string when value is null', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={null}
                        onChange={() => undefined}
                        locale='en-US'
                        aria-label='Amount'
                    />
                </CratisComponentsProvider>,
            );
        });

        const input = inputElement();
        expect(input?.value).to.equal('');
    });

    it('should display zero with fraction digits when value is zero with minimumFractionDigits', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={0}
                        onChange={() => undefined}
                        locale='en-US'
                        minimumFractionDigits={2}
                        aria-label='Amount'
                    />
                </CratisComponentsProvider>,
            );
        });

        const input = inputElement();
        expect(input?.value).to.equal('0.00');
    });

    it('should keep null value empty even when fraction digits are configured', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={null}
                        onChange={() => undefined}
                        locale='en-US'
                        minimumFractionDigits={2}
                        aria-label='Amount'
                    />
                </CratisComponentsProvider>,
            );
        });

        const input = inputElement();
        expect(input?.value).to.equal('');
    });
});
