// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { NumberInput } from '../NumberInput';

describe('when rendering prefix and suffix decorations on NumberInput', () => {
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
    const prefixElement = () =>
        container.querySelector<HTMLSpanElement>('[data-cratis-part="prefix"]');
    const suffixElement = () =>
        container.querySelector<HTMLSpanElement>('[data-cratis-part="suffix"]');

    it('should render prefix as a separate decoration element', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={1500}
                        onChange={() => undefined}
                        prefix='kr'
                        locale='en-US'
                        aria-label='Price'
                    />
                </CratisComponentsProvider>,
            );
        });

        const prefix = prefixElement();
        expect(prefix).to.not.equal(null);
        expect(prefix?.textContent).to.equal('kr');
        expect(prefix?.getAttribute('aria-hidden')).to.equal('true');
    });

    it('should render suffix as a separate decoration element', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={75}
                        onChange={() => undefined}
                        suffix='%'
                        locale='en-US'
                        aria-label='Completion'
                    />
                </CratisComponentsProvider>,
            );
        });

        const suffix = suffixElement();
        expect(suffix).to.not.equal(null);
        expect(suffix?.textContent).to.equal('%');
        expect(suffix?.getAttribute('aria-hidden')).to.equal('true');
    });

    it('should never include prefix or suffix text in the input value', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={1500}
                        onChange={() => undefined}
                        prefix='kr'
                        suffix='/t'
                        locale='en-US'
                        aria-label='Rate'
                    />
                </CratisComponentsProvider>,
            );
        });

        const input = inputElement();
        expect(input?.value).to.not.include('kr');
        expect(input?.value).to.not.include('/t');
        expect(input?.value).to.equal('1,500');
    });

    it('should not render prefix element when prefix is omitted', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={100}
                        onChange={() => undefined}
                        locale='en-US'
                        aria-label='Value'
                    />
                </CratisComponentsProvider>,
            );
        });

        expect(prefixElement()).to.equal(null);
    });

    it('should not render suffix element when suffix is omitted', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={100}
                        onChange={() => undefined}
                        locale='en-US'
                        aria-label='Value'
                    />
                </CratisComponentsProvider>,
            );
        });

        expect(suffixElement()).to.equal(null);
    });
});
