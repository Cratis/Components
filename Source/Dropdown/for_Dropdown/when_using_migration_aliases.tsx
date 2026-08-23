// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Dropdown } from '../Dropdown';

describe('when using migration aliases', () => {
    let container: HTMLDivElement;
    let root: Root;
    let dropdownRoot: HTMLElement;
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
                    <span id='role-label'>Role</span>
                    <span id='role-description'>Choose a role</span>
                    <Dropdown
                        inputId='legacy-role'
                        value='developer'
                        options={[{ label: 'Developer', value: 'developer' }]}
                        ariaLabel='Choose role'
                        ariaLabelledBy='role-label'
                        ariaDescribedBy='role-description'
                        ariaInvalid
                        pt={{
                            input: { className: 'product-dropdown-input' },
                            select: { className: 'product-dropdown-select' },
                        }}
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
            throw new Error('Dropdown did not render its root and trigger.');
        }
        dropdownRoot = renderedRoot;
        trigger = renderedTrigger;
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should map the legacy identity and aria aliases to the control', () => {
        expect(trigger.id).to.equal('legacy-role');
        expect(trigger.getAttribute('aria-label')).to.equal('Choose role');
        expect(trigger.getAttribute('aria-labelledby')?.split(' ')).to.include(
            'role-label',
        );
        expect(trigger.getAttribute('aria-describedby')).to.equal('role-description');
        expect(dropdownRoot.dataset.invalid).to.equal('true');
        expect(trigger.getAttribute('aria-invalid')).to.equal('true');
    });

    it('should map legacy select identity and aria values to the control', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <Dropdown
                        options={[{ label: 'Developer', value: 'developer' }]}
                        pt={{
                            select: {
                                id: 'select-role',
                                'aria-label': 'Role from select alias',
                            },
                        }}
                    />
                </CratisComponentsProvider>,
            );
        });
        const renderedTrigger = container.querySelector<HTMLButtonElement>(
            '[data-cratis-part="trigger"]',
        );
        expect(renderedTrigger?.id).to.equal('select-role');
        expect(renderedTrigger?.getAttribute('aria-label')).to.equal(
            'Role from select alias',
        );
    });

    it('should map legacy input and select classes to stable Cratis elements', () => {
        expect(trigger.classList.contains('product-dropdown-input')).to.equal(true);
        expect(dropdownRoot.classList.contains('product-dropdown-select')).to.equal(true);
    });
});
