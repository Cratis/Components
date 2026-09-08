// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Dropdown } from '../Dropdown';

const options = [
    { label: 'One', value: 'one' },
    { label: 'Two', value: 'two', disabled: true },
];

const optionLabeled = (label: string) =>
    Array.from(document.querySelectorAll('[data-cratis-part="option"]')).find(
        (option) => option.textContent === label,
    );

describe('when exposing Dropdown semantic state', () => {
    let container: HTMLDivElement;
    let root: Root;

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
                    <Dropdown
                        value='one'
                        options={options}
                        showClear
                        aria-label='Example choice'
                    />
                </CratisComponentsProvider>,
            );
        });

        const trigger = container.querySelector<HTMLButtonElement>(
            '[data-cratis-part="trigger"]',
        );
        if (!trigger) throw new Error('Dropdown did not render its trigger.');
        await act(async () => trigger.click());
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should expose open on parts owned by the open interaction', () => {
        const rootPart = container.querySelector('[data-cratis-part="root"]');
        const trigger = container.querySelector('[data-cratis-part="trigger"]');
        const popover = document.querySelector('[data-cratis-part="popover"]');
        const listbox = document.querySelector('[data-cratis-part="listbox"]');

        expect(rootPart?.hasAttribute('data-disabled')).to.equal(false);
        expect(rootPart?.hasAttribute('data-invalid')).to.equal(false);
        expect(rootPart?.hasAttribute('data-readonly')).to.equal(false);
        expect(trigger?.getAttribute('data-open')).to.equal('true');
        expect(popover?.getAttribute('data-open')).to.equal('true');
        expect(listbox?.getAttribute('data-open')).to.equal('true');
        expect(document.querySelector('[data-open="false"]')).to.equal(null);
    });

    it('should expose selected and disabled only on matching options', () => {
        const selectedOption = optionLabeled('One');
        const disabledOption = optionLabeled('Two');

        expect(selectedOption?.getAttribute('data-selected')).to.equal('true');
        expect(selectedOption?.hasAttribute('data-disabled')).to.equal(false);
        expect(disabledOption?.getAttribute('data-disabled')).to.equal('true');
        expect(disabledOption?.hasAttribute('data-selected')).to.equal(false);
        expect(document.querySelector('[data-selected="false"]')).to.equal(null);
        expect(document.querySelector('[data-disabled="false"]')).to.equal(null);
    });

    it('should omit disabled from an enabled clear action', () => {
        const clear = container.querySelector('[data-cratis-part="clear"]');
        expect(clear?.hasAttribute('data-disabled')).to.equal(false);
    });

    it('should expose invalid and disabled on the disabled control parts', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <Dropdown
                        value='one'
                        options={options}
                        showClear
                        disabled
                        invalid
                        aria-label='Example choice'
                    />
                </CratisComponentsProvider>,
            );
        });

        const rootPart = container.querySelector('[data-cratis-part="root"]');
        const trigger = container.querySelector('[data-cratis-part="trigger"]');
        const clear = container.querySelector('[data-cratis-part="clear"]');

        expect(rootPart?.getAttribute('data-disabled')).to.equal('true');
        expect(rootPart?.getAttribute('data-invalid')).to.equal('true');
        expect(trigger?.getAttribute('data-disabled')).to.equal('true');
        expect(trigger?.getAttribute('data-invalid')).to.equal('true');
        expect(clear?.getAttribute('data-disabled')).to.equal('true');
        expect(container.querySelector('[data-disabled="false"]')).to.equal(null);
        expect(container.querySelector('[data-invalid="false"]')).to.equal(null);
    });

    it('should expose selected and disabled on native multiple options', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <Dropdown
                        multiple
                        value={['one']}
                        options={options}
                        aria-label='Example choices'
                    />
                </CratisComponentsProvider>,
            );
        });

        const multiple = container.querySelector('[data-cratis-part="multiple"]');
        const renderedOptions = multiple?.querySelectorAll('option');

        expect(multiple?.hasAttribute('data-disabled')).to.equal(false);
        expect(renderedOptions?.[0].getAttribute('data-selected')).to.equal('true');
        expect(renderedOptions?.[0].hasAttribute('data-disabled')).to.equal(false);
        expect(renderedOptions?.[1].hasAttribute('data-selected')).to.equal(false);
        expect(renderedOptions?.[1].getAttribute('data-disabled')).to.equal('true');
    });
});
