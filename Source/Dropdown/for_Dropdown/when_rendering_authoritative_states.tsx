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

describe('when Dropdown renders authoritative states', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
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
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const renderDropdown = async (element: React.ReactElement) => {
        await act(async () => {
            root.render(<CratisComponentsProvider>{element}</CratisComponentsProvider>);
        });
    };

    it('should put selected, invalid, and disabled on the root and control pt destinations', async () => {
        await renderDropdown(
            <Dropdown
                value='one'
                options={options}
                invalid
                disabled
                pt={{
                    root: { 'data-testid': 'dropdown-root' },
                    trigger: { 'data-testid': 'dropdown-trigger' },
                }}
            />,
        );

        const dropdownRoot = container.querySelector<HTMLElement>(
            '[data-cratis-part="root"]',
        );
        const trigger = container.querySelector<HTMLElement>(
            '[data-cratis-part="trigger"]',
        );
        for (const element of [dropdownRoot, trigger]) {
            expect(element?.dataset.selected).to.equal('true');
            expect(element?.dataset.invalid).to.equal('true');
            expect(element?.dataset.disabled).to.equal('true');
            expect(element?.hasAttribute('data-open')).to.equal(false);
        }
        expect(dropdownRoot?.getAttribute('data-testid')).to.equal('dropdown-root');
        expect(trigger?.getAttribute('data-testid')).to.equal('dropdown-trigger');
    });

    it('should represent open and option states on their pt destinations', async () => {
        await renderDropdown(
            <Dropdown
                value='one'
                options={options}
                pt={{
                    root: { 'data-testid': 'dropdown-root' },
                    trigger: { 'data-testid': 'dropdown-trigger' },
                    option: { 'data-testid': 'dropdown-option' },
                }}
            />,
        );

        const trigger = container.querySelector<HTMLButtonElement>(
            '[data-cratis-part="trigger"]',
        );
        if (!trigger) throw new Error('Dropdown did not render its trigger.');
        expect(trigger.hasAttribute('data-open')).to.equal(false);

        await act(async () => trigger.click());

        const dropdownRoot = container.querySelector<HTMLElement>(
            '[data-cratis-part="root"]',
        );
        const popover = document.querySelector<HTMLElement>(
            '[data-cratis-part="popover"]',
        );
        const listbox = document.querySelector<HTMLElement>(
            '[data-cratis-part="listbox"]',
        );
        expect(dropdownRoot?.dataset.open).to.equal('true');
        expect(trigger.dataset.open).to.equal('true');
        expect(popover?.dataset.open).to.equal('true');
        expect(listbox?.dataset.open).to.equal('true');

        const renderedOptions = document.querySelectorAll<HTMLElement>(
            '[data-cratis-part="option"]',
        );
        expect(renderedOptions[0].dataset.selected).to.equal('true');
        expect(renderedOptions[0].hasAttribute('data-disabled')).to.equal(false);
        expect(renderedOptions[1].hasAttribute('data-selected')).to.equal(false);
        expect(renderedOptions[1].dataset.disabled).to.equal('true');
        expect(renderedOptions[0].getAttribute('data-testid')).to.equal(
            'dropdown-option',
        );
    });

    it('should represent native multiple selection without false attributes', async () => {
        await renderDropdown(
            <Dropdown<Array<string>>
                multiple
                value={['two']}
                options={options}
                pt={{ multiple: { 'data-testid': 'multiple-control' } }}
            />,
        );

        const control = container.querySelector<HTMLSelectElement>(
            '[data-cratis-part="multiple"]',
        );
        const renderedOptions = container.querySelectorAll<HTMLOptionElement>(
            '[data-cratis-part="multiple"] option',
        );
        expect(control?.dataset.selected).to.equal('true');
        expect(control?.hasAttribute('data-invalid')).to.equal(false);
        expect(control?.hasAttribute('data-disabled')).to.equal(false);
        expect(control?.getAttribute('data-testid')).to.equal('multiple-control');
        expect(renderedOptions[0].hasAttribute('data-selected')).to.equal(false);
        expect(renderedOptions[1].dataset.selected).to.equal('true');
        expect(renderedOptions[1].dataset.disabled).to.equal('true');
    });
});
