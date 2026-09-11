// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { NumberInput } from '../NumberInput';

describe('when rendering authoritative states on NumberInput', () => {
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

    const part = (name: string) =>
        container.querySelector<HTMLElement>(`[data-cratis-part="${name}"]`);

    it('should emit invalid state on root and input when invalid', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={42}
                        onChange={() => undefined}
                        invalid
                        locale='en-US'
                        aria-label='Amount'
                    />
                </CratisComponentsProvider>,
            );
        });

        expect(part('root')?.dataset.invalid).to.equal('true');
        expect(part('input')?.dataset.invalid).to.equal('true');
    });

    it('should emit disabled state on root and input when disabled', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={42}
                        onChange={() => undefined}
                        disabled
                        locale='en-US'
                        aria-label='Amount'
                    />
                </CratisComponentsProvider>,
            );
        });

        expect(part('root')?.dataset.disabled).to.equal('true');
        expect(part('input')?.dataset.disabled).to.equal('true');
    });

    it('should emit readonly state on root and input when readOnly', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={42}
                        onChange={() => undefined}
                        readOnly
                        locale='en-US'
                        aria-label='Amount'
                    />
                </CratisComponentsProvider>,
            );
        });

        expect(part('root')?.dataset.readonly).to.equal('true');
        expect(part('input')?.dataset.readonly).to.equal('true');
    });

    it('should not emit false state attributes when states are absent', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={42}
                        onChange={() => undefined}
                        locale='en-US'
                        aria-label='Amount'
                    />
                </CratisComponentsProvider>,
            );
        });

        for (const partName of ['root', 'input']) {
            const element = part(partName);
            expect(element?.hasAttribute('data-invalid')).to.equal(false);
            expect(element?.hasAttribute('data-disabled')).to.equal(false);
            expect(element?.hasAttribute('data-readonly')).to.equal(false);
        }
    });

    it('should forward pt attributes to root and input parts', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        value={42}
                        onChange={() => undefined}
                        locale='en-US'
                        aria-label='Amount'
                        pt={{
                            root: { 'data-testid': 'number-root' },
                            input: { 'data-testid': 'number-input' },
                        }}
                    />
                </CratisComponentsProvider>,
            );
        });

        expect(part('root')?.getAttribute('data-testid')).to.equal('number-root');
        expect(part('input')?.getAttribute('data-testid')).to.equal('number-input');
    });
});
