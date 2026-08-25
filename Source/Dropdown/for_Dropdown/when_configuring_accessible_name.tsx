// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Dropdown } from '../Dropdown';

describe('when configuring the accessible name', () => {
    let container: HTMLDivElement;
    let root: Root;
    let selectRoot: HTMLElement;
    let trigger: HTMLButtonElement;

    beforeEach(async () => {
        // SAFETY: React's test-environment flag is an intentionally undocumented global absent from the DOM typings.
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <label id='role-label' htmlFor='role'>
                        Advisory role
                    </label>
                    <span id='role-help'>Choose one role</span>
                    <Dropdown
                        id='role'
                        value='frontend'
                        options={[{ label: 'Frontend developer', value: 'frontend' }]}
                        aria-label='Select a role'
                        aria-labelledby='role-label'
                        aria-describedby='role-help'
                        tabIndex={-1}
                    />
                </CratisComponentsProvider>,
            );
        });

        const renderedRoot = container.querySelector<HTMLElement>(
            '.cratis-dropdown[data-cratis-part="root"]',
        );
        const renderedTrigger = container.querySelector<HTMLButtonElement>(
            '[data-cratis-part="trigger"]',
        );
        if (!renderedRoot || !renderedTrigger) {
            throw new Error('Dropdown did not render its root and combobox trigger.');
        }
        selectRoot = renderedRoot;
        trigger = renderedTrigger;
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should put the id on the combobox', () => {
        expect(trigger.id).to.equal('role');
    });

    it('should put the direct accessible name on the combobox', () => {
        expect(trigger.getAttribute('aria-label')).to.equal('Select a role');
    });

    it('should put the label reference on the combobox', () => {
        expect(trigger.getAttribute('aria-labelledby')?.split(' ')).to.include(
            'role-label',
        );
    });

    it('should put the description reference on the combobox', () => {
        expect(trigger.getAttribute('aria-describedby')).to.equal('role-help');
    });

    it('should associate an external label with the combobox', () => {
        expect(trigger.labels?.item(0)?.textContent).to.equal('Advisory role');
    });

    it('should put the tab order on the combobox', () => {
        expect(trigger.tabIndex).to.equal(-1);
    });

    it('should not duplicate the control id on the wrapper', () => {
        expect(selectRoot.id).not.to.equal('role');
    });
});
