// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Dropdown } from '../Dropdown';

describe('when rendering a filterable multiple selection', () => {
    let container: HTMLDivElement;
    let root: Root;
    const onChange = vi.fn();

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
            observe() {
                return undefined;
            }
            unobserve() {
                return undefined;
            }
            disconnect() {
                return undefined;
            }
        };
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <Dropdown<Array<string>>
                        multiple
                        filter
                        showClear
                        disabled
                        value={['one']}
                        options={[
                            { label: 'One', value: 'one' },
                            { label: 'Two', value: 'two' },
                        ]}
                        filterPlaceholder='Filter choices'
                        onChange={onChange}
                    />
                </CratisComponentsProvider>,
            );
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        onChange.mockReset();
    });

    it('should display the selected values while the popup is closed', () => {
        expect(
            container.querySelector('[data-cratis-part="value"]')?.textContent,
        ).to.contain('One');
    });

    it('should render the multi-value combobox filter', () => {
        expect(
            container.querySelector<HTMLInputElement>('[data-cratis-part="filter"]')
                ?.placeholder,
        ).to.equal('Filter choices');
    });

    it('should keep the clear action disabled with the control', () => {
        const clear = container.querySelector<HTMLButtonElement>(
            '[data-cratis-part="clear"]',
        );
        expect(clear?.disabled).to.equal(true);
        clear?.click();
        expect(onChange.mock.calls).to.have.lengthOf(0);
    });

    it('should clear every selected value when enabled', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <Dropdown<Array<string>>
                        multiple
                        filter
                        showClear
                        value={['one']}
                        options={[
                            { label: 'One', value: 'one' },
                            { label: 'Two', value: 'two' },
                        ]}
                        onChange={onChange}
                    />
                </CratisComponentsProvider>,
            );
        });
        await act(async () => {
            container
                .querySelector<HTMLButtonElement>('[data-cratis-part="clear"]')
                ?.click();
        });
        expect(onChange.mock.calls).to.have.lengthOf(1);
        expect(onChange.mock.calls[0][0].value).to.deep.equal([]);
    });
});
